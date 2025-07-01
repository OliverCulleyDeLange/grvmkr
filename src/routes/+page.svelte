<script lang="ts">
	import {
		AppStateStore,
		GridEvent,
		HelpEvent,
		themeStore,
		UiEvent
	} from '$lib';
	import type { AppEvent } from '$lib/domain/event';
	import { registerAppKeyboardShortcuts } from '$lib/util/keyboard_shortcuts';
	import '$lib/util/polyfills';
	import { onMount } from 'svelte';
	import Grid from './ui/grid/Grid.svelte';
	import GridConfig from './ui/grid/GridConfig.svelte';
	import VirtualSection from './ui/grid/VirtualSection.svelte';
	import Instruments from './ui/Instruments.svelte';
	import Legend from './ui/Legend.svelte';
	import GrooveSelector from './ui/overlay/GrooveSelector.svelte';
	import HelpOverlay from './ui/overlay/HelpOverlay.svelte';
	import PlaybackDebug from './ui/PlaybackDebug.svelte';
	import PlayAndFileName from './ui/toolbar/PlayAndFileName.svelte';
	import ResetConfirmation from './ui/toolbar/ResetConfirmation.svelte';
	import Toolbar from './ui/toolbar/Toolbar.svelte';
	import Button from './ui/ui_elements/Button.svelte';

	let appStateStore: AppStateStore = new AppStateStore();
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);

	let screenWidth = $state(1024); // Safe default for SSR
	let isPrintMode = $state(false);

	onMount(() => {
		screenWidth = window.innerWidth;
		appStateStore.uiStore.setScreenWidth(screenWidth);
		onEvent({ event: UiEvent.Mounted });
		// Initialise theme
		themeStore.initTheme();
		const unsubscribeThemeStore = themeStore.dark.subscribe((v) =>
			appStateStore.uiStore.setDarkMode(v)
		);
		const unregisterShortcuts = registerAppKeyboardShortcuts(onEvent);
		const handleResize = () => {
			screenWidth = window.innerWidth;
			appStateStore.uiStore.setScreenWidth(screenWidth);
		};

		// Listen for print events
		const beforePrint = () => {
			isPrintMode = true;
			console.log('Entering print mode');
		};
		const afterPrint = () => {
			isPrintMode = false;
			console.log('Exiting print mode');
		};

		window.addEventListener('beforeprint', beforePrint);
		window.addEventListener('afterprint', afterPrint);
		window.addEventListener('resize', handleResize);

		return () => {
			unregisterShortcuts();
			unsubscribeThemeStore();
			window.removeEventListener('beforeprint', beforePrint);
			window.removeEventListener('afterprint', afterPrint);
			window.removeEventListener('resize', handleResize);
		};
	});

	$effect(() => {
		const id = appStateStore.gridStore.getGridToScrollTo();
		if (id) {
			const el = document.getElementById(`${id.grid}-${id.index}`);
			if (el) {
				// Use scrollIntoView which handles positioning automatically
				el.scrollIntoView({
					behavior: 'instant',
					block: 'start'
				});
				// Scroll an extra 120px, which is the two sticky bars
				window.scrollBy({
					top: -120,
					behavior: 'instant'
				});
			} else {
				console.error('Grid to scroll to not found:', id);
			}
			onEvent({ event: GridEvent.ScrolledToGrid, grid: id });
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

	// Get UI state from uiStore
	const toolbarUi = $derived(appStateStore.uiStore.toolbarUi);
	const gridsUi = $derived(appStateStore.uiStore.gridsUi);
	const beatIndicatorUi = $derived(appStateStore.uiStore.beatIndicatorUi);
	const instrumentsUi = $derived(appStateStore.uiStore.instrumentsUi);
	const grooveSelectorUi = $derived(appStateStore.uiStore.grooveSelectorUi);
	const cellToolsUiMap = $derived(appStateStore.uiStore.cellToolsUiMap);
</script>

{#if !isPrintMode}
	<!-- Main content (not for print) -->
	<div class="box-border w-full bg-white dark:bg-[#1D232A]">
		<div class="p-4">
			<Toolbar
				{onEvent}
				{toolbarUi}
				toggleGrooveSelector={() => appStateStore.uiStore.toggleShowGrooveSelector()}
				toggleLightDark={() => themeStore.toggleTheme()}
				toggleShowHelp={() => appStateStore.uiStore.toggleShowHelp()}
			/>
		</div>

		<!-- Sticky play controls that pin to top when scrolling -->
		<div class="sticky top-0 z-50 bg-white px-4 py-1 dark:bg-[#1D232A]" id="file-controls">
			<PlayAndFileName {toolbarUi} {onEvent} />
		</div>

		<!-- Scrollable content -->
		<div class="px-4">
			{#if appStateStore.instrumentStore != undefined}
				<div id="all-grids" class="flex flex-col gap-8">
					{#each gridsUi.grids as gridUi, i}
						<VirtualSection id={gridUi.id} index={i} estimatedHeight={428}>
							<!-- Sticky grid config bar that sticks directly below the file controls -->
							<!-- 64px = file controls height -->
							<div class="sticky z-40 bg-white dark:bg-[#1D232A]" style="top: 64px;">
								<GridConfig
									{gridUi}
									playing={appStateStore.playbackStore.isPlayingGrid(gridUi.id)}
									{onEvent}
								/>
							</div>
							<Legend instrumentManager={appStateStore.instrumentStore} />
							<Grid
								{gridUi}
								cellTools={cellToolsUiMap.get(gridUi.id)}
								{onEvent}
								beatIndicatorUi={beatIndicatorUi.get(gridUi.id) || []}
								cellSelected={(locator) => appStateStore.gridStore.isCellSelected(locator)}
								playingColumn={appStateStore.playbackStore.getCurrentlyPlayingColumn(gridUi.id)}
							/>
						</VirtualSection>
					{/each}
				</div>

				<div class="flex justify-end space-x-2">
					<Button onClick={() => onEvent({ event: GridEvent.AddGrid })} classes="ml-auto">
						Add Grid
					</Button>
				</div>

				<Instruments ui={instrumentsUi} {onEvent} />
			{/if}
		</div>

		{#if appStateStore.uiStore.showGrooveSelector}
			<GrooveSelector
				ui={grooveSelectorUi}
				{onEvent}
				closeDialog={() => appStateStore.uiStore.toggleShowGrooveSelector()}
			/>
		{/if}

		{#if appStateStore.uiStore.shouldShowHelpOverlay}
			<HelpOverlay
				closeDialog={() => appStateStore.uiStore.toggleShowHelp()}
				reset={() => {
					appStateStore.uiStore.hideHelpOverlay();
					reset();
				}}
				debug={() => {
					appStateStore.uiStore.hideHelpOverlay();
					onEvent({ event: HelpEvent.Debug });
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

		{#if appStateStore.uiStore.shouldShowDebugOverlay}
			<PlaybackDebug playbackStore={appStateStore.playbackStore} />
		{/if}
	</div>
{/if}

{#if isPrintMode}
	<!-- PRINT CONTENT -->
	<div class="box-border w-full bg-white p-4">
		<h1 class="mb-8 text-4xl">{appStateStore.fileStore.file.name}</h1>

		{#if appStateStore.instrumentStore != undefined}
			<div class="flex flex-col">
				{#each gridsUi.grids as gridUi}
					<div class="break-inside-avoid">
						<GridConfig
							{gridUi}
							playing={appStateStore.playbackStore.isPlayingGrid(gridUi.id)}
							{onEvent}
						/>
						<Legend instrumentManager={appStateStore.instrumentStore} />
						<Grid
							{gridUi}
							cellTools={cellToolsUiMap.get(gridUi.id)}
							{onEvent}
							beatIndicatorUi={beatIndicatorUi.get(gridUi.id)!}
							cellSelected={(locator) => appStateStore.gridStore.isCellSelected(locator)}
							playingColumn={appStateStore.playbackStore.getCurrentlyPlayingColumn(gridUi.id)}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
