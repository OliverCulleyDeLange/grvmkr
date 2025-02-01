<script lang="ts">
	import GridCell from './GridCell.svelte';

	let audioContext: AudioContext | null = null;
	let audioBuffer: AudioBuffer | null = null;
	let grid: Array<Array<boolean>> = Array.from({ length: 8 }, () => Array(8).fill(0));
	let playing = false;
	let bpm: number = 120;
	let nextBeat: number = 0;
	let gridBeat: number = 0;
    let bar = 0;
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
            nextBeat = 0
            bar = 0
            gridBeat = 0
		} else {
			// Every beat takes this number of ms
			const bpmIntervalMs = 60000 / bpm;

            playing = true;
			onBeat();
			playingIntervalId = setInterval(() => {
				onBeat();
			}, bpmIntervalMs);
		}
	}

	function onBeat() {
        bar = Math.floor(nextBeat / 8)
        gridBeat = nextBeat % 8
		console.log(`Bar ${bar}, Beat ${gridBeat}`);
        let shouldPlaySound = grid[0][gridBeat]
        if (shouldPlaySound){
            playSound()
        }
        nextBeat++
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
    <div class="w-8 h-2 {currentBeat == gridBeat ? "bg-green-300" : "bg-gray-300"} flex items-center justify-center border border-gray-400">
    </div>
    {/each}
</div>

<div class="grid w-64 grid-cols-8 gap-1">
	{#each Array(1) as _, row}
		{#each Array(8) as _, col}
			<GridCell text={col + 1} selected={grid[row][col]} onTap={() => onTapGridCell(row, col)} />
		{/each}
	{/each}
</div>
