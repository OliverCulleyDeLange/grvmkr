<script lang="ts">
	import { mapRowsToGridUi, type GridId, type InstrumentManager, type OnUiEvent } from '$lib';
	import type { Grid as GridType } from '$lib/types/domain/grid_domain';
	import GridConfig from './GridConfig.svelte';
	import Grid from './Grid.svelte';

	let {
		instrumentManager,
		grids,
		onEvent
	}: {
		instrumentManager: InstrumentManager;
		grids: Map<GridId, GridType>;
		onEvent: OnUiEvent;
	} = $props();
</script>

<div class="flex flex-col gap-8">
	{#each [...grids.entries()] as [gridId, grid]}
		<div>
			<GridConfig {grid} {onEvent} />
			<Grid
				{grid}
				gridUi={mapRowsToGridUi(grid, instrumentManager)}
				{instrumentManager}
				{onEvent}
			/>
		</div>
	{/each}
</div>
