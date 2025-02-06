<script lang="ts">
	import {
		buildDefaultGrid,
		defaultBar,
		defaultBeat,
		defaultBeatDivision,
		defaultGridRow,
		GridEvent,
		mapSavedGridToGrid,
		serialiseToJsonV1,
		type BeatDivision,
		type CellLocator,
		type Grid,
		type GridId,
		type GridRow,
		type HitId,
		type InstrumentHit,
		type SaveFileV1,
		type UiEvent
	} from '$lib';
	import { InstrumentManager } from '$lib/manager/instrument_manager.svelte';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import { InstrumentEvent } from '$lib/types/ui/instruments';
	import { defaultInstrumentConfig } from '$lib/audio/default_instruments';

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
	function toggleGridHit(locator: CellLocator) {
		let row = grids.get(locator.grid)?.rows[locator.row];
		if (row) {
			let currentValue = currentHit(locator);
			let newInstrumentHit: InstrumentHit | undefined = nextHitType(row, currentValue?.hitId);
			// console.log(`Tapped location ${JSON.stringify(locator)} ${currentValue} -> ${newInstrumentHit}`);
			updateCellHit(locator, newInstrumentHit);
			instrumentManager?.playHit(newInstrumentHit);
		} else {
			console.error(
				`Can't toggle grid cell hit as can't find the row. Locator: `,
				locator,
				', grids:',
				grids
			);
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

	function onEvent(event: UiEvent) {
		console.log('OnEvent', event.event, event);
		switch (event.event) {
			case GridEvent.TogglePlaying:
				onTogglePlaying(event.playing, event.gridId);
				break;
			case GridEvent.ToggleGridHit:
				toggleGridHit(event.locator);
				break;
			case GridEvent.RemoveGrid:
				grids.delete(event.gridId);
				break;
			case GridEvent.BpmChanged:
				updateGrid(event.gridId, (grid: Grid) => {
					grid.config.bpm = event.bpm;
				});
				break;
			case GridEvent.BarsChanged:
				updateGrid(event.gridId, (grid: Grid) => {
					grid.config.bars = event.bars;
					resizeGrid(grid);
					grid.gridCols = notationColumns(grid);
				});
				break;
			case GridEvent.GridSizeChanged:
				updateGrid(event.gridId, (grid: Grid) => {
					grid.config.beatsPerBar = event.beats_per_bar;
					grid.config.beatDivisions = event.beat_divisions;
					resizeGrid(grid);
					grid.gridCols = notationColumns(grid);
				});
				break;
			case InstrumentEvent.RemoveInstrument:
				instrumentManager.removeInstrument(event.instrumentId);
				syncInstruments();
				break;
			case InstrumentEvent.AddInstrument:
				instrumentManager.addInstrumentFromConfig(defaultInstrumentConfig);
				syncInstruments();
				break;
		}
	}

	function updateGrid(id: GridId, withGrid: (grid: Grid) => void) {
		let grid = grids.get(id);
		if (grid) {
			withGrid(grid);
		} else {
			console.error("Couldn't find grid to update with id ", id);
		}
	}

	function resizeGrid(grid: Grid) {
		// TODO Tidy this deeply nested fucktion up
		grid.rows.forEach((row) => {
			if (grid.config.bars < row.notation.bars.length) {
				row.notation.bars.length = grid.config.bars;
			} else {
				let newBars = Array.from({ length: grid.config.bars - row.notation.bars.length }, () =>
					defaultBar()
				);
				row.notation.bars.push(...newBars);
			}
			row.notation.bars.forEach((bar) => {
				let beatsPerBar = grid.config.beatsPerBar;
				if (beatsPerBar < bar.beats.length) {
					bar.beats.length = beatsPerBar;
				} else {
					let newBeats = Array.from({ length: beatsPerBar - bar.beats.length }, () =>
						defaultBeat()
					);
					bar.beats.push(...newBeats);
				}
				bar.beats.forEach((beat) => {
					let beatNoteFraction = grid.config.beatDivisions;
					if (beatNoteFraction < beat.divisions.length) {
						beat.divisions.length = beatNoteFraction;
					} else {
						let newDivisions = Array.from(
							{ length: beatNoteFraction - beat.divisions.length },
							() => defaultBeatDivision()
						);
						beat.divisions.push(...newDivisions);
					}
				});
			});
		});
	}

	// When instruments are added / removed, we need to remove the rows for the
	// deleted ones, and add rows for the new ones
	function syncInstruments() {
		grids.forEach((grid) => {
			// First remove all rows where the instrument is removed
			let filteredRows = grid.rows.filter((row) => {
				return instrumentManager.instruments.has(row.instrument.id);
			});
			// console.log("Filtered rows -", filteredRows)
			// Now add any new instruments
			if (filteredRows.length < instrumentManager.instruments.size) {
				let instrument = [...instrumentManager.instruments.values()].pop();
				if (instrument) {
					filteredRows.push(defaultGridRow(instrument));
				}
			}
			// console.log("Filtered rows +", filteredRows)
			grid.rows = filteredRows;
		});
	}

	// Returns a count of the number of columns in the grid
	// Used to decide when to resize the grid
	function notationColumns(grid: Grid): number {
		if (grid.rows.length == 0) return 0;
		let notation = grid.rows[0].notation;
		let bars = notation.bars;
		let beats = bars[0].beats;
		let beatDivisions = beats[0].divisions;
		return bars.length * (beats.length * beatDivisions.length);
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
		<Grids {instrumentManager} {grids} {currentColumn} {onEvent} />

		<div class="flex">
			<button onclick={addGrid} class="btn btn-outline btn-xs m-2 ml-auto print:hidden">
				Add Grid
			</button>
		</div>

		<div class="print:hidden">
			<Instruments {instrumentManager} {onEvent} />
		</div>
	{/if}
</div>
