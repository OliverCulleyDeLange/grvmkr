<script lang="ts">
	import type { GridModel } from '$lib';
	import type { CellLocator } from '$lib';
	import GridCell from './GridCell.svelte';

	type OnTapGridCell = (locator: CellLocator) => void;
	let { grid, onTapGridCell }: { grid: GridModel; onTapGridCell: OnTapGridCell } = $props();
	let cells = $derived(grid.gridCols);
	let currentColumn = $derived(grid.currentColumn);

	$effect(() => {
		// This is jank, but i dunno how to do it better yet
		let requiredGridCols = grid.gridCols;
		let actualGridCols = grid.notationColumns();
		if (requiredGridCols != actualGridCols) {
			grid.resizeGrid();
		}
	});
</script>

<div class="grid" style="--cells: {cells};">
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
