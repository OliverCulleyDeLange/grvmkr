<script lang="ts">
	import GridCell from './GridCell.svelte';

	let audioContext: AudioContext | null = null;
	let audioBuffer: AudioBuffer | null = null;
	let grid: Array<Array<boolean>> = Array.from({ length: 8 }, () => Array(8).fill(0));
	let playing = false;
	let bpm: number = 120;
	let beat: number = 0;
	let playingIntervalId: number | undefined = undefined;

	async function loadSound(): Promise<void> {
		if (!audioContext) {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
		}

		const response = await fetch('./kick.wav');
		const arrayBuffer = await response.arrayBuffer();
		audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	}

	async function playSound(): Promise<void> {
		if (!audioBuffer) await loadSound();
		if (!audioContext || !audioBuffer) return;

		const source: AudioBufferSourceNode = audioContext.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(audioContext.destination);
		source.start(0);
	}

	async function togglePlaying(): Promise<void> {
		if (playing) {
			clearInterval(playingIntervalId); // Stop after printing the whole string
			playingIntervalId = undefined;
			playing = false;
		} else {
			// Every beat takes this number of ms
			const bpmIntervalMs = 60000 / bpm;

			onBeat(0, beat++);
			playingIntervalId = setInterval(() => {
				let newBeat = beat++;
				onBeat(Math.floor(newBeat / 8), newBeat % 8);
			}, bpmIntervalMs);
			playing = true;
		}
	}

	function onBeat(bar: number, beat: number) {
		console.log(`Bar ${bar}, Beat ${beat}`);
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
	{#each Array(1) as _, row}
		{#each Array(8) as _, col}
			<GridCell text={col + 1} selected={grid[row][col]} onTap={() => onTapGridCell(row, col)} />
		{/each}
	{/each}
</div>
