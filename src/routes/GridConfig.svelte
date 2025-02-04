<script lang="ts">
	import type { GridModel } from '$lib';

	type TogglePlaying = (playing: boolean) => void;
	let {
		grid,
		togglePlaying
	}: { grid: GridModel; togglePlaying: TogglePlaying } = $props();
</script>

<div class="flex flex-left items-center flex-end break-after-avoid">
	<button
		onclick={() => togglePlaying(!grid.playing)}
		class="my-2 btn btn-outline print:invisible"
	>
		{grid.playing ? 'Stop' : 'Play'}
	</button>

	<div class="mx-4">
		<span>BPM:</span>
		<input type="number" bind:value={grid.bpm} min="20" max="200" />
		<input type="range" bind:value={grid.bpm} min="20" max="200" class="print:hidden" />
	</div>
	<div class="mx-4">
		<span>Bars:</span>
		<input type="number" bind:value={grid.bars} min="1" max="16" />
	</div>
	<div class="mx-4">
		<span>Grid size:</span>
		<input type="number" bind:value={grid.beatsPerBar} min="2" max="16" />
		/
		<input type="number" bind:value={grid.beatNoteFraction} min="2" max="16" />
	</div>
</div>