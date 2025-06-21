import type { Grid, GridId } from '../types/grid_domain';
import type { InstrumentStore } from './instrument_store.svelte';
import type { PlaybackControllerI } from '../interface/PlaybackControllerI';
import type { PlaybackDebugMetrics } from '../types/debug_domain';
import { SvelteMap } from 'svelte/reactivity';
import type { TimingWorkerMessage, TimingWorkerResponse } from '../audio/timing-worker';
import { calculateSectionIndexForGrid } from '$lib';

export class WorkerPlaybackStore implements PlaybackControllerI {
  private instrumentStore: InstrumentStore;
  private worker: Worker | null = null;

  private playingGrid: Grid | undefined = $state(undefined);
  private recentlyPlayedGrid: Grid | undefined;
  private playingFile: boolean = $state(false);
  private currentSectionIndex: number = -1;
  private sectionChangeCallback: ((gridId: GridId, sectionIndex: number) => void) | undefined;
  private callbackScreenWidth: number | undefined;
  private currentlyPlayingColumnInGrid: SvelteMap<GridId, number> = new SvelteMap();
  
  // Track completion
  private completedLoops = 0;
  private targetLoops = 0;
  private onCompleteCallback: ((grid: Grid) => void) | undefined;

  // Debug metrics for playback timing
  public debugMetrics = $state<PlaybackDebugMetrics>({
    lastBeatTime: 0,
    delta: 0,
    expected: 0,
    onBeat: 0,
    position: {
      repetition: 0,
      bar: 0,
      beat: 0,
      beatDivision: 0,
      cell: 0,
      playingCell: 0,
      gridCells: 0,
      gridId: '',
      gridName: ''
    }
  });

  constructor(instrumentStore: InstrumentStore) {
    this.instrumentStore = instrumentStore;
    this.initializeWorker();
  }

