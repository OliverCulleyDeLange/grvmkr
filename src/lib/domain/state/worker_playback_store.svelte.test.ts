// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Grid } from '$lib';
import type { InstrumentStore } from './instrument_store.svelte';
import { WorkerPlaybackStore } from './worker_playback_store.svelte';
import type { TimingWorkerResponse } from '../audio/timing-worker';

class ControllableWorker {
	static latest: ControllableWorker;
	onmessage: ((event: MessageEvent<TimingWorkerResponse>) => void) | null = null;
	postMessage = vi.fn();

	constructor() {
		ControllableWorker.latest = this;
	}

	emit(data: TimingWorkerResponse) {
		this.onmessage?.(new MessageEvent('message', { data }));
	}
}

function makeGrid(): Grid {
	return {
		id: 'grid-1',
		index: 0,
		config: {
			name: 'Test',
			bpm: 120,
			bars: 1,
			beatsPerBar: 2,
			beatDivisions: 1,
			repetitions: 1
		},
		toolsExpanded: false,
		rows: [
			{
				instrument: {
					id: 'instrument-1',
					name: 'Test',
					gridIndex: 0,
					muted: false,
					soloed: false,
					hitTypes: new Map()
				},
				cells: [
					{ hits: [{ instrumentId: 'instrument-1', hitId: 'hit-1' }], cells_occupied: 1 },
					{ hits: [], cells_occupied: 1 }
				]
			}
		],
		msPerBeatDivision: 500,
		gridCols: 2
	};
}

function playbackNow() {
	return performance.timeOrigin + performance.now();
}

describe('WorkerPlaybackStore', () => {
	let playHit: ReturnType<typeof vi.fn>;
	let store: WorkerPlaybackStore;

	beforeEach(() => {
		globalThis.Worker = ControllableWorker as unknown as typeof Worker;
		playHit = vi.fn().mockResolvedValue(undefined);
		store = new WorkerPlaybackStore({
			playHit,
			stopScheduledAudio: vi.fn()
		} as unknown as InstrumentStore);
	});

	it('schedules audio against the worker timestamp', () => {
		store.togglePlayback(makeGrid(), 0);
		ControllableWorker.latest.emit({
			type: 'beat',
			timestamp: playbackNow() + 80,
			beatNumber: 0,
			playingCell: 0,
			gridId: 'grid-1'
		});

		expect(playHit).toHaveBeenCalledOnce();
		expect(playHit.mock.calls[0][1]).toBeGreaterThan(0);
	});

	it('resolves sequential playback when stopped', async () => {
		const playback = store.togglePlayGridsInSequence([makeGrid()]);
		await Promise.resolve();

		store.stop();

		await expect(playback).resolves.toBeUndefined();
		expect(store.isPlayingFile()).toBe(false);
	});

	it('drops stale beats instead of replaying them in a burst', () => {
		store.togglePlayback(makeGrid(), 0);
		ControllableWorker.latest.emit({
			type: 'beat',
			timestamp: playbackNow() - 400,
			beatNumber: 0,
			playingCell: 0,
			gridId: 'grid-1'
		});

		expect(playHit).not.toHaveBeenCalled();
	});

	it('does not discard current beats when the worker performance clock has a different origin', () => {
		store.togglePlayback(makeGrid(), 0);
		ControllableWorker.latest.emit({
			type: 'beat',
			timestamp: playbackNow() + 80,
			beatNumber: 0,
			playingCell: 0,
			gridId: 'grid-1'
		});

		expect(playHit).toHaveBeenCalledOnce();
	});
});
