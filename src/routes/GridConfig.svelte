<script lang="ts">
	import type { GridModel } from '$lib';
	import { onMount } from 'svelte';

	type TogglePlaying = (playing: boolean) => void;
	let {
		grid,
		playing,
		togglePlaying
	}: {
		grid: GridModel;
		playing: boolean;
		togglePlaying: TogglePlaying;
	} = $props();

	onMount(() => {
		bpm = grid.bpm
		bars = grid.bars
		beatsPerBar = grid.beatsPerBar
		beatNoteFraction = grid.beatNoteFraction
	});

	const minBpm = 20;
	const maxBpm = 200;
	let bpm = $state(120);

	const minBars = 1;
	const maxBars = 4;
	let bars = $state(1);

	const minGridSize = 1;
	const maxGridSize = 8;
	let beatsPerBar = $state(4);
	let beatNoteFraction = $state(4);

	function onBpmChange() {
		bpm = Math.round(Math.min(maxBpm, Math.max(minBpm, bpm)));
		grid.bpm = bpm;
	}
	function onBarsChange() {
		bars = Math.round(Math.min(maxBars, Math.max(minBars, bars)));
		grid.bars = bars;
	}
	function onBeatsPerBarChange() {
		beatsPerBar = Math.round(Math.min(maxGridSize, Math.max(minGridSize, beatsPerBar)));
		grid.beatsPerBar = beatsPerBar;
	}
	function onBeatNoteFractionChange() {
		beatNoteFraction = Math.round(Math.min(maxGridSize, Math.max(minGridSize, beatNoteFraction)));
		grid.beatNoteFraction = beatNoteFraction;
	}
</script>

<div class="flex-left flex-end flex break-after-avoid items-center">
	<button onclick={() => togglePlaying(!playing)} class="btn btn-outline my-2 print:invisible">
		{playing ? 'Stop' : 'Play'}
	</button>

	<div class="mx-4">
		<span>BPM:</span>
		<input
			type="number"
			step="1"
			bind:value={bpm}
			onchange={onBpmChange}
			min={minBpm}
			max={maxBpm}
		/>
		<input
			type="range"
			step="1"
			bind:value={bpm}
			oninput={onBpmChange}
			min={minBpm}
			max={maxBpm}
			class="print:hidden"
		/>
	</div>
	<div class="mx-4">
		<span>Bars:</span>
		<input
			type="number"
			step="1"
			bind:value={bars}
			onchange={onBarsChange}
			min={minBars}
			max={maxBars}
		/>
	</div>
	<div class="mx-4">
		<span>Grid size:</span>
		<input
			type="number"
			step="1"
			bind:value={beatsPerBar}
			onchange={onBeatsPerBarChange}
			min={minGridSize}
			max={maxGridSize}
		/>
		/
		<input
			type="number"
			step="1"
			bind:value={beatNoteFraction}
			onchange={onBeatNoteFractionChange}
			min={minGridSize}
			max={maxGridSize}
		/>
	</div>
</div>
