<script lang="ts">
	import { GridEvent, type Grid, type OnEvent } from '$lib';

	let {
		grid,
		onEvent
	}: {
		grid: Grid;
		onEvent: OnEvent;
	} = $props();

	$effect(() => {
		bpm = grid.config.bpm;
		bars = grid.config.bars;
		beatsPerBar = grid.config.beatsPerBar;
		beatNoteFraction = grid.config.beatDivisions;
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

	function togglePlaying() {
		onEvent({ event: GridEvent.TogglePlaying, playing: !grid.playing, gridId: grid.id });
	}
	function onBpmChange() {
		bpm = Math.round(Math.min(maxBpm, Math.max(minBpm, bpm)));
		onEvent({
			event:GridEvent.BpmChanged,
			bpm: bpm,
			gridId: grid.id
		});
	}
	function onBarsChange() {
		bars = Math.round(Math.min(maxBars, Math.max(minBars, bars)));
		onEvent({
			event: GridEvent.BarsChanged,
			bars: bars,
			gridId: grid.id
		});
	}
	function onBeatsPerBarChange() {
		beatsPerBar = Math.round(Math.min(maxGridSize, Math.max(minGridSize, beatsPerBar)));
		onEvent({
			event: GridEvent.GridSizeChanged,
			beats_per_bar: beatsPerBar,
			beat_divisions: beatNoteFraction,
			gridId: grid.id
		});
	}
	function onBeatNoteFractionChange() {
		beatNoteFraction = Math.round(Math.min(maxGridSize, Math.max(minGridSize, beatNoteFraction)));
		onEvent({
			event: GridEvent.GridSizeChanged,
			beats_per_bar: beatsPerBar,
			beat_divisions: beatNoteFraction,
			gridId: grid.id
		});
	}
</script>

<div class="flex-left flex-end flex break-after-avoid items-center">
	<button onclick={togglePlaying} class="btn btn-outline my-2 print:invisible">
		{grid.playing ? 'Stop' : 'Play'}
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
