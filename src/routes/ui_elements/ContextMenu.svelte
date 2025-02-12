<script lang="ts">
	import { ContextMenuEvent, type ContextMenuUi, type OnUiEvent } from '$lib';

	let {
		ui,
		onEvent
	}: {
		ui: ContextMenuUi;
		onEvent: OnUiEvent;
	} = $props();

	function onTripletRight() {
		onEvent({ event: ContextMenuEvent.MergeCells, side: 'right', locator: ui.locator });
	}
	function onTripletLeft() {
		onEvent({ event: ContextMenuEvent.MergeCells, side: 'left', locator: ui.locator });
	}
	function onUnmerge() {
		onEvent({ event: ContextMenuEvent.UnMerge, locator: ui.locator });
	}
	function dismiss() {
		onEvent({ event: ContextMenuEvent.Dismiss });
	}
</script>

{#if ui}
	<div 
	class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30"
	onclick={dismiss}
	>
		<div class="context-menu flex flex-row" style="top: {ui.y}px; left: {ui.x}px;">
			{#if ui.showMergeLeft}
				<button class="menu-item" onclick={onTripletLeft}>← Merge</button>
			{/if}
			{#if ui.showUnmerge}
				<button class="menu-item" onclick={onUnmerge}>Unmerge</button>
			{/if}
			{#if ui.showMergeRight}
				<button class="menu-item" onclick={onTripletRight}>Merge →</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.context-menu {
		position: absolute;
		background: white;
		border: 1px solid black;
		transform: translate(-50%, -50%);
	}

	.menu-item {
		padding: 5px;
		cursor: pointer;
	}

	.menu-item:hover {
		background: lightgray;
	}
</style>
