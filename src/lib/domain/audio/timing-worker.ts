// Web Worker for audio timing
// This runs in a separate thread, isolated from main thread layout operations

export interface TimingWorkerMessage {
	type: 'start' | 'stop' | 'beat';
	interval?: number;
	gridId?: string;
	sectionIndex?: number;
	mainTimestamp?: number;
}

export interface TimingWorkerResponse {
	type: 'beat' | 'section-change';
	timestamp: number;
	beatNumber: number;
	playingCell: number;
	gridId?: string;
	sectionIndex?: number;
}

class TimingWorker {
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private beatCount = 0;
	private currentGridId: string | null = null;
	private mainTimestampAtStart = 0;
	private workerTimestampAtStart = 0;
	private readonly scheduleAheadMs = 100;

	start(interval: number, gridId: string, mainTimestamp: number) {
		this.stop(); // Clear any existing interval
		this.beatCount = 0;
		this.currentGridId = gridId;
		this.mainTimestampAtStart = mainTimestamp;
		this.workerTimestampAtStart = performance.now();

		// Initial beat
		this.sendBeat();

		// Schedule subsequent beats
		this.intervalId = setInterval(() => {
			this.sendBeat();
		}, interval);
	}

	stop() {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.beatCount = 0;
		this.currentGridId = null;
	}

	private sendBeat() {
		// performance.timeOrigin can be inconsistent between Firefox processes.
		// Translate elapsed worker time onto the main thread's performance clock
		// instead of comparing absolute time origins across contexts.
		const elapsedWorkerTime = performance.now() - this.workerTimestampAtStart;
		const timestamp = this.mainTimestampAtStart + elapsedWorkerTime + this.scheduleAheadMs;

		self.postMessage({
			type: 'beat',
			timestamp,
			beatNumber: this.beatCount,
			playingCell: this.beatCount, // Will be calculated properly in main thread
			gridId: this.currentGridId
		} as TimingWorkerResponse);

		this.beatCount++;
	}
}

const worker = new TimingWorker();

self.onmessage = (event: MessageEvent<TimingWorkerMessage>) => {
	const { type, interval, gridId, mainTimestamp } = event.data;

	switch (type) {
		case 'start':
			if (interval && gridId && mainTimestamp !== undefined) {
				worker.start(interval, gridId, mainTimestamp);
			}
			break;
		case 'stop':
			worker.stop();
			break;
	}
};
