<script lang="ts">
	import type { GridModel, InstrumentManager } from '$lib';
	import type { CellLocator } from '$lib';
	import GridCell from './GridCell.svelte';
	import Legend from './Legend.svelte';

	type OnTapGridCell = (locator: CellLocator) => void;
	type OnRemoveGrid = () => void;
	let {
		grid,
		instrumentManager,
		onTapGridCell,
		onRemoveGrid
	}: {
		grid: GridModel;
		instrumentManager: InstrumentManager;
		onTapGridCell: OnTapGridCell;
		onRemoveGrid: OnRemoveGrid;
	} = $props();
	let cells = $derived(grid.gridCols);
	let currentColumn = $derived(grid.currentColumn);

	// TODO These effects are side effects of state changes,
	// i feel like there's a better way of handling these,
	// where they're not tied to the UI
	$effect(() => {
		let requiredGridCols = grid.gridCols;
		let actualGridCols = grid.notationColumns();
		if (requiredGridCols != actualGridCols) {
			grid.resizeGrid();
		}
	});

	$effect(() => {
		let requiredGridRows = instrumentManager.instruments.size;
		let actualRows = grid.rows.length;
		if (actualRows != requiredGridRows) {
			grid.syncInstruments();
		}
	});
</script>

<div class="grid" style="--cells: {cells};">
	<button
		class="btn btn-outline btn-xs print:hidden"
		onclick={onRemoveGrid}
	>
		❌
	</button>
	<!-- Beat indicator -->
	<div class="beat-indicator">
		{#each Array(cells) as _, currentCell}
			<div
				class="flex h-6 items-center justify-center border border-gray-400 {currentCell %
					grid.beatNoteFraction ==
				0
					? 'brightness-[0.8]'
					: ''}"
				class:bg-green-300={currentCell == currentColumn}
				class:bg-gray-300={currentCell != currentColumn}
			>
				<!-- {currentCell.text} -->
			</div>
		{/each}
	</div>

	{#each grid.uiModel as row}
		<!-- Name -->
		<div class="px-2">
			<div>{row.instrumentName}</div>
		</div>

		{#each row.gridCells as cell}
			<GridCell
				text={cell.content}
				darken={cell.darken}
				onTap={() => onTapGridCell(cell.locator)}
			/>
		{/each}
	{/each}	
</div>
<Legend {instrumentManager}/>

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
		grid-column-start: 2;
		grid-template-columns: subgrid;
	}
</style>
