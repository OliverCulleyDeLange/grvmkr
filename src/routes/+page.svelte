<script lang="ts">
	import { AppStateStore, GridEvent, mapRowsToGridUi, mapToolbarUi, UiEvent } from '$lib';
	import { onMount } from 'svelte';
	import type { AppEvent } from '$lib/types/event';
	import Button from './ui_elements/Button.svelte';
	import Toolbar from './ui_elements/Toolbar.svelte';
	import GridConfig from './ui_elements/GridConfig.svelte';
	import Grid from './ui_elements/Grid.svelte';
	import Instruments from './ui_elements/Instruments.svelte';

	let appStateStore: AppStateStore = new AppStateStore();
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);

	onMount(() => onEvent({ event: UiEvent.Mounted }));

	let toolbarUi = $derived(mapToolbarUi(appStateStore.file.name, appStateStore.errors));
</script>

<div class="p-4">
	<Toolbar {onEvent} {toolbarUi} />
	{#if appStateStore.instrumentManager != undefined}
		<div class="flex flex-col gap-8">
			{#each [...appStateStore.grids.entries()] as [_, grid]}
				<div>
					<GridConfig {grid} {onEvent} />
					<Grid
						{grid}
						gridUi={mapRowsToGridUi(grid, appStateStore.instrumentManager)}
						instrumentManager={appStateStore.instrumentManager}
						{onEvent}
					/>
				</div>
			{/each}
		</div>

		<div class="flex">
			<Button text="Add Grid" onClick={() => onEvent({ event: GridEvent.AddGrid })} classes="print:hidden" />
		</div>

		<div class="print:hidden">
			<Instruments instrumentManager={appStateStore.instrumentManager} {onEvent} />
		</div>
	{/if}
</div>
