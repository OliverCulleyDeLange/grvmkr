<script lang="ts">
  
	import { ToolbarEvent, type OnUiEvent, type ToolbarUi } from '$lib';
	
	let {
		toolbarUi,
		onEvent,
	}: {
		toolbarUi: ToolbarUi;
		onEvent: OnUiEvent;
	} = $props();

	let fileName: string = $state(toolbarUi.fileName);

	$effect(() => {
		fileName = toolbarUi.fileName;
	});

	function onFilenameChange() {
		onEvent({ event: ToolbarEvent.FileNameChanged, fileName: fileName });
	}

	function togglePlayingFile() {
		onEvent({ event: ToolbarEvent.TogglePlayingFile });
	}

</script>

<div class="flex flex-row gap-2 mb-2 w-full print:hidden">
	<!-- Play file button -->
	<button onclick={togglePlayingFile} class="btn btn-outline btn-xl">
		{toolbarUi.playingFile ? 'Stop File' : 'Play File'}
	</button>
	<!-- Filename input -->
	<div class="relative w-full">
		<input
			id="fileName"
			bind:value={fileName}
			oninput={onFilenameChange}
			placeholder=" "
			class="input-xl peer input input-bordered w-full"
		/>
		<label for="fileName" class="absolute left-2 top-1 text-[8px] text-gray-600"> File name </label>
	</div>
</div>

<!-- Print only file name -->
<div class="hidden print:block">
	<h1 class="text-4xl">{fileName}</h1>
</div>
