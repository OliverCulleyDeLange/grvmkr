<script lang="ts">
	import {
		defaultInstruments,
		GridModel,
		mapSavedGridToGridModel,
		serialiseToJsonV1,
		type CellLocator,
		type SaveFileV1
	} from '$lib';
	import { InstrumentManager } from '$lib/manager/instrument_manager.svelte';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let instrumentManager: InstrumentManager = $state() as InstrumentManager;

	let grids: SvelteMap<number, GridModel> = new SvelteMap();
	let currentlyPlayingGrid: GridModel | undefined = $state();
	let msPerBeatDivision = $derived(currentlyPlayingGrid?.msPerBeatDivision);
	let playingIntervalId: number | undefined = undefined;

	// Playing state
	let playing = $state(false);
	let nextCount: number = 0;

	onMount(() => {
		instrumentManager = new InstrumentManager(defaultInstruments);
		// Add initial grid, and set active
		grids.set(0, new GridModel(instrumentManager));
	});

	$effect(() => {
		if (playing) {
			onBeat();
			// console.log('Setting interval', msPerBeatDivision);
			playingIntervalId = setInterval(() => {
				onBeat();
			}, msPerBeatDivision);
		} else {
			stop();
		}
		return () => {
			// console.log('Clearing interval', msPerBeatDivision);
			clearInterval(playingIntervalId);
		};
	});

	async function onTogglePlaying(newPlaying: boolean, gridId: number): Promise<void> {
		if (newPlaying) {
			await instrumentManager.initInstruments();
			currentlyPlayingGrid = grids.get(gridId);
		} else {
			currentlyPlayingGrid = undefined;
		}
		playing = newPlaying;
	}

	function stop() {
		clearInterval(playingIntervalId);
		playingIntervalId = undefined;
		playing = false;
		nextCount = 0;
	}

	async function onBeat() {
		if (!currentlyPlayingGrid) return;
		let count = nextCount++;
		let cell = count % currentlyPlayingGrid.gridCols;
		let repetition = Math.floor(count / currentlyPlayingGrid.gridCols);
		let bar =
			Math.floor(
				count / (currentlyPlayingGrid.beatsPerBar * currentlyPlayingGrid.beatNoteFraction)
			) % currentlyPlayingGrid.bars;
		let beat =
			Math.floor(count / currentlyPlayingGrid.beatNoteFraction) % currentlyPlayingGrid.beatsPerBar;
		let beatDivision = count % currentlyPlayingGrid.beatNoteFraction;

		// console.log(
		// 	`Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${currentlyPlayingGrid.gridCols})`
		// );

		currentlyPlayingGrid.rows.forEach((row, rowI) => {
			let locator: CellLocator = {
				row: rowI,
				notationLocator: { bar: bar, beat: beat, division: beatDivision }
			};
			instrumentManager.playHit(currentlyPlayingGrid?.currentHit(locator));
		});
		currentlyPlayingGrid.currentColumn = cell;
	}

	function save() {
		let saveFile = serialiseToJsonV1(
			[...grids.values()],
			[...instrumentManager.instruments.values()]
		);
		const text = JSON.stringify(saveFile);
		const blob = new Blob([text], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `GrvMkr_v${saveFile.version}-${new Date().toISOString()}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	async function loadFile(event: Event) {
		const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			let file = fileInput.files[0];
			let saveFile: SaveFileV1 = JSON.parse(await file.text());
			instrumentManager.replaceInstruments(saveFile.instruments);

			grids.clear();
			saveFile.grids.forEach((grid, index) => {
				let gridModel: GridModel = mapSavedGridToGridModel(grid, instrumentManager);
				grids.set(index, gridModel);
			});
			fileInput.value = ''
		}
	}
</script>

<div class="m-2 p-4">
	<div class="flex gap-8 print:hidden">
		<h1 class="text-3xl">GrvMkr</h1>
		<button class="btn btn-outline btn-sm" onclick={save}>Save</button>
		<button
			class="btn btn-outline btn-sm"
			onclick={() => document.getElementById('hidden-file-input-for-load')?.click()}>Load</button
		>
		<input
			id="hidden-file-input-for-load"
			type="file"
			onchange={loadFile}
			accept="application/json"
			hidden
		/>
		<button class="btn btn-outline btn-sm" onclick={() => window.print()}>Print / Save PDF</button>
	</div>
	{#if instrumentManager != undefined}
		<Grids {instrumentManager} {grids} {currentlyPlayingGrid} {onTogglePlaying} />
		<div class="print:hidden">
			<Instruments {instrumentManager} />
		</div>
	{/if}
</div>
