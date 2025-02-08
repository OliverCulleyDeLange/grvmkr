<script lang="ts">
	import { GridEvent, type GridUi, type InstrumentManager, type OnUiEvent } from '$lib';
	import GridCell from './GridCell.svelte';
	import Legend from './Legend.svelte';

	let {
		gridUi,
		instrumentManager,
		onEvent
	}: {
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
				onclick={() => onEvent({ event: GridEvent.RemoveGrid, gridId: gridUi.id })}
			>
				X
			</button>
			<!-- Beat indicator -->
			<div class="beat-indicator">
				{#each section.beatIndicator as indicator}
					<div
						class="flex h-6 items-center justify-center print:border print:border-gray-400"
						class:bg-green-300={indicator.playing}
						class:bg-gray-100={!indicator.playing && !indicator.isBeat && !indicator.isFirstBeatOfBar}
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
				<!-- Name -->
				<div class="px-2">
					<div>{row.instrumentName}</div>
				</div>

				{#each row.gridCells as cell}
					<GridCell
						text={cell.content}
						isBeat={cell.isBeat}
						isFirstBeatOfBar={cell.isFirstBeatOfBar}
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
