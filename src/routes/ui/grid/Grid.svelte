<script lang="ts">
	import GridRowTools from './GridRowTools.svelte';

	import {
		GridEvent,
		type BeatIndicatorUi,
		type CellLocator,
		type CellToolsUi,
		type GridId,
		type GridUi,
		type OnUiEvent
	} from '$lib';
	import BeatIndicator from './BeatIndicator.svelte';
	import CellTools from './CellTools.svelte';
	import GridCell from './GridCell.svelte';

	let {
		gridUi,
		beatIndicatorUi,
		cellTools,
		onEvent,
		cellSelected,
	}: {
		gridUi: GridUi;
		beatIndicatorUi: Map<GridId, BeatIndicatorUi[][]>;
		cellTools: CellToolsUi | undefined;
		onEvent: OnUiEvent;
		cellSelected: (locator: CellLocator) => boolean;
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

<div class="grid-wrapper">
	<div
		class="flex select-none flex-col gap-2"
		style="touch-action: pan-y; position:relative;"
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		{#each gridUi.notationSections as section, sectionIdx}
			<div class="grid" style="--cells: {section.columns};">
				<button
					class="btn btn-outline btn-xs print:invisible"
					onclick={() => onEvent({ event: GridEvent.RemoveGrid, gridId: gridUi.id })}
				>
					Delete Grid
				</button>
				<div class="beat-indicator">
					{#each beatIndicatorUi.get(gridUi.id)?.[sectionIdx] ?? [] as indicator}
						<BeatIndicator {indicator} />
					{/each}
				</div>

				{#each section.sectionRows as row}
					<GridRowTools {row} {onEvent} />

					{#each row.gridCells as cell}
						<GridCell
							ui={cell}
							selected={cellSelected(cell.locator)}
							onpointerdown={(e: PointerEvent) => onPointerDown(cell.locator, e.shiftKey)}
							onpointermove={() => onPointerMove(cell.locator)}
							onTap={(shift) =>
								onEvent({
									event: GridEvent.TappedGridCell,
									locator: cell.locator,
									shiftHeld: shift
								})}
						/>
					{/each}
				{/each}
			</div>
		{/each}
	</div>

	<div class="cell-tools pointer-events-none">
		{#if cellTools}
			<CellTools ui={cellTools} {onEvent} />
		{/if}
	</div>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: auto repeat(var(--cells), 1fr);
		gap: 2px;
		break-inside: avoid;
		page-break-inside: avoid;
	}

	.beat-indicator {
		display: grid;
		grid-column: span var(--cells) / span var(--cells);
		grid-template-columns: subgrid;
	}

	.cell-tools {
		position: sticky;
		bottom: 0;
		z-index: 10;
	}
</style>
