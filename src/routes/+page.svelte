<script lang="ts">
	import {
		AppStateStore,
		GridEvent,
		mapGridUi,
		mapToolbarUi,
		UiEvent,
		type GridUis
	} from '$lib';
	import '$lib/util/polyfills';
	import type { AppEvent } from '$lib/types/event';
	import { onMount } from 'svelte';
	import Button from './ui_elements/Button.svelte';
	import Grid from './ui_elements/Grid.svelte';
	import GridConfig from './ui_elements/GridConfig.svelte';
	import Instruments from './ui_elements/Instruments.svelte';
	import Legend from './ui_elements/Legend.svelte';
	import Toolbar from './ui_elements/Toolbar.svelte';

	let appStateStore: AppStateStore = new AppStateStore();
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);

	onMount(() => {
		onEvent({ event: UiEvent.Mounted });
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
			onEvent({ event: UiEvent.Copy });
		}

		if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
			onEvent({ event: UiEvent.Paste });
		}
	}

	let toolbarUi = $derived(mapToolbarUi(appStateStore.file.name, appStateStore.errorStore.errors));
	let gridsUi: GridUis = $derived(
		mapGridUi(
			appStateStore.gridStore.grids,
			appStateStore.instrumentStore,
			appStateStore.cellToolsStore.cellTools
		)
	);
</script>

<div class="box-border w-full p-4 bg-white dark:bg-[#1D232A]">
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

		<div class="flex justify-end space-x-2">
			<Button onClick={() => onEvent({ event: GridEvent.AddGrid })} classes="ml-auto print:hidden">
				Add Grid
			</Button>
			<Button onClick={() => onEvent({ event: GridEvent.DuplicateGrid })} classes="ml-auto print:hidden">
				Duplicate Grid
			</Button>
		</div>

		<div class="print:hidden">
			<Instruments instrumentManager={appStateStore.instrumentStore} {onEvent} />
		</div>
	{/if}
</div>
