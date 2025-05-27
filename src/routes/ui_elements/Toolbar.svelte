<script lang="ts">
	import { ToolbarEvent, type OnUiEvent, type ToolbarUi } from '$lib';
	import HelpOverlay from './HelpOverlay.svelte';

	let {
		toolbarUi,
		onEvent,
		toggleGrooveSelector,
		toggleLightDark
	}: {
		toolbarUi: ToolbarUi;
		onEvent: OnUiEvent;
		toggleGrooveSelector: () => void;
		toggleLightDark: () => void;
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
			onEvent({ event: ToolbarEvent.LoadFile, file });
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

	<div class="flex flex-row flex-wrap gap-2">
		<button class="btn btn-outline btn-sm" onclick={() => onEvent({ event: ToolbarEvent.New })}>
			New
		</button>

		<button class="btn btn-outline btn-sm" onclick={() => toggleGrooveSelector()}>
			My Grooves
		</button>

		<button class="btn btn-outline btn-sm" onclick={() => onEvent({ event: ToolbarEvent.Save })}>
			Save to File
		</button>
		<button
			class="btn btn-outline btn-sm"
			onclick={() => document.getElementById('hidden-file-input-for-load')?.click()}
		>
			Load File
		</button>

		<input
			id="hidden-file-input-for-load"
			type="file"
			onchange={load}
			accept="application/json"
			hidden
		/>
		<button class="btn btn-outline btn-sm" onclick={() => window.print()}>
			Print / Save PDF
		</button>

		<button class="btn btn-outline btn-sm" onclick={reset}> Reset </button>

		<button class="btn btn-outline btn-sm" onclick={() => (showHelp = !showHelp)}> ? </button>

		<button onclick={() => toggleLightDark()} class="btn btn-outline btn-sm">
			{toolbarUi.darkMode ? '☀️ Light' : '🌙 Dark'}
		</button>
	</div>
</div>

<!-- TODO Errors are floating and scrollable  -->
{#if toolbarUi.errors.length > 0}
	<div class="my-4 flex flex-col gap-2">
		{#each toolbarUi.errors as error}
			<div class="alert alert-error">
				{error.message}
				<button
					class="btn btn-circle btn-ghost btn-xs"
					onclick={() => onEvent({ event: ToolbarEvent.DismissError, id: error.id })}
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}

<!-- Filename input -->
<div class="relative mb-2 w-full print:hidden">
	<input
		id="fileName"
		bind:value={fileName}
		oninput={onFilenameChange}
		placeholder=" "
		class="input-xl peer input input-bordered w-full"
	/>
	<label for="fileName" class="absolute left-2 top-1 text-[8px] text-gray-600"> File name </label>
</div>

<!-- Print only file name -->
<div class="hidden print:block">
	<h1 class="text-4xl">{fileName}</h1>
</div>

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

{#if showHelp}
	<HelpOverlay closeDialog={() => (showHelp = !showHelp)} />
{/if}
