<script lang="ts">
	import { CellToolsEvent, UiEvent, type OnUiEvent } from '$lib';
	import type { CellToolsUi } from '$lib';
	import ButtonFilled from '../ui_elements/ButtonFilled.svelte';

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
			<ButtonFilled
				disabled={!ui.showMergeLeft}
				onClick={() => onEvent({ event: CellToolsEvent.Merge, side: 'left' })}
			>
				← Merge
			</ButtonFilled>
			<ButtonFilled
				disabled={!ui.showMergeRight}
				onClick={() => onEvent({ event: CellToolsEvent.Merge, side: 'right' })}
			>
				→ Merge
			</ButtonFilled>
			<ButtonFilled disabled={!ui.showUnMerge} onClick={() => onEvent({ event: CellToolsEvent.UnMerge })}
				>Un-Merge</ButtonFilled
			>

			<ButtonFilled disabled={!ui.showCopy} onClick={() => onEvent({ event: UiEvent.Copy })}>Copy</ButtonFilled>
			<ButtonFilled disabled={!ui.showPaste} onClick={() => onEvent({ event: UiEvent.Paste })}
				>Paste</ButtonFilled
			>

			{#each ui.hitOptions as [displayString, hits]}
				<ButtonFilled
					onClick={() => onEvent({ event: CellToolsEvent.SelectHitOption, instrumentHits: hits })}
				>
					{displayString}
				</ButtonFilled>
			{/each}
		</div>
	{/if}
</div>
