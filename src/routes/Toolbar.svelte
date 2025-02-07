<script lang="ts">
	import { ToolbarEvent, type AppError, type OnUiEvent, type ToolbarUi } from '$lib';
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

	$effect(() => {
		onEvent({ event: ToolbarEvent.FileNameChanged, fileName: fileName });
	});

	function load(event: Event) {
		const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			let file = fileInput.files[0];
			onEvent({ event: ToolbarEvent.Load, file });
			fileInput.value = '';
		}
	}
</script>

<div class="flex gap-4 print:hidden">
	<h1 class="text-3xl">GrvMkr</h1>
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

	<button class="btn btn-outline btn-sm" onclick={() => onEvent({ event: ToolbarEvent.Reset })}
		>Reset</button
	>

	<button class="btn btn-outline btn-sm" onclick={() => (showHelp = !showHelp)}>?</button>
	{#if showHelp}
		<HelpOverlay closeDialog={() => (showHelp = !showHelp)} />
	{/if}
</div>

<div class="my-4 flex flex-col gap-2">
	{#each toolbarUi.errors as error}
		<div class="alert alert-error">
			{error.message}
		</div>
	{/each}
</div>

<input bind:value={fileName} class="flex-grow input input-xl input-bordered w-full" />
