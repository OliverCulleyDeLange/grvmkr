<script lang="ts">
	import {
		GridEvent,
		type BeatIndicatorUi,
		type CellLocator,
		type CellToolsUi,
		type GridUi,
		type OnUiEvent
	} from '$lib';
	import CellTools from './CellTools.svelte';
	import GridSection from './GridSection.svelte';

	let {
		gridUi,
		beatIndicatorUi,
		cellTools,
		onEvent,
		cellSelected,
		playingColumn
	}: {
		gridUi: GridUi;
		beatIndicatorUi: BeatIndicatorUi[][];
		cellTools: CellToolsUi | undefined;
		onEvent: OnUiEvent;
		cellSelected: (locator: CellLocator) => boolean;
		playingColumn: number;
	} = $props();

	// Selection state
	let selecting: boolean = false;
	let selectionStart: CellLocator | null = null;
	let selectionEnd: CellLocator | null = null;

	function onPointerDown(locator: CellLocator, shiftKey: boolean) {
		selecting = true;
		selectionEnd = locator;
		selectionStart = locator;
		onEvent({
			event: GridEvent.StartCellSelection,
			locator: locator,
			shiftHeld: shiftKey
		});
	}

	function onPointerMove(locator: CellLocator) {
		if (!selecting) return;
		if (selectionEnd && (locator.cell > selectionEnd.cell || locator.cell < selectionEnd.cell)) {
			selectionEnd = locator;
			onEvent({
				event: GridEvent.ChangeCellSelection,
				locator: locator
			});
		}
	}

	function onPointerUp() {
		selecting = false;
	}
</script>

<div class="grid-sections-and-celltools-wrapper">
	<div
		class="grid-sections-container flex select-none flex-col gap-2"
		style="touch-action: pan-y; position:relative;"
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		{#each gridUi.notationSections as section}
			<GridSection
				{section}
				totalSections={gridUi.notationSections.length}
				gridId={gridUi.id}
				gridIndex={gridUi.index}
				beatIndicators={beatIndicatorUi[section.index]}
				{cellSelected}
				{playingColumn}
				{onEvent}
				{onPointerDown}
				{onPointerMove}
			/>
		{/each}
	</div>

	<div class="cell-tools pointer-events-none">
		{#if cellTools}
			<CellTools ui={cellTools} {onEvent} />
		{/if}
	</div>
</div>

<style>
	.cell-tools {
		position: sticky;
		bottom: 0;
		z-index: 10;
	}
</style>
