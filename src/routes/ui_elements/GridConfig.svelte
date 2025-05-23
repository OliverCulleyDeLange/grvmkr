<script lang="ts">
	import { GridEvent, type GridUi, type OnUiEvent } from '$lib';

	let {
		gridUi,
		onEvent
	}: {
		gridUi: GridUi;
		onEvent: OnUiEvent;
	} = $props();

	$effect(() => {
		gridName = gridUi.config.name;
		bpm = gridUi.config.bpm;
		bars = gridUi.config.bars;
		beatsPerBar = gridUi.config.beatsPerBar;
		beatNoteFraction = gridUi.config.beatDivisions;
	});

	let gridName: string = $state(gridUi.config.name);

	const minBpm = 20;
	const maxBpm = 200;
	let bpm = $state(120);

	const minBars = 1;
	const maxBars = 6; // 3 sections fit nicely onto one sheet of A4
	let bars = $state(1);

	const minGridSize = 1;
	const maxGridSize = 8;
	let beatsPerBar = $state(4);
	let beatNoteFraction = $state(4);

	function togglePlaying() {
		onEvent({ event: GridEvent.TogglePlaying, playing: !gridUi.playing, gridId: gridUi.id });
	}
	function onNameChange() {
		onEvent({ event: GridEvent.NameChanged, gridId: gridUi.id, name: gridName });
	}
	function onBpmChange() {
		bpm = Math.round(Math.min(maxBpm, Math.max(minBpm, bpm)));
		onEvent({
			event: GridEvent.BpmChanged,
			bpm: bpm,
			gridId: gridUi.id
		});
	}
	function onBarsChange() {
		bars = Math.round(Math.min(maxBars, Math.max(minBars, bars)));
		onEvent({
			event: GridEvent.BarsChanged,
			bars: bars,
			gridId: gridUi.id
		});
	}
	function onBeatsPerBarChange() {
		beatsPerBar = Math.round(Math.min(maxGridSize, Math.max(minGridSize, beatsPerBar)));
		onEvent({
			event: GridEvent.GridSizeChanged,
			beats_per_bar: beatsPerBar,
			beat_divisions: beatNoteFraction,
			gridId: gridUi.id
		});
	}
	function onBeatNoteFractionChange() {
		beatNoteFraction = Math.round(Math.min(maxGridSize, Math.max(minGridSize, beatNoteFraction)));
		onEvent({
			event: GridEvent.GridSizeChanged,
			beats_per_bar: beatsPerBar,
			beat_divisions: beatNoteFraction,
			gridId: gridUi.id
		});
	}
</script>

<div class="flex break-after-avoid flex-wrap items-center gap-2 p-2">
	<div class="flex flex-col items-center gap-2 sm:flex-row">
		<button onclick={togglePlaying} class="btn btn-outline btn-sm my-2 print:invisible">
			{gridUi.playing ? 'Stop' : 'Play'}
		</button>

		<input bind:value={gridName} onchange={onNameChange} class="input input-sm input-bordered" />
	</div>
	<div class="flex flex-col items-start gap-2 sm:flex-row">
		<div class="mx-4 flex flex-nowrap items-center gap-2">
			<div>BPM:</div>
			<input
				type="number"
				step="1"
				bind:value={bpm}
				onchange={onBpmChange}
				min={minBpm}
				max={maxBpm}
				class="input input-xs input-bordered w-16"
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

		<div class="mx-4 flex flex-nowrap items-center gap-2">
			<div>Bars:</div>
			<input
				type="number"
				step="1"
				bind:value={bars}
				onchange={onBarsChange}
				min={minBars}
				max={maxBars}
				class="input input-xs input-bordered"
			/>
		</div>
		<div class="mx-4 flex flex-nowrap items-center gap-2">
			<div class="whitespace-nowrap">Grid size:</div>
			<input
				type="number"
				step="1"
				bind:value={beatsPerBar}
				onchange={onBeatsPerBarChange}
				min={minGridSize}
				max={maxGridSize}
				class="input input-xs input-bordered"
			/>
			/
			<input
				type="number"
				step="1"
				bind:value={beatNoteFraction}
				onchange={onBeatNoteFractionChange}
				min={minGridSize}
				max={maxGridSize}
				class="input input-xs input-bordered"
			/>
		</div>
	</div>
</div>
