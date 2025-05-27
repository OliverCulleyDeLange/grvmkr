import type { Grid } from '$lib/types/domain/grid_domain';
import type { InstrumentStore } from './instrument_store.svelte';

export type PlaybackStore = {
	play: (grid: Grid) => void;
	stop: () => void;
	restartInterval: () => void;
};

// TODO Not sure if its the best to have store dependencies like this but it'll do for now
export const createPlaybackStore = (instrumentStore: InstrumentStore): PlaybackStore => {
	let playingGrid: Grid | undefined;
	let playingIntervalId: number | undefined = undefined;
	let nextCount: number = 0;

	function play(grid: Grid) {
		playingGrid = grid;
		onBeat();
		playingIntervalId = setInterval(() => {
			onBeat();
		}, playingGrid.msPerBeatDivision);
	}

	function stop() {
		clearInterval(playingIntervalId);
		playingIntervalId = undefined;
		nextCount = 0;
	}

	function restartInterval() {
		clearInterval(playingIntervalId);
		if (playingGrid) {
			playingIntervalId = setInterval(() => {
				onBeat();
			}, playingGrid.msPerBeatDivision);
		}
	}

	async function onBeat() {
		if (!playingGrid) return;
		let currentlyPlayingGrid = playingGrid;
		let count = nextCount++;

		let playingCell = count % currentlyPlayingGrid.gridCols;
		// Update
		currentlyPlayingGrid.currentlyPlayingColumn = playingCell;

		let repetition = Math.floor(count / currentlyPlayingGrid.gridCols);
		let bar =
			Math.floor(
				count /
					(currentlyPlayingGrid.config.beatsPerBar * currentlyPlayingGrid.config.beatDivisions)
			) % currentlyPlayingGrid.config.bars;
		let beat =
			Math.floor(count / currentlyPlayingGrid.config.beatDivisions) %
			currentlyPlayingGrid.config.beatsPerBar;
		let beatDivision = count % currentlyPlayingGrid.config.beatDivisions;

		console.log(
			`Repetition (${currentlyPlayingGrid.msPerBeatDivision}ms): ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, playingCell: ${playingCell}, gridCells; ${currentlyPlayingGrid.gridCols})`
		);

		currentlyPlayingGrid.rows.forEach((row, rowI) => {
			let cell = currentlyPlayingGrid.rows[rowI]?.cells[playingCell];
			if (cell == undefined || cell.hits.length == 0 || cell.cells_occupied < 1) {
				return;
			}
			if (cell.hits.length === 1) {
				instrumentStore.playHit(cell.hits[0]);
			} else {
				let mergedCellTime = currentlyPlayingGrid.msPerBeatDivision * cell.cells_occupied;

				cell.hits.forEach((hit, i) => {
					let delay = (i / cell.hits.length) * mergedCellTime;
					setTimeout(() => {
						instrumentStore.playHit(hit);
					}, delay);
				});
			}
		});
	}

	return { play, stop, restartInterval };
};
