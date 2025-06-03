<script lang="ts">
	import GridRowTools from './GridRowTools.svelte';

	import {
		GridEvent,
		type BeatIndicatorUi,
		type CellLocator,
		type GridId,
		type GridUi,
		type OnUiEvent
	} from '$lib';
	import { onMount } from 'svelte';
	import CellTools from './CellTools.svelte';
	import GridCell from './GridCell.svelte';
	import BeatIndicator from './BeatIndicator.svelte';

	let {
		gridUi,
		onEvent,
		beatIndicatorUi
	}: {
		gridUi: GridUi;
		onEvent: OnUiEvent;
		beatIndicatorUi: Map<GridId, BeatIndicatorUi[][]>;
	} = $props();

	// Selection state
	let selecting: boolean = false;
	let selectionStart: CellLocator | null = null;
	let selectionEnd: CellLocator | null = null;

	// Toolbar pin state
	let gridRef: HTMLElement;
	let toolsRef: HTMLElement;
	let isPinned = false;

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

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!gridRef) return;

					const gridBottom = gridRef.getBoundingClientRect().bottom;
					const viewportHeight = window.innerHeight;

					isPinned = gridBottom > viewportHeight && entry.isIntersecting;
				}
			},
			{
				root: null,
				threshold: 0
			}
		);

		if (toolsRef) observer.observe(toolsRef);

		return () => observer.disconnect();
	});
</script>

<div bind:this={gridRef} class="grid-wrapper">
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

	<div class="cell-tools" class:fixed-to-viewport={isPinned} bind:this={toolsRef}>
		<CellTools ui={gridUi.cellTools} {onEvent} />
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

	.fixed-to-viewport {
		position: fixed !important;
		bottom: 0;
		left: 0;
		right: 0;
	}
</style>
