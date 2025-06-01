<script lang="ts">
	import {
		AppStateStore,
		GridEvent,
		keyValueRepository,
		mapGridUi,
		mapGrvMkrFilesToGrooveSelectorUi,
		mapInstrumentsUi,
		mapToolbarUi,
		themeStore,
		UiEvent,
		type GridUis
	} from '$lib';
	import '$lib/util/polyfills';
	import type { AppEvent } from '$lib/domain/event';
	import { onMount } from 'svelte';
	import Button from './ui/ui_elements/Button.svelte';
	import Grid from './ui/grid/Grid.svelte';
	import GridConfig from './ui/grid/GridConfig.svelte';
	import Instruments from './ui/Instruments.svelte';
	import Legend from './ui/Legend.svelte';
	import Toolbar from './ui/toolbar/Toolbar.svelte';
	import GrooveSelector from './ui/overlay/GrooveSelector.svelte';
	import { registerAppKeyboardShortcuts } from '$lib/util/keyboard_shortcuts';

	let appStateStore: AppStateStore = new AppStateStore();
	let showGrooveSelector: boolean = $state(false);
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);
	let dark = $state(true);

	onMount(() => {
		onEvent({ event: UiEvent.Mounted });
		// Initialise theme
		themeStore.initTheme();
		const unsubscribeThemeStore = themeStore.dark.subscribe((v) => (dark = v));
		const unregisterShortcuts = registerAppKeyboardShortcuts(onEvent);
		return () => {
			unregisterShortcuts();
			unsubscribeThemeStore();
		};
	});

	let toolbarUi = $derived(
		mapToolbarUi(
			appStateStore.fileStore.file.name,
			appStateStore.errorStore.errors,
			dark,
			appStateStore.playbackStore.isPlayingFile()
		)
	);
	let gridsUi: GridUis = $derived(
		mapGridUi(
			appStateStore.gridStore.getGrids(),
			appStateStore.instrumentStore,
			appStateStore.cellToolsStore.cellTools
		)
	);
	const instrumentsUi = $derived(
		mapInstrumentsUi(appStateStore.instrumentStore.getInstruments())
	)
	let grooveSelectorUi = $derived(
		mapGrvMkrFilesToGrooveSelectorUi(appStateStore.fileStore.files, appStateStore.fileStore.file.id)
	);
</script>

<div class="box-border w-full bg-white p-4 dark:bg-[#1D232A]">
	<Toolbar
		{onEvent}
		{toolbarUi}
		toggleGrooveSelector={() => (showGrooveSelector = !showGrooveSelector)}
		toggleLightDark={() => themeStore.toggleTheme()}
	/>
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
		</div>

		<div class="print:hidden">
			<Instruments ui={instrumentsUi} {onEvent} />
		</div>
	{/if}

	{#if showGrooveSelector}
		<GrooveSelector
			ui={grooveSelectorUi}
			{onEvent}
			closeDialog={() => (showGrooveSelector = !showGrooveSelector)}
		/>
	{/if}
</div>
