<script lang="ts">
	import { GridModel } from '$lib';
	import type { CellLocator } from '$lib/types';
	import Grid from './Grid.svelte';
	import GridConfig from './GridConfig.svelte';

	let grids: GridModel[] = $state([new GridModel()]);
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
        grids.forEach((grid) => {grid.playing = false})
        if (newPlaying){
            await initInstruments();
            activeGrid = grid
            grid.playing = newPlaying
        }
        playing = newPlaying;
	}
    
    async function initInstruments() {
        for (let grid of grids){
            await grid.initInstruments()
        }
    }

	function stop() {
		clearInterval(playingIntervalId);
		playingIntervalId = undefined;
		playing = false;
		nextCount = 0;
	}

	async function onBeat() {
		activeGrid.playBeat(nextCount++);
	}

	async function onTapGridCell(locator: CellLocator, grid: GridModel): Promise<void> {
		grid.toggleLocation(locator);
	}

    function addGrid() {
        grids.push(new GridModel())
    }
</script>


	{#each grids as grid}
		<GridConfig {grid} togglePlaying={(playing) => {togglePlaying(grid, playing)}} />
		<Grid {grid} onTapGridCell={(locator) => {onTapGridCell(locator, grid)}} />
	{/each}

	<button
		onclick={addGrid}
		class="my-2 rounded-lg border-2 border-gray-800 px-2 py-1 font-semibold text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 print:hidden"
	>
		Add Grid
	</button>
