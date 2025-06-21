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
  
  start(interval: number, gridId: string) {
    this.stop(); // Clear any existing interval
    this.beatCount = 0;
    this.currentGridId = gridId;
    
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
    const timestamp = performance.now();
    
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
