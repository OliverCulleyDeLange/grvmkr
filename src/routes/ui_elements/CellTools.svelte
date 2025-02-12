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

{#if ui.show}
	<div class="flex justify-start print:hidden">
		{#if ui.showMergeLeft}
			<Button onClick={() => onEvent({ event: CellToolsEvent.Merge, side: 'left' })}>
				← Merge
			</Button>
		{/if}
		{#if ui.showMergeRight}
			<Button onClick={() => onEvent({ event: CellToolsEvent.Merge, side: 'right' })}>
				→ Merge
			</Button>
		{/if}
		{#if ui.showUnMerge}
			<Button onClick={() => onEvent({ event: CellToolsEvent.UnMerge })}>Un-Merge</Button>
		{/if}
		
		{#each ui.hitOptions as [displayString, hits]}
			<Button onClick={() => onEvent({ event: CellToolsEvent.SelectHitOption, instrumentHits: hits })}>
				{displayString}
			</Button>
		{/each}
	</div>
{/if}
