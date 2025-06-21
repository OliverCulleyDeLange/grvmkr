import type { Grid, GridId } from '$lib';
import { SvelteMap } from 'svelte/reactivity';
import type { PlaybackControllerI } from '../interface/PlaybackControllerI';
import type { InstrumentStore } from './instrument_store.svelte';
import type { PlaybackDebugMetrics } from '../types/debug_domain';
import { measurePaint } from '$lib/util/measurePerf';
import { calculateSectionIndexForGrid } from '$lib/util/gridSectionUtils';

export class PlaybackStore implements PlaybackControllerI {
	private instrumentStore: InstrumentStore;

	private playingGrid: Grid | undefined = $state(undefined);
	private recentlyPlayedGrid: Grid | undefined;
	private playingIntervalId: ReturnType<typeof setInterval> | undefined;
	private nextColumn: number = 0;
	private playingFile: boolean = $state(false);
	private currentSectionIndex: number = -1;
	private sectionChangeCallback: ((gridId: GridId, sectionIndex: number) => void) | undefined;
	private callbackScreenWidth: number | undefined;
	// Allows recalculation of only the beat indicator state, to improve performance.
	// Otherwise we're mapping entire grid state every time.
	private currentlyPlayingColumnInGrid: SvelteMap<GridId, number> = new SvelteMap();

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
	}

	mostRecentlyPlayedGrid(): Grid | undefined {
		return this.recentlyPlayedGrid
	}

	isPlayingFile(): boolean {
		return this.playingFile;
	}

	isPlayingGrid(id: GridId): boolean {
		return this.playingGrid?.id === id
	}

	togglePlayback(
		grid: Grid,
		loops: number,
		onComplete?: (grid: Grid) => void,
		onSectionChange?: (gridId: GridId, sectionIndex: number) => void,
		screenWidth?: number
	) {
		const playing = this.playingGrid?.id === grid.id
		if (playing) {
			this.stop();
			this.playingGrid = undefined
		} else {
			this.playingGrid = grid;
			this.recentlyPlayedGrid = grid;
			this.nextColumn = 0;
			this.currentSectionIndex = -1;
			this.sectionChangeCallback = onSectionChange;
			this.callbackScreenWidth = screenWidth;
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
	}

	async togglePlayGridsInSequence(
		grids: Grid[],
		onSectionChange?: (gridId: GridId, sectionIndex: number, screenWidth?: number) => void,
		screenWidth?: number
	) {
		if (this.playingGrid) {
			this.stop()
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
			this.stop()
		}
	}

	stop() {
		this.playingFile = false;
		this.playingGrid = undefined;
		clearInterval(this.playingIntervalId);
		this.playingIntervalId = undefined;
		this.nextColumn = 0;
		this.currentSectionIndex = -1;
		this.sectionChangeCallback = undefined;
		this.callbackScreenWidth = undefined;
	}

	restartInterval() {
		clearInterval(this.playingIntervalId);
		if (this.playingGrid) {
			this.playingIntervalId = setInterval(() => {
				this.onBeat();
			}, this.playingGrid.msPerBeatDivision);
		}
	}

	// Calculate which section a given column belongs to based on grid configuration
	private calculateSectionIndex(grid: Grid, column: number, screenWidth?: number): number {
		return calculateSectionIndexForGrid(grid, column, screenWidth);
	}

	private updateDebugMetrics(grid: Grid, count: number, playingCell: number, onBeatStart: number) {
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

	private onBeat() {
		if (!this.playingGrid) return;
		const onBeatStart = performance.now();

		const grid = this.playingGrid;
		const count = this.nextColumn++;
		const playingCell = count % grid.gridCols;
		this.currentlyPlayingColumnInGrid.set(grid.id, playingCell);

		// Check for section changes and trigger callback
		if (this.sectionChangeCallback) {
			const newSectionIndex = this.calculateSectionIndex(grid, playingCell, this.callbackScreenWidth);
			if (newSectionIndex !== this.currentSectionIndex) {
				this.currentSectionIndex = newSectionIndex;
				this.sectionChangeCallback(grid.id, newSectionIndex);
			}
		} else { console.error('No section change callback set'); }

		measurePaint()

		// Move updateDebugMetrics after all work is done
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

		this.updateDebugMetrics(grid, count, playingCell, onBeatStart);
	}

	getCurrentlyPlayingColumn(gridId: string): number {
		return this.currentlyPlayingColumnInGrid.get(gridId) ?? 0;
	}
}
