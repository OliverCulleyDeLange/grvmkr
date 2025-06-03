import type { Grid, GridId } from '$lib';
import { SvelteMap } from 'svelte/reactivity';
import type { PlaybackControllerI } from '../interface/PlaybackControllerI';
import type { InstrumentStore } from './instrument_store.svelte';

export class PlaybackStore implements PlaybackControllerI {
	private instrumentStore: InstrumentStore;
	private playingGrid: Grid | undefined;
	private playingIntervalId: number | undefined;
	private nextColumn: number = 0;
	private playingFile: boolean = $state(false);
	// Allows recalculation of only the beat indicator state, to improve performance.
	// Otherwise we're mapping entire grid state every time.
	private currentlyPlayingColumnInGrid: SvelteMap<GridId, number> = new SvelteMap();

	constructor(instrumentStore: InstrumentStore) {
		this.instrumentStore = instrumentStore;
	}

	isPlayingFile(): boolean {
		return this.playingFile;
	}

	// Plays the grid 'loops' number of times, then calls 'onComplete'
	// 0 loops for infinite looping
	play(grid: Grid, loops: number, onComplete?: (grid: Grid) => void) {
		// this.stop(); // Stop any existing playback
		this.playingGrid = grid;
		this.nextColumn = 0;
		this.currentlyPlayingColumnInGrid.set(grid.id, 0);
		const totalSteps = grid.gridCols;
		let completedLoops = 0;
		const inifiniteLoop = loops == 0;

		this.onBeat();
		this.playingIntervalId = setInterval(() => {
			if (this.nextColumn % totalSteps == 0) {
				// Grid finished playing
				if (!inifiniteLoop && ++completedLoops >= loops) {
					clearInterval(this.playingIntervalId);
					this.playingIntervalId = undefined;
					this.nextColumn = 0;
					console.log(
						`Finished playing ${loops} loops of ${grid.config.name}`,
						$state.snapshot(grid)
					);
					onComplete?.(grid);
				} else {
					this.onBeat();
				}
			} else {
				this.onBeat();
			}
		}, grid.msPerBeatDivision);
	}

	async playGridsInSequence(
		grids: Grid[],
		onPlay?: (grid: Grid) => void,
		onStop?: (grid: Grid) => void
	) {
		this.playingFile = true;
		for (const grid of grids.sort((a, b) => a.index - b.index)) {
			await new Promise<void>((resolve) => {
				onPlay?.(grid);
				this.play(grid, grid.config.repetitions, (grid: Grid) => {
					resolve();
					onStop?.(grid);
				});
			});
		}
		this.stop();
	}

	stop() {
		console.log('Stopping playback');
		this.playingFile = false;
		clearInterval(this.playingIntervalId);
		this.playingIntervalId = undefined;
		this.nextColumn = 0;
	}

	restartInterval() {
		clearInterval(this.playingIntervalId);
		if (this.playingGrid) {
			this.playingIntervalId = setInterval(() => {
				this.onBeat();
			}, this.playingGrid.msPerBeatDivision);
		}
	}

	private onBeat() {
		if (!this.playingGrid) return;

		const grid = this.playingGrid;
		const count = this.nextColumn++;
		const playingCell = count % grid.gridCols;

		this.currentlyPlayingColumnInGrid.set(grid.id, playingCell);

		const repetition = Math.floor(count / grid.gridCols);
		const bar =
			Math.floor(count / (grid.config.beatsPerBar * grid.config.beatDivisions)) % grid.config.bars;
		const beat = Math.floor(count / grid.config.beatDivisions) % grid.config.beatsPerBar;
		const beatDivision = count % grid.config.beatDivisions;

		console.log(
			`Repetition (${grid.msPerBeatDivision}ms): ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, playingCell: ${playingCell}, gridCells; ${grid.gridCols})`
		);

		grid.rows.forEach((row, rowI) => {
			const cell = row?.cells[playingCell];
			if (!cell || cell.hits.length === 0 || cell.cells_occupied < 1) return;

			if (cell.hits.length === 1) {
				this.instrumentStore.playHit(cell.hits[0]);
			} else {
				const mergedCellTime = grid.msPerBeatDivision * cell.cells_occupied;
				cell.hits.forEach((hit, i) => {
					const delay = (i / cell.hits.length) * mergedCellTime;
					setTimeout(() => {
						this.instrumentStore.playHit(hit);
					}, delay);
				});
			}
		});
	}

	getCurrentlyPlayingColumn(gridId: string): number {
		return this.currentlyPlayingColumnInGrid.get(gridId) ?? 0;
	}
}
