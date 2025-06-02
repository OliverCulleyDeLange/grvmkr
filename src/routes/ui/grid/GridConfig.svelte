<script lang="ts">
	import { GridEvent, type GridUi, type OnUiEvent } from '$lib';
	import Button from '../ui_elements/Button.svelte';

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

	const minRepetitions = 1;
	const maxRepetitions = 32;
	let repetitions = $state(1);

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

	function togglePlayingGrid() {
		onEvent({ event: GridEvent.TogglePlayingGrid, playing: !gridUi.playing, gridId: gridUi.id });
	}
	function onNameChange() {
		onEvent({ event: GridEvent.NameChanged, gridId: gridUi.id, name: gridName });
	}
	function onRepetitionsChange() {
		repetitions = Math.round(Math.min(maxRepetitions, Math.max(minRepetitions, repetitions)));
		onEvent({
			event: GridEvent.RepetitionsChanged,
			repetitions: repetitions,
			gridId: gridUi.id
		});
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

<!-- Outer container (hidden for print)-->
<div
	class="mb-2 flex flex-col flex-wrap items-start items-center gap-2 rounded-lg bg-gray-100 p-2 dark:bg-[#171c23] print:hidden"
>
	<!-- Play, grid name, settings button -->
	<div class="flex w-full flex-row items-center gap-2">
		<button onclick={togglePlayingGrid} class="btn btn-outline btn-sm">
			{gridUi.playing ? 'Stop Grid' : 'Play Grid'}
		</button>

		<input
			bind:value={gridName}
			oninput={onNameChange}
			class="input input-sm input-bordered w-0 min-w-0 flex-1"
		/>

		<Button onClick={() => onEvent({ event: GridEvent.ToggleToolsExpansion, id: gridUi.id })}
			>Tools</Button
		>
	</div>
	<!-- Grid config -->
	{#if gridUi.toolsExpanded}
		<!-- BPM / Bars / Grid Size  -->
		<div class="grid-config flex w-full flex-col flex-wrap items-start gap-2 sm:flex-row">
			<div class="mx-4 flex flex-nowrap items-center gap-2">
				<div>Repetitions:</div>
				<input
					type="number"
					step="1"
					bind:value={repetitions}
					onchange={onRepetitionsChange}
					min={minRepetitions}
					max={maxRepetitions}
					class="input input-xs input-bordered w-16"
				/>
			</div>

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

		<div class="grid-tools flex w-full flex-row flex-wrap items-start">
			<Button
				onClick={() => onEvent({ event: GridEvent.DuplicateGrid, gridId: gridUi.id })}
				classes="print:hidden"
			>
				Duplicate Grid to End
			</Button>

			<Button
				onClick={() => onEvent({ event: GridEvent.MoveGridUp, gridId: gridUi.id })}
				classes="print:hidden"
			>
				⬇️ Move Up
			</Button>

			<Button
				onClick={() => onEvent({ event: GridEvent.MoveGridDown, gridId: gridUi.id })}
				classes="print:hidden"
			>
				⬇️ Move Down
			</Button>
		</div>
	{/if}
</div>

<!-- Print only config -->
<div class="hidden print:block">
	<!-- Print grid name, and config -->
	<h4 class="text-2xl">
		{gridUi.config.name}
	</h4>
	<div class="flex flex-row items-center gap-2">
		<span>BPM: {gridUi.config.bpm}</span>
		<span>Bars: {gridUi.config.bars}</span>
		<span>Grid size: {gridUi.config.beatsPerBar}/{gridUi.config.beatDivisions}</span>
	</div>
</div>
