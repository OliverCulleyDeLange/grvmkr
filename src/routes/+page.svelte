<script lang="ts">
	import { InstrumentConfig, Instrument } from '$lib';
	import Grid from './Grid.svelte';

	let initialInstruments = [
		new InstrumentConfig('hat_closed.wav', 0),
		new InstrumentConfig('snare.wav', 1),
		new InstrumentConfig('kick.wav', 2)
	];
	let instruments: Array<Instrument> = initialInstruments.map(
		(config: InstrumentConfig) => new Instrument(config)
	);

	let audioContext: AudioContext | null = null;

	let bpm = $state(120);
	let cellsPerBeat = $state(4);
	let beatsPerBar = $state(4);
	let bars = $state(1);
	let beatNote = $state(4);
	let msPerBeatDivision = $derived(60000 / bpm / cellsPerBeat);
	let gridCells = $derived(cellsPerBeat * beatsPerBar * bars);

	$effect(() => {
		if (gridCells != grid[0].length) {
			console.log('Resizing grid');
			for (let row of grid){
                row.length = gridCells
            }
		}
	});

	let grid: Array<Array<boolean>> = $state(
		Array.from({ length: initialInstruments.length }, () => Array(gridCells).fill(false))
	);

	// Playing state
	let playing = $state(false);
	let nextCount = $state(0);
	let bar = $state(0);
	let beat = $state(0);
	let beatDivision = $state(0);
	let playingIntervalId: number | undefined = undefined;

	function getAudioContext() {
		if (!audioContext) {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
		}
		return audioContext;
	}

	async function togglePlaying(): Promise<void> {
		if (playing) {
			stop();
		} else {
			play();
		}
	}

	async function play() {
		for (let instrument of instruments) {
			if (!instrument.isLoaded()) await instrument.loadAudio(getAudioContext());
		}
		playing = true;
		onBeat();
		playingIntervalId = setInterval(() => {
			onBeat();
		}, msPerBeatDivision);
	}

	function stop() {
		clearInterval(playingIntervalId); // Stop after printing the whole string
		playingIntervalId = undefined;
		playing = false;
		nextCount = 0;
		bar = 0;
		beatDivision = 0;
	}

	function onBeat() {
		let repetition = Math.floor(nextCount / gridCells);
		beatDivision = nextCount % gridCells;
		beat = Math.floor(nextCount / beatsPerBar) % beatsPerBar;
		bar = Math.floor(nextCount / beatsPerBar) % bars;
		console.log(`Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision}`);
		for (let instrument of instruments) {
			let shouldPlaySound = grid[instrument.config.gridIndex][beatDivision];
			if (shouldPlaySound) {
				instrument.play();
			}
		}
		nextCount++;
	}

	async function onTapGridCell(row: number, col: number): Promise<void> {
		let currentValue = grid[row][col];
		grid[row][col] = !currentValue;
		console.log(`Tapped row ${row} col ${col}. ${currentValue} -> ${grid[row][col]}`);
	}
</script>

<div class="m-2 rounded-lg border-2 border-gray-600 p-4">
	<h1>GrvMkr</h1>

	<div class="rounded-lg border-2 border-gray-600 p-1">
		<div>
			<span>BPM:</span>
			<input type="number" bind:value={bpm} min="20" max="200" />
			<input type="range" bind:value={bpm} min="20" max="200" />
		</div>
		<div>
			<span>Bars:</span>
			<input type="number" bind:value={bars} min="1" max="16" />
			<input type="range" bind:value={bars} min="1" max="16" />
		</div>
		<div>
			<span>Beat Divide:</span>
			<input type="number" bind:value={cellsPerBeat} min="2" max="32" />
			<input type="range" bind:value={cellsPerBeat} min="2" max="32" />
		</div>
		<div>
			<span>Time Signature:</span>
			<input type="number" bind:value={beatsPerBar} min="2" max="16" />
			/
			<input type="number" bind:value={beatNote} min="2" max="16" />
		</div>
		<!-- <p>Ms per division: {msPerBeatDivision}</p> -->
	</div>

	<button
		on:click={togglePlaying}
		class="my-2 rounded-lg border-2 border-gray-800 px-2 py-1 font-semibold text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
	>
		{playing ? 'Stop' : 'Play'}
	</button>

	<Grid {grid} {beatsPerBar} {beatDivision} gridCell={beatDivision} {instruments} {onTapGridCell} />
</div>
