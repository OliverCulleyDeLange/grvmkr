<script lang="ts">
	import { GridEvent, type Grid, type InstrumentManager, type OnUiEvent, type GridUi } from '$lib';
	import GridCell from './GridCell.svelte';
	import Legend from './Legend.svelte';

	let {
		grid,
		gridUi,
		instrumentManager,
		onEvent
	}: {
		grid: Grid;
		gridUi: GridUi;
		instrumentManager: InstrumentManager;
		onEvent: OnUiEvent;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	{#each gridUi.notationSections as section}
		<div class="grid" style="--cells: {section.columns};">
			<button
				class="btn btn-outline btn-xs print:hidden"
				onclick={() => onEvent({ event: GridEvent.RemoveGrid, gridId: grid.id })}
			>
				X
			</button>
			<!-- Beat indicator -->
			<div class="beat-indicator">
				{#each section.columnRange as currentCell}
					<div
						class="flex h-6 items-center justify-center border border-gray-400 {currentCell %
							grid.config.beatDivisions ==
						0
							? 'brightness-[0.8]'
							: ''}"
						class:bg-green-300={currentCell == grid.currentlyPlayingColumn}
						class:bg-gray-300={currentCell != grid.currentlyPlayingColumn}
					></div>
				{/each}
			</div>

			{#each section.sectionRows as row}
				<!-- Name -->
				<div class="px-2">
					<div>{row.instrumentName}</div>
				</div>

				{#each row.gridCells as cell}
					<GridCell
						text={cell.content}
						darken={cell.darken}
						onTap={() => onEvent({ event: GridEvent.ToggleGridHit, locator: cell.locator })}
					/>
				{/each}
			{/each}
		</div>
	{/each}
</div>

<Legend {instrumentManager} />

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
