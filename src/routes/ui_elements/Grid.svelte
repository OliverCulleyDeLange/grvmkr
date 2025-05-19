<script lang="ts">
	import { GridEvent, type CellLocator, type GridUi, type OnUiEvent } from '$lib';
	import type { OnEvent } from '$lib/types/event';
	import { onMount } from 'svelte';
	import CellTools from './CellTools.svelte';
	import GridCell from './GridCell.svelte';
	import VolumeControls from './VolumeControls.svelte';

	let {
		gridUi,
		onEvent
	}: {
		gridUi: GridUi;
		onEvent: OnUiEvent;
	} = $props();

	// Selection state
	let selecting: boolean = false;
	let selectionStart: CellLocator | null = null;
	let selectionEnd: CellLocator | null = null;

	// Toolsbar pin state
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
		if (locator.cell > selectionEnd?.cell || locator.cell < selectionEnd?.cell) {
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
		{#each gridUi.notationSections as section}
			<div class="grid" style="--cells: {section.columns};">
				<button
					class="btn btn-outline btn-xs print:invisible"
					onclick={() => onEvent({ event: GridEvent.RemoveGrid, gridId: gridUi.id })}
				>
					X
				</button>
				<div class="beat-indicator">
					{#each section.beatIndicator as indicator}
						<div
							class="flex h-6 items-center justify-center print:border print:border-gray-400"
							class:bg-green-300={indicator.playing}
							class:bg-gray-100={!indicator.playing &&
								!indicator.isBeat &&
								!indicator.isFirstBeatOfBar}
							class:bg-gray-300={!indicator.playing && indicator.isBeat}
							class:bg-gray-400={!indicator.playing && indicator.isFirstBeatOfBar}
							class:text-gray-800={!indicator.playing && indicator.isFirstBeatOfBar}
							class:text-gray-600={!indicator.playing && indicator.isBeat}
						>
							{indicator.text}
						</div>
					{/each}
				</div>

				{#each section.sectionRows as row}
					<div class="select-none px-2 text-xs print:text-lg">
						<div>{row.instrumentName}</div>
						<div class="flex gap-2">
							<VolumeControls
								model={row.volume}
								onMute={() =>
									onEvent({
										event: GridEvent.MuteInstrument,
										instrumentId: row.instrumentId
									})}
								onSolo={() =>
									onEvent({
										event: GridEvent.SoloInstrument,
										instrumentId: row.instrumentId
									})}
								onChange={(volume, delta) =>
									onEvent({
										event: GridEvent.VolumeChanged,
										instrumentId: row.instrumentId,
										volume: volume,
										delta: delta
									})}
							/>
						</div>
					</div>

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

	/* Selected cell styling */
	.selected {
		outline: 2px solid #3b82f6;
		background-color: #bfdbfe;
	}

	/* Action bar styling */
	.selection-action-bar {
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 4px 8px;
		display: flex;
		gap: 8px;
		box-shadow: 0 2px 5px rgba(255, 255, 255, 0.15);
		z-index: 1000;
	}

	.cell-tools {
		position: sticky;
		bottom: 0;
		padding: 8px;
		z-index: 10;
	}

	.fixed-to-viewport {
		position: fixed !important;
		bottom: 0;
		left: 0;
		right: 0;
	}
</style>
