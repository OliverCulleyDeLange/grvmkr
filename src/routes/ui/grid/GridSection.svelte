<script lang="ts">
	import GridRowTools from './GridRowTools.svelte';
	import GridCell from './GridCell.svelte';
	import BeatIndicator from './BeatIndicator.svelte';

	import {
		GridEvent,
		type BeatIndicatorUi,
		type CellLocator,
		type GridId,
		type GridSection,
		type OnUiEvent
	} from '$lib';
	
	let {
		section,
		totalSections,
		gridId,
		gridIndex,
		beatIndicators,
		cellSelected,
		playingColumn,
		onEvent,
		onPointerDown,
		onPointerMove
	}: {
		section: GridSection;
		totalSections: number;
		gridId: GridId;
		gridIndex: number;
		beatIndicators: BeatIndicatorUi[];
		cellSelected: (locator: CellLocator) => boolean;
		playingColumn: number;
		onEvent: OnUiEvent;
		onPointerDown: (locator: CellLocator, shiftKey: boolean) => void;
		onPointerMove: (locator: CellLocator) => void;
	} = $props();

	// Calculate the local playing column within this section
	const localPlayingColumn = $derived.by(() => {
		if (typeof playingColumn !== 'number') return -1;
		const sectionStart = section.minIndex;
		const sectionEnd = sectionStart + section.columns;
		if (playingColumn >= sectionStart && playingColumn < sectionEnd) {
			return playingColumn - sectionStart;
		}
		return -1;
	});
</script>

<div
	id={`${section.id.grid}-${section.id.index}`}
	class="grid-section"
	style="--cells: {section.columns};"
	data-testid={`gridsection-${gridId}-${gridIndex}-${section.index}`}
>	<div>
		Section {section.index+1}/{totalSections}
	</div>
	<div class="beat-indicator">
		{#each beatIndicators as indicator, i}
			<BeatIndicator {indicator} playing={localPlayingColumn === i} />
		{/each}
	</div>

	{#each section.sectionRows as row}
		<GridRowTools {row} {onEvent} />

		{#each row.gridCells as cell (cell.id)}
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

<style>
	.grid-section {
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
</style>
