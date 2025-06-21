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

<div class="pointer-events-none">
	{#if ui.show}
		<div class="flex flex-wrap items-center justify-start">
			<ButtonFilled disabled={!ui.showCopy} onClick={() => onEvent({ event: UiEvent.Copy })}
				>Copy</ButtonFilled
			>
			<ButtonFilled disabled={!ui.showPaste} onClick={() => onEvent({ event: UiEvent.Paste })}
				>Paste</ButtonFilled
			>

			<ButtonFilled
				disabled={!ui.showMerge}
				onClick={() => onEvent({ event: CellToolsEvent.Merge })}
			>
				Merge</ButtonFilled
			>

			<ButtonFilled
				disabled={!ui.showUnMerge}
				onClick={() => onEvent({ event: CellToolsEvent.UnMerge })}>Un-Merge</ButtonFilled
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
