<script lang="ts">
	import { ContextMenuEvent, type ContextMenu, type OnUiEvent } from "$lib";


	let {
        contextMenu,
		onEvent
	}: {
        contextMenu: ContextMenu;
		onEvent: OnUiEvent;
	} = $props();

    function onTripletRight() {
        onEvent({event: ContextMenuEvent.MergeCells, side: 'right', locator: contextMenu.locator})
    }
    function onTripletLeft() {
        onEvent({event: ContextMenuEvent.MergeCells, side: 'left', locator: contextMenu.locator})
    }
</script>

{#if contextMenu}
	<div
		class="context-menu flex flex-row"
		style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
	>
		<button class="menu-item" onclick={onTripletLeft}>← Merge</button>
		<button class="menu-item" onclick={onTripletRight}>Merge →</button>
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
