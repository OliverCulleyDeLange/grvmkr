// Web Worker for audio timing
// This runs in a separate thread, isolated from main thread layout operations

export interface TimingWorkerMessage {
	type: 'start' | 'stop' | 'beat';
	interval?: number;
	gridId?: string;
	sectionIndex?: number;
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
	private nextBeatAt = 0;
	private readonly scheduleAheadMs = 100;

	start(interval: number, gridId: string) {
		this.stop(); // Clear any existing interval
		this.beatCount = 0;
		this.currentGridId = gridId;
		this.currentInterval = interval;
		// Worker and window performance.now() clocks may have different time origins.
		// Send epoch-based high-resolution timestamps so the main thread can safely
		// calculate scheduling delays and identify genuinely stale messages.
		this.nextBeatAt = performance.timeOrigin + performance.now() + this.scheduleAheadMs;

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
		this.currentInterval = 0;
	}

	private sendBeat() {
		const timestamp = this.nextBeatAt;

		self.postMessage({
			type: 'beat',
			timestamp,
			beatNumber: this.beatCount,
			playingCell: this.beatCount, // Will be calculated properly in main thread
			gridId: this.currentGridId
		} as TimingWorkerResponse);

		this.beatCount++;
		this.nextBeatAt += this.currentInterval;
	}

	private currentInterval = 0;
}

const worker = new TimingWorker();

self.onmessage = (event: MessageEvent<TimingWorkerMessage>) => {
	const { type, interval, gridId } = event.data;

	switch (type) {
		case 'start':
			if (interval && gridId) {
				worker.start(interval, gridId);
			}
			break;
		case 'stop':
			worker.stop();
			break;
	}
};
