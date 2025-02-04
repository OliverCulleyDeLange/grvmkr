<script lang="ts">
	import { GridModel } from '$lib';
	import type { InstrumentManager } from '$lib';
	import type { CellLocator } from '$lib';
	import Grid from './Grid.svelte';
	import GridConfig from './GridConfig.svelte';

	let { instrumentManager }: { instrumentManager: InstrumentManager } = $props();

	let grids: GridModel[] = $state([new GridModel(instrumentManager)]);
	let activeGrid = $state(grids[0]);
	let msPerBeatDivision = $derived(activeGrid.msPerBeatDivision);

	// Playing state
	let playing = $state(false);
	let nextCount: number = 0;
	let playingIntervalId: number | undefined = undefined;

	$effect(() => {
		if (playing) {
			onBeat();
			playingIntervalId = setInterval(() => {
				onBeat();
			}, msPerBeatDivision);
		} else {
			stop();
		}
		return () => {
			clearInterval(playingIntervalId);
		};
	});

	async function togglePlaying(grid: GridModel, newPlaying: boolean): Promise<void> {
		grids.forEach((grid) => {
			grid.playing = false;
		});
		if (newPlaying) {
			await instrumentManager.initInstruments();
			activeGrid = grid;
			grid.playing = newPlaying;
		}
		playing = newPlaying;
	}

	function stop() {
		clearInterval(playingIntervalId);
		playingIntervalId = undefined;
		playing = false;
		nextCount = 0;
	}

	async function onBeat() {
		let count = nextCount++;
		let cell = count % activeGrid.gridCols;
		let repetition = Math.floor(count / activeGrid.gridCols);
		let bar = Math.floor(count / (activeGrid.beatsPerBar * activeGrid.beatNoteFraction)) % activeGrid.bars;
		let beat = Math.floor(count / activeGrid.beatNoteFraction) % activeGrid.beatsPerBar;
		let beatDivision = count % activeGrid.beatNoteFraction;

		console.log(
			`Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${activeGrid.gridCols})`
		);

		for (let row of activeGrid.rows) {
			let locator: CellLocator = {
				row: row.instrument.gridIndex,
				notationLocator: { bar: bar, beat: beat, division: beatDivision }
			};
			instrumentManager.playHit(activeGrid.currentHit(locator));
		}
		activeGrid.currentColumn = cell;
	}

	async function onTapGridCell(locator: CellLocator, grid: GridModel): Promise<void> {
		grid.toggleLocation(locator);
	}

	function addGrid() {
		grids.push(new GridModel(instrumentManager));
	}
</script>

{#each grids as grid}
		<GridConfig
			{grid}
			togglePlaying={(playing) => {
				togglePlaying(grid, playing);
			}}
		/>
		<Grid
			{grid}
			onTapGridCell={(locator) => {
				onTapGridCell(locator, grid);
			}}
		/>
{/each}

<div class="flex">
	<button onclick={addGrid} class="btn btn-outline btn-xs m-2 ml-auto print:hidden">
		Add Grid
	</button>
</div>
