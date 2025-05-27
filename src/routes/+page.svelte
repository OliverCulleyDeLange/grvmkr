<script lang="ts">
	import {
		AppStateStore,
		GridEvent,
		keyValueRepository,
		mapGridUi,
		mapGrvMkrFilesToGrooveSelectorUi,
		mapToolbarUi,
		themeStore,
		UiEvent,
		type GridUis
	} from '$lib';
	import '$lib/util/polyfills';
	import type { AppEvent } from '$lib/domain/event';
	import { onMount } from 'svelte';
	import Button from './ui_elements/Button.svelte';
	import Grid from './ui_elements/Grid.svelte';
	import GridConfig from './ui_elements/GridConfig.svelte';
	import Instruments from './ui_elements/Instruments.svelte';
	import Legend from './ui_elements/Legend.svelte';
	import Toolbar from './ui_elements/Toolbar.svelte';
	import GrooveSelector from './ui_elements/GrooveSelector.svelte';
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
		mapToolbarUi(appStateStore.fileStore.file.name, appStateStore.errorStore.errors, dark)
	);
	let gridsUi: GridUis = $derived(
		mapGridUi(
			appStateStore.gridStore.grids,
			appStateStore.instrumentStore,
			appStateStore.cellToolsStore.cellTools
		)
	);
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
			<Button
				onClick={() => onEvent({ event: GridEvent.DuplicateGrid })}
				classes="ml-auto print:hidden"
			>
				Duplicate Grid
			</Button>
		</div>

		<div class="print:hidden">
			<Instruments instrumentManager={appStateStore.instrumentStore} {onEvent} />
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
