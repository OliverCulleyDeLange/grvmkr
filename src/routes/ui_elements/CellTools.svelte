<script lang="ts">
	import { CellToolsEvent, type OnUiEvent } from '$lib';
	import type { CellToolsUi } from '$lib/types/ui/cell_tools';
	import Button from './Button.svelte';

	let {
		ui,
		onEvent
	}: {
		ui: CellToolsUi;
		onEvent: OnUiEvent;
	} = $props();
</script>

<div class="min-h-12">
	{#if ui.show}
		<div class="flex justify-start print:hidden">
			<Button
				disabled={!ui.showMergeLeft}
				onClick={() => onEvent({ event: CellToolsEvent.Merge, side: 'left' })}
			>
				← Merge
			</Button>
			<Button
				disabled={!ui.showMergeRight}
				onClick={() => onEvent({ event: CellToolsEvent.Merge, side: 'right' })}
			>
				→ Merge
			</Button>
			<Button disabled={!ui.showUnMerge} onClick={() => onEvent({ event: CellToolsEvent.UnMerge })}
				>Un-Merge</Button
			>

			{#each ui.hitOptions as [displayString, hits]}
				<Button
					onClick={() => onEvent({ event: CellToolsEvent.SelectHitOption, instrumentHits: hits })}
				>
					{displayString}
				</Button>
			{/each}
		</div>
	{/if}
</div>
