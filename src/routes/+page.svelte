<script lang="ts">
	import {
		AppStateStore,
		GridEvent,
		HelpEvent,
		mapCellToolsUi,
		mapGridUi,
		mapGrvMkrFilesToGrooveSelectorUi,
		mapInstrumentsUi,
		mapToolbarUi,
		themeStore,
		UiEvent,
		type BeatIndicatorUi,
		type CellToolsUi,
		type GridId,
		type GridUis
	} from '$lib';
	import type { AppEvent } from '$lib/domain/event';
	import { mapBeatIndicatorUi } from '$lib/mapper/ui_to_ui/grid_ui_to_beat_indicator_ui';
	import { registerAppKeyboardShortcuts } from '$lib/util/keyboard_shortcuts';
	import '$lib/util/polyfills';
	import { onMount } from 'svelte';
	import Grid from './ui/grid/Grid.svelte';
	import GridConfig from './ui/grid/GridConfig.svelte';
	import Instruments from './ui/Instruments.svelte';
	import Legend from './ui/Legend.svelte';
	import GrooveSelector from './ui/overlay/GrooveSelector.svelte';
	import HelpOverlay from './ui/overlay/HelpOverlay.svelte';
	import ResetConfirmation from './ui/toolbar/ResetConfirmation.svelte';
	import Toolbar from './ui/toolbar/Toolbar.svelte';
	import Button from './ui/ui_elements/Button.svelte';

	let appStateStore: AppStateStore = new AppStateStore();
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);

	onMount(() => {
		onEvent({ event: UiEvent.Mounted });
		// Initialise theme
		themeStore.initTheme();
		const unsubscribeThemeStore = themeStore.dark.subscribe((v) =>
			appStateStore.uiStore.setDarkMode(v)
		);
		const unregisterShortcuts = registerAppKeyboardShortcuts(onEvent);
		return () => {
			unregisterShortcuts();
			unsubscribeThemeStore();
		};
	});

	$effect(() => {
		const id = appStateStore.gridStore.getGridToScrollTo();
		if (id) {
			const el = document.getElementById(id);
			if (el) {
				el.scrollIntoView({ behavior: 'auto', block: 'start' });
				onEvent({ event: GridEvent.ScrolledToGrid });
			}
		}
	});

	function reset() {
		if (appStateStore.uiStore.showResetConfirmation) {
			appStateStore.uiStore.showResetConfirmation = false;
			onEvent({ event: HelpEvent.Reset });
		} else {
			appStateStore.uiStore.showResetConfirmation = true;
		}
	}

	const toolbarUi = $derived(
		mapToolbarUi(
			appStateStore.fileStore.file.name,
			appStateStore.errorStore.errors,
			appStateStore.uiStore.darkMode,
			appStateStore.playbackStore.isPlayingFile()
		)
	);
	const gridsUi: GridUis = $derived.by(() => {
		return mapGridUi(appStateStore.gridStore.getGrids(), appStateStore.instrumentStore);
	});
	const beatIndicatorUi: Map<GridId, BeatIndicatorUi[][]> = $derived(
		mapBeatIndicatorUi(gridsUi, (id) => appStateStore.playbackStore.getCurrentlyPlayingColumn(id))
	);
	const instrumentsUi = $derived(mapInstrumentsUi(appStateStore.instrumentStore.getInstruments()));
	const grooveSelectorUi = $derived(
		mapGrvMkrFilesToGrooveSelectorUi(appStateStore.fileStore.files, appStateStore.fileStore.file.id)
	);
	const cellToolsUiMap = $derived.by(() => {
		const result = new Map<GridId, CellToolsUi>();
		for (const gridUi of gridsUi.grids) {
			result.set(gridUi.id, mapCellToolsUi(appStateStore.cellToolsStore.cellTools, gridUi.id));
		}
		return result;
	});
</script>

<div class="box-border w-full bg-white p-4 dark:bg-[#1D232A]">
	<Toolbar
		{onEvent}
		{toolbarUi}
		toggleGrooveSelector={() => appStateStore.uiStore.toggleShowGrooveSelector()}
		toggleLightDark={() => themeStore.toggleTheme()}
		toggleShowHelp={() => appStateStore.uiStore.toggleShowHelp()}
	/>
	{#if appStateStore.instrumentStore != undefined}
		<div class="flex flex-col gap-8">
			{#each gridsUi.grids as gridUi}
				<div id={gridUi.id} class="break-inside-avoid">
					<GridConfig {gridUi} {onEvent} />
					<Legend instrumentManager={appStateStore.instrumentStore} />
					<Grid
						{gridUi}
						cellTools={cellToolsUiMap.get(gridUi.id)}
						{onEvent}
						{beatIndicatorUi}
						cellSelected={(locator) => appStateStore.gridStore.isCellSelected(locator)}
					/>
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

	{#if appStateStore.uiStore.showGrooveSelector}
		<GrooveSelector
			ui={grooveSelectorUi}
			{onEvent}
			closeDialog={() => appStateStore.uiStore.toggleShowGrooveSelector()}
		/>
	{/if}

	{#if appStateStore.uiStore.getShouldShowHelpOverlay()}
		<HelpOverlay
			closeDialog={() => appStateStore.uiStore.toggleShowHelp()}
			reset={() => {
				appStateStore.uiStore.hideHelpOverlay();
				reset();
			}}
			loadExample={() => {
				appStateStore.uiStore.hideHelpOverlay();
				onEvent({ event: HelpEvent.LoadExampleFile });
			}}
		/>
	{/if}

	{#if appStateStore.uiStore.showResetConfirmation}
		<ResetConfirmation {reset} close={() => appStateStore.uiStore.hideResetConfirmation()} />
	{/if}
</div>
