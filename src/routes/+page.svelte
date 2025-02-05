<script lang="ts">
	import {
		buildDefaultGrid,
		defaultInstruments,
		mapSavedGridToGrid,
		serialiseToJsonV1,
		type BeatDivision,
		type CellLocator,
		type Grid,
		type GridId,
		type GridRow,
		type HitId,
		type InstrumentHit,
		type InstrumentId,
		type InstrumentWithId,
		type SaveFileV1
	} from '$lib';
	import { InstrumentManager } from '$lib/manager/instrument_manager.svelte';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let instrumentManager: InstrumentManager = $state(new InstrumentManager());

	let grids: SvelteMap<GridId, Grid> = new SvelteMap();

	let currentlyPlayingGrid: Grid | undefined = $state();

	let msPerBeatDivision = $derived(currentlyPlayingGrid?.msPerBeatDivision);

	let playingIntervalId: number | undefined = undefined;

	// Playing state
	let playing = $state(false);
	let currentColumn = $state(0);
	let nextCount: number = 0;

	onMount(() => {
		instrumentManager.initialise().then(() => {
			let grid: Grid = $state(buildDefaultGrid(instrumentManager.instruments));
			grids.set(grid.id, grid);
		});
	});

	$effect(() => {
		if (playing) {
			onBeat();
			playingIntervalId = setInterval(() => {
				onBeat();
			}, msPerBeatDivision);
		} else {
			stop();
		}
		return () => {
			clearInterval(playingIntervalId);
		};
	});

	async function onTogglePlaying(newPlaying: boolean, gridId: GridId): Promise<void> {
		if (newPlaying) {
			await instrumentManager.ensureInstrumentsInitialised();
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

	// TODO Extract play logic out of view
	async function onBeat() {
		if (!currentlyPlayingGrid) return;
		let count = nextCount++;
		let cell = count % currentlyPlayingGrid.gridCols;
		let repetition = Math.floor(count / currentlyPlayingGrid.gridCols);
		let bar =
			Math.floor(
				count /
					(currentlyPlayingGrid.config.beatsPerBar * currentlyPlayingGrid.config.beatDivisions)
			) % currentlyPlayingGrid.config.bars;
		let beat =
			Math.floor(count / currentlyPlayingGrid.config.beatDivisions) %
			currentlyPlayingGrid.config.beatsPerBar;
		let beatDivision = count % currentlyPlayingGrid.config.beatDivisions;

		console.log(
			`Repetition: ${repetition}, Bar ${bar}, Beat ${beat}, Division ${beatDivision} (cell: ${count}, gridCells; ${currentlyPlayingGrid.gridCols})`
		);

		currentlyPlayingGrid.rows.forEach((row, rowI) => {
			let locator: CellLocator = {
				grid: currentlyPlayingGrid!.id,
				row: rowI,
				notationLocator: { bar: bar, beat: beat, division: beatDivision }
			};
			let currentHit = getCurrentHit(currentlyPlayingGrid, locator);
			instrumentManager.playHit(currentHit);
		});
		currentColumn = cell;
	}

	function getCurrentHit(
		currentlyPlayingGrid: Grid | undefined,
		locator: CellLocator
	): InstrumentHit | undefined {
		if (!currentlyPlayingGrid) return undefined;
		return getCurrentlyPlayingGridCell(currentlyPlayingGrid, locator).hit;
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
			await instrumentManager.replaceInstruments(saveFile.instruments);

			grids.clear();
			saveFile.grids.forEach((grid) => {
				let gridModel: Grid = $state(mapSavedGridToGrid(grid, instrumentManager));
				grids.set(grid.id, gridModel);
			});
			fileInput.value = '';
		}
	}

	function addGrid() {
		let newGrid = $state(buildDefaultGrid(instrumentManager.instruments));
		grids.set(newGrid.id, newGrid);
	}

	// Toggle the hit in the cell when the user clicks the cell
	// Also plays the sound
	function onTapGridCell(locator: CellLocator) {
		let row = grids.get(locator.grid)?.rows[locator.row];
		if (row) {
			let currentValue = currentHit(locator);
			let newInstrumentHit: InstrumentHit | undefined = nextHitType(row, currentValue?.hitId);
			// console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
			updateCellHit(locator, newInstrumentHit);
			instrumentManager?.playHit(newInstrumentHit);
		} else {
			console.error(`Can't toggle grid cell hit as can't find the row. Locator: `, locator, ", grids:", grids)
		}
	}

	// Returns the next cyclic hit type.
	// Clicking a cell cycles through all the available hit types
	// TODO Would maybe be better to use right clicking or long pressing or something
	function nextHitType(row: GridRow, hitId: HitId | undefined): InstrumentHit | undefined {
		let hits = Array.from(row.instrument.hitTypes.values());
		let instrumentHit = {
			instrumentId: row.instrument.id,
			hitId: hits[0].id
		};
		if (hitId == undefined) return instrumentHit;
		let currentIndex = hits.findIndex((ht) => {
			return ht.id == hitId;
		});
		if (currentIndex + 1 >= hits.length) {
			return undefined;
		} else {
			instrumentHit.hitId = hits[currentIndex + 1].id;
			return instrumentHit;
		}
	}

	function updateCellHit(locator: CellLocator, hit: InstrumentHit | undefined) {
		let division = getCell(locator);
		if (division) {
			division.hit = hit;
		} else {
			console.error("Couldn't update cell hit");
		}
	}

	function currentHit(locator: CellLocator): InstrumentHit | undefined {
		return getCell(locator)?.hit;
	}

	//TODO DRY
	function getCell(locator: CellLocator): BeatDivision | undefined {
		return grids.get(locator.grid)?.rows[locator.row].notation.bars[locator.notationLocator.bar]
			.beats[locator.notationLocator.beat].divisions[locator.notationLocator.division];
	}

	function getCurrentlyPlayingGridCell(
		currentlyPlayingGrid: Grid,
		locator: CellLocator
	): BeatDivision {
		return currentlyPlayingGrid.rows[locator.row].notation.bars[locator.notationLocator.bar].beats[
			locator.notationLocator.beat
		].divisions[locator.notationLocator.division];
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
		<Grids
			{instrumentManager}
			{grids}
			{currentlyPlayingGrid}
			{currentColumn}
			{onTapGridCell}
			onTogglePlaying={(newPlaying: boolean, gridKey: GridId) =>
				onTogglePlaying(newPlaying, gridKey)}
		/>

		<div class="flex">
			<button onclick={addGrid} class="btn btn-outline btn-xs m-2 ml-auto print:hidden">
				Add Grid
			</button>
		</div>

		<div class="print:hidden">
			<Instruments {instrumentManager} />
		</div>
	{/if}
</div>
