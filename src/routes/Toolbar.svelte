<script lang="ts">
	import { ToolbarEvent, type OnEvent } from "$lib";

	let {
		onEvent
	}: {
		onEvent: OnEvent;
	} = $props();

    function load(event: Event) {
        const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			let file = fileInput.files[0];
			onEvent({event: ToolbarEvent.Load, file})
			fileInput.value = '';
		}
    }
</script>

<div class="flex gap-8 print:hidden">
    <h1 class="text-3xl">GrvMkr</h1>
    <button class="btn btn-outline btn-sm" onclick={() => onEvent({event: ToolbarEvent.Save})}>Save</button>
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
</div>