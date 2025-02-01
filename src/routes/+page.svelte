<script lang="ts">
	import GridCell from './GridCell.svelte';
	import { InstrumentConfig, Instrument } from '$lib';

	let initialInstruments = [
		new InstrumentConfig('kick.wav', 0),
		new InstrumentConfig('snare.wav', 1)
	];

	let audioContext: AudioContext | null = null;
	let grid: Array<Array<boolean>> = Array.from({ length: 8 }, () => Array(8).fill(0));
	let instruments: Array<Instrument> = initialInstruments.map((config: InstrumentConfig) => new Instrument(config));
	let playing = false;
	let bpm: number = 120;
	let nextBeat: number = 0;
	let gridBeat: number = 0;
	let bar = 0;
	let playingIntervalId: number | undefined = undefined;

	// async function loadSound(): Promise<void> {
	// 	if (!audioContext) {
	// 		audioContext = new (window.AudioContext || window.webkitAudioContext)();
	// 	}

	// 	const response = await fetch('./kick.wav');
	// 	const arrayBuffer = await response.arrayBuffer();
	// 	audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	// }

	// async function playSound(): Promise<void> {
	// 	if (!audioBuffer) await loadSound();
	// 	if (!audioContext || !audioBuffer) return;

	// 	const source: AudioBufferSourceNode = audioContext.createBufferSource();
	// 	source.buffer = audioBuffer;
	// 	source.connect(audioContext.destination);
	// 	source.start(0);
	// }

    function getAudioContext() {
        if (!audioContext) {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
		}
        return audioContext
    }

	async function togglePlaying(): Promise<void> {
		if (playing) {
			stop();
		} else {
			play();
		}
	}

	function play() {
        for (let instrument of instruments){
            if (!instrument.isLoaded()) instrument.loadAudio(getAudioContext())
        }
		// Every beat takes this number of ms
		const bpmIntervalMs = 60000 / bpm;

		playing = true;
		onBeat();
		playingIntervalId = setInterval(() => {
			onBeat();
		}, bpmIntervalMs);
	}

	function stop() {
		clearInterval(playingIntervalId); // Stop after printing the whole string
		playingIntervalId = undefined;
		playing = false;
		nextBeat = 0;
		bar = 0;
		gridBeat = 0;
	}

	function onBeat() {
		bar = Math.floor(nextBeat / 8);
		gridBeat = nextBeat % 8;
		// console.log(`Bar ${bar}, Beat ${gridBeat}`);
		for (let instrument of instruments) {
			let shouldPlaySound = grid[instrument.config.gridIndex][gridBeat];
			if (shouldPlaySound) {
				instrument.play();
			}
		}
		nextBeat++;
	}

	async function onTapGridCell(row: number, col: number): Promise<void> {
		// console.log(`Tapped row ${row} col ${col}`)
		let currentValue = grid[row][col];
		grid[row][col] = !currentValue;
	}
</script>

<h1>GrvMkr</h1>

<button on:click={togglePlaying}>{playing ? 'Stop' : 'Play'}</button>
<input type="number" bind:value={bpm} min="20" max="200" />

<div class="grid w-64 grid-cols-8 gap-1">
	{#each Array(8) as _, currentBeat}
		<div
			class="h-2 w-8 {currentBeat == gridBeat
				? 'bg-green-300'
				: 'bg-gray-300'} flex items-center justify-center border border-gray-400"
		/>
	{/each}
</div>

<div class="grid w-64 grid-cols-8 gap-1">
	{#each Array(instruments.length) as _, row}
		{#each Array(8) as _, col}
			<GridCell text={col + 1} selected={grid[row][col]} onTap={() => onTapGridCell(row, col)} />
		{/each}
	{/each}
</div>
