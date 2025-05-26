<script lang="ts">
	import { ToolbarEvent, type GrooveSelectorUi, type OnUiEvent } from '$lib';
	import { onMount } from 'svelte';
	import Button from './Button.svelte';

	let {
		ui,
		closeDialog,
		onEvent
	}: {
		ui: GrooveSelectorUi;
		closeDialog: () => void;
		onEvent: OnUiEvent;
	} = $props();

	onMount(() => {
		onEvent({ event: ToolbarEvent.GrooveSelectorShown });
	});

	function onClick(id: string) {
		onEvent({ event: ToolbarEvent.LoadLocalGroove, id });
		closeDialog();
	}
</script>

<dialog open class="modal">
	<div class="modal-box border border-2 border-gray-400">
		<h3 class="text-lg font-bold">My Grooves</h3>
		<ul>
			{#each ui.files as file}
				<li>
					<Button onClick={() => onClick(file.id)}>
						{file.name}
					</Button>
				</li>
			{/each}
		</ul>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
