import type { Grid } from '$lib/types/domain/grid_domain';
import type { InstrumentStore } from './instrument_store.svelte';

export class PlaybackStore {
	private instrumentStore: InstrumentStore;
	private playingGrid: Grid | undefined;
	private playingIntervalId: number | undefined;
	private nextCount: number = 0;

	constructor(instrumentStore: InstrumentStore) {
		this.instrumentStore = instrumentStore;
	}

	play(grid: Grid) {
		this.playingGrid = grid;
		this.onBeat();
		this.playingIntervalId = setInterval(() => {
			this.onBeat();
		}, grid.msPerBeatDivision);
	}

	stop() {
		clearInterval(this.playingIntervalId);
		this.playingIntervalId = undefined;
		this.nextCount = 0;
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
		const count = this.nextCount++;
		const playingCell = count % grid.gridCols;

		grid.currentlyPlayingColumn = playingCell;

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
}
