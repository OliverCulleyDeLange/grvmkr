<script lang="ts">
	import {
		AppStateStore,
		GridEvent,
		mapContextMenu as mapContextMenuUi,
		mapGridUi,
		mapToolbarUi,
		UiEvent,
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

	let appStateStore: AppStateStore = new AppStateStore();
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);

	onMount(() => {
		onEvent({ event: UiEvent.Mounted });
		document.addEventListener('mousedown', () => onEvent({ event: UiEvent.DocumentClick }));
	});

	let toolbarUi = $derived(mapToolbarUi(appStateStore.file.name, appStateStore.errors));
	let gridsUi: GridUis = $derived(mapGridUi(appStateStore.grids, appStateStore.instrumentManager));
	let contextMenuUi: ContextMenuUi | undefined = $derived(
		appStateStore.contextMenu ? mapContextMenuUi(appStateStore.contextMenu) : undefined
	);
</script>

<div class="p-4">
	<Toolbar {onEvent} {toolbarUi} />
	{#if appStateStore.instrumentManager != undefined}
		<div class="flex flex-col gap-8">
			{#each gridsUi.grids as gridUi}
				<div>
					<GridConfig {gridUi} {onEvent} />
					<Grid {gridUi} instrumentManager={appStateStore.instrumentManager} {onEvent} />
				</div>
			{/each}
		</div>

		<div class="flex">
			<Button
				text="Add Grid"
				onClick={() => onEvent({ event: GridEvent.AddGrid })}
				classes="print:hidden"
			/>
		</div>

		<div class="print:hidden">
			<Instruments instrumentManager={appStateStore.instrumentManager} {onEvent} />
		</div>
	{/if}
</div>

{#if contextMenuUi}
	<ContextMenu ui={contextMenuUi} {onEvent} />
{/if}
