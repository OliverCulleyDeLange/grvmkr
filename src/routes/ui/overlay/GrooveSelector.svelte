<script lang="ts">
	import { ToolbarEvent, type GrooveSelectorUi, type OnUiEvent } from '$lib';
	import { onMount } from 'svelte';

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

	function onDelete(id: string) {
		onEvent({ event: ToolbarEvent.DeleteLocalGroove, id });
	}
</script>

<dialog open class="modal">
	<div class="modal-box border border-2 border-gray-400">
		<h3 class="mb-4 text-lg font-bold">My Grooves</h3>
		<ul class="flex flex-col gap-2">
			{#each ui.files as file}
				<li class="flex items-center justify-between">
					<button
						type="button"
						class="flex-1 rounded p-2 text-left hover:bg-black/10 dark:hover:bg-white/10"
						onclick={() => onClick(file.id)}
					>
						{file.name}
					</button>
					<button
						type="button"
						class="ml-2 rounded p-2 text-red-500 hover:bg-black/10 hover:text-red-700 dark:hover:bg-white/10"
						onclick={() => onDelete(file.id)}
						aria-label="Delete"
					>
						Delete
					</button>
				</li>
			{/each}
		</ul>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={closeDialog}>close</button>
	</form>
</dialog>
