<script lang="ts">
	import { mapRowsToGridUi, type GridId, type InstrumentManager, type OnEvent } from '$lib';
	import type { SvelteMap } from 'svelte/reactivity';
	import type { Grid as GridType } from '$lib/types/domain/grid_domain';
	import GridConfig from './GridConfig.svelte';
	import Grid from './Grid.svelte';

	let {
		instrumentManager,
		grids,
		onEvent,
	}: {
		instrumentManager: InstrumentManager;
		grids: SvelteMap<GridId, GridType>;
		onEvent: OnEvent
	} = $props();
</script>

{#each [...grids.entries()] as [gridId, grid]}
	<GridConfig
		{grid}
		{onEvent}
	/>
	<Grid
		{grid}
		gridUi={mapRowsToGridUi(grid, instrumentManager)}
		{instrumentManager}
		{onEvent}
	/>
{/each}
