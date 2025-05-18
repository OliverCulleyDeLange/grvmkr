<script lang="ts">
	import { GridEvent, type GridUi, type OnUiEvent } from '$lib';
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
</script>

<div class="flex flex-col gap-2">
	{#each gridUi.notationSections as section}
		<div class="grid" style="--cells: {section.columns};">
			<button
				class="btn btn-outline btn-xs print:invisible"
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
				<!-- Name -->
				<div class="select-none px-2 text-xs">
					<div>
						{row.instrumentName}
					</div>
					<div class="flex gap-2">
						<VolumeControls
							model={row.volume}
							onMute={() =>
								onEvent({
									event: GridEvent.MuteInstrument,
									instrumentId: row.instrumentId,
								})
							}
							onSolo={() =>
								onEvent({
									event: GridEvent.SoloInstrument,
									instrumentId: row.instrumentId,
								})
							}
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
						onTap={(shift) =>
							onEvent({ event: GridEvent.TappedGridCell, locator: cell.locator, shiftHeld: shift })}
						onRightTap={(x, y) =>
							onEvent({
								event: GridEvent.RightClick,
								x,
								y,
								locator: cell.locator,
								gridId: gridUi.id
							})}
					/>
				{/each}
			{/each}
		</div>
	{/each}
</div>

<CellTools ui={gridUi.cellTools} {onEvent} />

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
</style>
