<script lang="ts">
	import {
		AppStateStore,
		GridEvent,
		mapCellToolsUi,
		mapContextMenu as mapContextMenuUi,
		mapGridUi,
		mapToolbarUi,
		UiEvent,
		type CellToolsUi,
		type ContextMenuUi,
		type GridUis
	} from '$lib';
	import type { AppEvent } from '$lib/types/event';
	import { onMount } from 'svelte';
	import Button from './ui_elements/Button.svelte';
	import GridConfig from './ui_elements/GridConfig.svelte';
	import Instruments from './ui_elements/Instruments.svelte';
	import Toolbar from './ui_elements/Toolbar.svelte';
	import Grid from './ui_elements/Grid.svelte';
	import ContextMenu from './ui_elements/ContextMenu.svelte';
	import CellTools from './ui_elements/CellTools.svelte';
	import Legend from './ui_elements/Legend.svelte';

	let appStateStore: AppStateStore = new AppStateStore();
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);

	onMount(() => {
		onEvent({ event: UiEvent.Mounted });
	});

	let toolbarUi = $derived(mapToolbarUi(appStateStore.file.name, appStateStore.errors));
	let gridsUi: GridUis = $derived(mapGridUi(appStateStore.grids, appStateStore.instrumentStore, appStateStore.cellTools));
	let contextMenuUi: ContextMenuUi | undefined = $derived(mapContextMenuUi(appStateStore.contextMenu));
</script>

<div class="p-4">
	<Toolbar {onEvent} {toolbarUi} />
	{#if appStateStore.instrumentStore != undefined}
		<div class="flex flex-col gap-8">
			{#each gridsUi.grids as gridUi}
				<div>
					<GridConfig {gridUi} {onEvent} />
					<Legend instrumentManager={appStateStore.instrumentStore} />
					<Grid {gridUi} {onEvent} />
				</div>
			{/each}
		</div>

		<div class="flex">
			<Button onClick={() => onEvent({ event: GridEvent.AddGrid })} classes="ml-auto print:hidden">
				Add Grid
			</Button>
		</div>

		<div class="print:hidden">
			<Instruments instrumentManager={appStateStore.instrumentStore} {onEvent} />
		</div>
	{/if}
</div>

{#if contextMenuUi}
	<ContextMenu ui={contextMenuUi} {onEvent} />
{/if}