  private initializeWorker() {
    if (typeof window === 'undefined') return;
    
    this.worker = new Worker(
      new URL('../audio/timing-worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    this.worker.onmessage = (event: MessageEvent<TimingWorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };
  }

  private handleWorkerMessage(data: TimingWorkerResponse) {
    if (data.type === 'beat') {
      this.onBeat(data.timestamp, data.beatNumber);
    }
  }

  mostRecentlyPlayedGrid(): Grid | undefined {
    return this.recentlyPlayedGrid;
  }

  isPlayingFile(): boolean {
    return this.playingFile;
  }

  isPlayingGrid(id: GridId): boolean {
    return this.playingGrid?.id === id;
  }

  togglePlayback(
    grid: Grid,
    loops: number,
    onComplete?: (grid: Grid) => void,
    onSectionChange?: (gridId: GridId, sectionIndex: number) => void,
    screenWidth?: number
  ) {
    const playing = this.playingGrid?.id === grid.id;
    if (playing) {
      this.stop();
    } else {
      this.startPlayback(grid, loops, onComplete, onSectionChange, screenWidth);
    }
  }

  private startPlayback(
    grid: Grid,
    loops: number,
    onComplete?: (grid: Grid) => void,
    onSectionChange?: (gridId: GridId, sectionIndex: number) => void,
    screenWidth?: number
  ) {
    this.playingGrid = grid;
    this.recentlyPlayedGrid = grid;
    this.currentSectionIndex = -1;
    this.sectionChangeCallback = onSectionChange;
    this.callbackScreenWidth = screenWidth;
    this.completedLoops = 0;
    this.targetLoops = loops;
    this.onCompleteCallback = onComplete;
    this.currentlyPlayingColumnInGrid.set(grid.id, 0);

    // Start the worker with precise timing
    if (this.worker) {
      this.worker.postMessage({
        type: 'start',
        interval: grid.msPerBeatDivision,
        gridId: grid.id
      } as TimingWorkerMessage);
    }
  }
  async togglePlayGridsInSequence(
    grids: Grid[],
    onSectionChange?: (gridId: GridId, sectionIndex: number) => void,
    screenWidth?: number
  ) {
    if (this.playingGrid) {
      this.stop();
    } else {
      this.playingFile = true;
      for (const grid of grids.sort((a, b) => a.index - b.index)) {
        await new Promise<void>((resolve) => {
          this.togglePlayback(
            grid,
            grid.config.repetitions,
            (grid: Grid) => resolve(),
            onSectionChange,
            screenWidth
          );
        });
      }
      this.stop();
    }
  }

  stop() {
    this.playingFile = false;
    this.playingGrid = undefined;
    this.completedLoops = 0;
    this.targetLoops = 0;
    this.onCompleteCallback = undefined;
    this.currentSectionIndex = -1;
    this.sectionChangeCallback = undefined;
    this.callbackScreenWidth = undefined;

    if (this.worker) {
      this.worker.postMessage({ type: 'stop' } as TimingWorkerMessage);
    }
  }

  restartInterval() {
    // For worker-based timing, we need to stop and restart
    if (this.playingGrid && this.worker) {
      this.worker.postMessage({ type: 'stop' } as TimingWorkerMessage);
      this.worker.postMessage({
        type: 'start',
        interval: this.playingGrid.msPerBeatDivision,
        gridId: this.playingGrid.id
      } as TimingWorkerMessage);
    }
  }

  private calculateSectionIndex(grid: Grid, column: number, screenWidth?: number): number {
    return calculateSectionIndexForGrid(grid, column, screenWidth);
  }

  private onBeat(timestamp: number, beatNumber: number) {
    if (!this.playingGrid) return;
    const onBeatStart = performance.now();

    const grid = this.playingGrid;
    const playingCell = beatNumber % grid.gridCols;
    this.currentlyPlayingColumnInGrid.set(grid.id, playingCell);    // Check for completion
    if (beatNumber > 0 && beatNumber % grid.gridCols === 0) {
      const isInfiniteLoop = this.targetLoops === 0;
      if (!isInfiniteLoop && ++this.completedLoops >= this.targetLoops) {
        console.log(`Finished playing ${this.targetLoops} loops of ${grid.config.name}`);
        const callback = this.onCompleteCallback; // Store callback before stopping
        
        // Don't call this.stop() here - let the completion callback handle state
        // Only stop the worker timing
        if (this.worker) {
          this.worker.postMessage({ type: 'stop' } as TimingWorkerMessage);
        }
        this.playingGrid = undefined;
        this.completedLoops = 0;
        this.targetLoops = 0;
        this.onCompleteCallback = undefined;
        this.currentSectionIndex = -1;
        this.sectionChangeCallback = undefined;
        this.callbackScreenWidth = undefined;
        
        callback?.(grid);
        return;
      }
    }

    // CRITICAL: Section change detection and scrolling - this still happens on main thread
    // but the timing precision comes from the worker
    if (this.sectionChangeCallback) {
      const newSectionIndex = this.calculateSectionIndex(grid, playingCell, this.callbackScreenWidth);
      if (newSectionIndex !== this.currentSectionIndex) {
        this.currentSectionIndex = newSectionIndex;
        this.sectionChangeCallback(grid.id, newSectionIndex);
      }
    }

    // Audio playback - this is the critical timing part
    grid.rows.forEach((row, rowI) => {
      const cell = row?.cells[playingCell];
      if (!cell || cell.hits.length === 0 || cell.cells_occupied < 1) return;

      if (cell.hits.length === 1) {
        this.instrumentStore.playHit(cell.hits[0]);
      } else {
        const mergedCellTime = grid.msPerBeatDivision * cell.cells_occupied;
        cell.hits.forEach((hit, i) => {
          const delay = (i / cell.hits.length) * mergedCellTime;
          // Use setTimeout for sub-beat timing - this is still main thread
          // but the primary beat timing comes from worker
          setTimeout(() => {
            this.instrumentStore.playHit(hit);
          }, delay);
        });
      }
    });

    this.updateDebugMetrics(grid, beatNumber, playingCell, onBeatStart, timestamp);
  }

  private updateDebugMetrics(grid: Grid, count: number, playingCell: number, onBeatStart: number, workerTimestamp: number) {
    const now = performance.now();
    const expected = grid.msPerBeatDivision;
    const delta = this.debugMetrics.lastBeatTime === 0 ? 0 : now - this.debugMetrics.lastBeatTime;
    this.debugMetrics.lastBeatTime = now;
    this.debugMetrics.delta = delta;
    this.debugMetrics.expected = expected;
    this.debugMetrics.onBeat = now - onBeatStart;
    this.debugMetrics.position = {
      repetition: Math.floor(count / grid.gridCols),
      bar: Math.floor(count / (grid.config.beatsPerBar * grid.config.beatDivisions)) % grid.config.bars,
      beat: Math.floor(count / grid.config.beatDivisions) % grid.config.beatsPerBar,
      beatDivision: count % grid.config.beatDivisions,
      cell: count,
      playingCell,
      gridCells: grid.gridCols,
      gridId: grid.id,
      gridName: grid.config.name
    };
  }

  getCurrentlyPlayingColumn(gridId: string): number {
    return this.currentlyPlayingColumnInGrid.get(gridId) ?? 0;
  }
}
