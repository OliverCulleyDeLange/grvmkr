<script lang="ts">
	import { GridModel } from '$lib';
	import type { InstrumentManager } from '$lib';
	import type { CellLocator } from '$lib';
	import { SvelteMap } from 'svelte/reactivity';
	import Grid from './Grid.svelte';
	import GridConfig from './GridConfig.svelte';

	let { 
		instrumentManager, grids, activeGrid, nextCount, playing, 
	}: { 
		instrumentManager: InstrumentManager;
		grids: Map<number, GridModel>;
		activeGrid: GridModel | undefined;
		nextCount: number;
		playing: boolean;
	 } = $props();

	// let grids: SvelteMap<number,GridModel> = new SvelteMap([[0, new GridModel(instrumentManager)]]);
	// let activeGrid: GridModel | undefined = $state(grids.get(0));
	let msPerBeatDivision = $derived(activeGrid?.msPerBeatDivision);

	// // Playing state
	// let playing = $state(false);
	// let nextCount: number = 0;
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
		if (!activeGrid) return
		let count = nextCount++;
		let cell = count % activeGrid.gridCols;
		let repetition = Math.floor(count / activeGrid.gridCols);
		let bar = Math.floor(count / (activeGrid.beatsPerBar * activeGrid.beatNoteFraction)) % activeGrid.bars;
		let beat = Math.floor(count / activeGrid.beatNoteFraction) % activeGrid.beatsPerBar;
		let beatDivision = count % activeGrid.beatNoteFraction;

		console.log(
			`Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${activeGrid.gridCols})`
		);

		activeGrid.rows.forEach((row, rowI) => {
			let locator: CellLocator = {
				row: rowI,
				notationLocator: { bar: bar, beat: beat, division: beatDivision }
			};
			instrumentManager.playHit(activeGrid?.currentHit(locator));
		})
		activeGrid.currentColumn = cell;
	}

	async function onTapGridCell(locator: CellLocator, grid: GridModel): Promise<void> {
		grid.toggleLocation(locator);
	}

	function addGrid() {
		let maxKey = Math.max(...grids.keys())
		let key = maxKey >=0 ? maxKey : 0
		grids.set(key + 1, new GridModel(instrumentManager));
	}

	function removeGrid(key: number) {
		grids.delete(key)
	}
</script>

{#each [...grids.entries()] as [gridKey, grid]}
		<GridConfig
			{grid}
			togglePlaying={(playing) => {
				togglePlaying(grid, playing);
			}}
		/>
		<Grid
			{grid} {instrumentManager}
			onTapGridCell={(locator) => {
				onTapGridCell(locator, grid);
			}}
			onRemoveGrid={() => removeGrid(gridKey)}
		/>
{/each}

<div class="flex">
	<button onclick={addGrid} class="btn btn-outline btn-xs m-2 ml-auto print:hidden">
		Add Grid
	</button>
</div>
