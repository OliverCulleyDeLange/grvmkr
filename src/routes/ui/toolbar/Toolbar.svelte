<script lang="ts">
	
	
	import ToolbarErrors from './ToolbarErrors.svelte';

	import { ToolbarEvent, type OnUiEvent, type ToolbarUi } from '$lib';
	import PlayAndFileName from './PlayAndFileName.svelte';

	let {
		toolbarUi,
		onEvent,
		toggleGrooveSelector,
		toggleLightDark,
		toggleShowHelp,
	}: {
		toolbarUi: ToolbarUi;
		onEvent: OnUiEvent;
		toggleGrooveSelector: () => void;
		toggleLightDark: () => void;
		toggleShowHelp: () => void;
	} = $props();

	function load(event: Event) {
		const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			let file = fileInput.files[0];
			onEvent({ event: ToolbarEvent.LoadFile, file });
			fileInput.value = '';
		}
	}
</script>

<div class="mb-2 flex flex-col gap-4 sm:flex-row print:hidden">
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
			accept=".json,.zip,.grv"
			hidden
		/>
		<button class="btn btn-outline btn-sm" onclick={() => window.print()}>
			Print / Save PDF
		</button>

		<button class="btn btn-outline btn-sm" onclick={toggleShowHelp}> ? </button>

		<button onclick={() => toggleLightDark()} class="btn btn-outline btn-sm">
			{toolbarUi.darkMode ? '☀️ Light' : '🌙 Dark'}
		</button>
	</div>
</div>

<ToolbarErrors errorsUi={toolbarUi.errors} {onEvent} />

<PlayAndFileName {toolbarUi} {onEvent} />
