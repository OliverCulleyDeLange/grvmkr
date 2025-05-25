<script lang="ts">
	import { ToolbarEvent, type OnUiEvent, type ToolbarUi } from '$lib';
	import HelpOverlay from './HelpOverlay.svelte';

	let {
		toolbarUi,
		onEvent
	}: {
		toolbarUi: ToolbarUi;
		onEvent: OnUiEvent;
	} = $props();

	let showHelp: boolean = $state(false);
	let fileName: string = $state(toolbarUi.fileName);
	let showResetConfirmation: boolean = $state(false);

	$effect(() => {
		fileName = toolbarUi.fileName;
	});

	function load(event: Event) {
		const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			let file = fileInput.files[0];
			onEvent({ event: ToolbarEvent.Load, file });
			fileInput.value = '';
		}
	}

	function onFilenameChange() {
		onEvent({ event: ToolbarEvent.FileNameChanged, fileName: fileName });
	}

	function reset() {
		if (showResetConfirmation) {
			showResetConfirmation = false;
			onEvent({ event: ToolbarEvent.Reset });
		} else {
			showResetConfirmation = true;
		}
	}
</script>

<div class="flex flex-col gap-4 p-2 sm:flex-row print:hidden">
	<h1 class="text-3xl">GrvMkr</h1>

	<div>
		<button class="btn btn-outline btn-sm" onclick={() => onEvent({ event: ToolbarEvent.Save })}
			>Save</button
		>
		<button
			class="btn btn-outline btn-sm"
			onclick={() => document.getElementById('hidden-file-input-for-load')?.click()}>Load</button
		>
		<input
			id="hidden-file-input-for-load"
			type="file"
			onchange={load}
			accept="application/json"
			hidden
		/>
		<button class="btn btn-outline btn-sm" onclick={() => window.print()}>Print / Save PDF</button>

		<button class="btn btn-outline btn-sm" onclick={reset}>Reset</button>

		<button class="btn btn-outline btn-sm" onclick={() => (showHelp = !showHelp)}>?</button>
		{#if showHelp}
			<HelpOverlay closeDialog={() => (showHelp = !showHelp)} />
		{/if}
	</div>

	{#if toolbarUi.errors.length > 0}
		<div class="my-4 flex flex-col gap-2">
			{#each toolbarUi.errors as error}
				<div class="alert alert-error">
					{error.message}
					<button
						class="btn btn-circle btn-ghost btn-xs"
						onclick={() => onEvent({ event: ToolbarEvent.DismissError, id: error.id})}
					>
						✕
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<input
	bind:value={fileName}
	oninput={onFilenameChange}
	class="input-xl input input-bordered w-full flex-grow"
/>

{#if showResetConfirmation}
	<dialog open class="modal">
		<div class="modal-box border border-2 border-gray-400">
			<h3 class="text-lg font-bold">This will reset and delete EVERYTHING</h3>
			<p class="py-4">R u sure?</p>
			<button onclick={reset} class={`btn btn-outline m-2`}>
				Yes, reset and delete everything</button
			>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showResetConfirmation = false)}>close</button>
		</form>
	</dialog>
{/if}
