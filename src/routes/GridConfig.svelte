<script lang="ts">
	import type { GridModel } from '$lib';

	type TogglePlaying = (playing: boolean) => void;
	let {
		grid,
		togglePlaying
	}: { grid: GridModel; togglePlaying: TogglePlaying } = $props();
</script>

<div class="flex flex-left items-center flex-end">
	<button
		onclick={() => togglePlaying(!grid.playing)}
		class="my-2 rounded-lg border-2 border-gray-800 px-2 py-1 font-semibold text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 print:invisible"
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
		<span>Time Signature:</span>
		<input type="number" bind:value={grid.beatsPerBar} min="2" max="16" />
		/
		<input type="number" bind:value={grid.beatNoteFraction} min="2" max="16" />
	</div>
	<!-- <p>Ms per division: {msPerBeatDivision}</p> -->
	<!-- <p>Grid columns: {grid.gridCols}</p> -->
</div>