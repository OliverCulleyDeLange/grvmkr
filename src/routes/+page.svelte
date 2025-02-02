<script lang="ts">
	import { GridModel } from '$lib';
	import type { CellLocator } from '$lib/types';
	import Grid from './Grid.svelte';

	let bpm = $state(120);
    let grid: GridModel = $state(new GridModel());
	let msPerBeatDivision = $derived(60000 / bpm / grid.cellsPerBeat);

	// Playing state
	let playing = $state(false);
	let nextCount: number = 0;
	let playingIntervalId: number | undefined = undefined;

	$effect(() => {
		if (playing) {
			onBeat();
			console.log('Setting interval');
			playingIntervalId = setInterval(() => {
				onBeat();
			}, msPerBeatDivision);
		} else {
            stop()
        }
		return () => {
			console.log('Clearing interval');
			clearInterval(playingIntervalId);
		};
	});

	async function togglePlaying(): Promise<void> {
		await grid.initInstruments()
		playing = !playing;
	}


	function stop() {
		clearInterval(playingIntervalId); 
		playingIntervalId = undefined;
		playing = false;
		nextCount = 0;
	}

	async function onBeat() {
		grid.playBeat(nextCount++)
	}

	async function onTapGridCell(locator: CellLocator): Promise<void> {
        grid.toggleLocation(locator)
	}
</script>

<div class="m-2 rounded-lg border-2 border-gray-600 p-4">
	<h1>GrvMkr</h1>

	<div class="my-2 rounded-lg border-2 border-gray-600 p-1">
		<div>
			<span>BPM:</span>
			<input type="number" bind:value={bpm} min="20" max="200" />
			<input type="range" bind:value={bpm} min="20" max="200" class="print:hidden"/>
		</div>
		<div>
			<span>Bars:</span>
			<input type="number" bind:value={grid.bars} min="1" max="16" />
			<!-- <input type="range" bind:value={bars} min="1" max="16" /> -->
		</div>
		<div>
			<span>Beat Divide:</span>
			<input type="number" bind:value={grid.cellsPerBeat} min="2" max="32" />
			<!-- <input type="range" bind:value={grid.cellsPerBeat} min="2" max="32" /> -->
		</div>
		<div>
			<span>Time Signature:</span>
			<input type="number" bind:value={grid.beatsPerBar} min="2" max="16" />
			<!-- / -->
			<!-- <input type="number" bind:value={grid.beatNote} min="2" max="16" /> -->
		</div>
		<!-- <p>Ms per division: {msPerBeatDivision}</p> -->
		<!-- <p>Grid columns: {grid.gridCols}</p> -->
	</div>

	<button
		on:click={togglePlaying}
		class="print:hidden my-2 rounded-lg border-2 border-gray-800 px-2 py-1 font-semibold text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
	>
		{playing ? 'Stop' : 'Play'}
	</button>

	<Grid {grid} {onTapGridCell} />
</div>
