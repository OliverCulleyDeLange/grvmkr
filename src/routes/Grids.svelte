<script lang="ts">
	import { mapRowsToGridUi, type GridId, type InstrumentManager, type OnTapGridCell } from '$lib';
	import type { SvelteMap } from 'svelte/reactivity';
	import Grid from './Grid.svelte';
	import type { Grid as GridType } from '$lib/types/domain/grid_domain';
	import GridConfig from './GridConfig.svelte';

	let {
		instrumentManager,
		grids,
		currentlyPlayingGrid,
		currentColumn,
		onTogglePlaying,
		onTapGridCell
	}: {
		instrumentManager: InstrumentManager;
		grids: SvelteMap<GridId, GridType>;
		currentlyPlayingGrid: GridType | undefined;
		currentColumn: number;
		onTogglePlaying: (newPlaying: boolean, gridKey: GridId) => void;
		onTapGridCell: OnTapGridCell;
	} = $props();
</script>

{#each [...grids.entries()] as [gridKey, grid]}
	<GridConfig
		{grid}
		playing={currentlyPlayingGrid == grid}
		togglePlaying={(newPlaying) => onTogglePlaying(newPlaying, gridKey)}
	/>
	<Grid
		{grid}
		gridUi={mapRowsToGridUi(grid, instrumentManager)}
		{currentColumn}
		{instrumentManager}
		{onTapGridCell}
		onRemoveGrid={() => grids.delete(gridKey)}
	/>
{/each}
