<script lang="ts">
	import { GridModel } from '$lib';
	import type { InstrumentManager } from '$lib';
	import type { CellLocator } from '$lib';
	import Grid from './Grid.svelte';
	import GridConfig from './GridConfig.svelte';

	let { 
		instrumentManager, grids,currentlyPlayingGrid, onTogglePlaying
	}: { 
		instrumentManager: InstrumentManager;
		grids: Map<number, GridModel>;
		currentlyPlayingGrid: GridModel;
		onTogglePlaying: (newPlaying: boolean, gridKey: number) => void
	 } = $props();

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
			playing={currentlyPlayingGrid == grid}
			togglePlaying={(newPlaying) => onTogglePlaying(newPlaying, gridKey)}
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
