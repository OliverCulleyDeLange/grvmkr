<script lang="ts">
	import { mapRowsToGridUi, type GridId, type InstrumentManager, type OnEvent, type UiEvent } from '$lib';
	import type { SvelteMap } from 'svelte/reactivity';
	import Grid from './Grid.svelte';
	import type { Grid as GridType } from '$lib/types/domain/grid_domain';
	import GridConfig from './GridConfig.svelte';

	let {
		instrumentManager,
		grids,
		currentColumn,
		onEvent,
	}: {
		instrumentManager: InstrumentManager;
		grids: SvelteMap<GridId, GridType>;
		currentColumn: number;
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
		{currentColumn}
		{instrumentManager}
		{onEvent}
	/>
{/each}
