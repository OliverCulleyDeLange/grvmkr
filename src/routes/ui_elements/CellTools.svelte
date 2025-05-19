<script lang="ts">
	import { CellToolsEvent, UiEvent, type OnUiEvent } from '$lib';
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

<div class="">
	{#if ui.show}
		<div class="flex flex-wrap items-center justify-start print:hidden">
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

			<Button disabled={!ui.showCopy} onClick={() => onEvent({ event: UiEvent.Copy })}>Copy</Button>
			<Button disabled={!ui.showPaste} onClick={() => onEvent({ event: UiEvent.Paste })}
				>Paste</Button
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
