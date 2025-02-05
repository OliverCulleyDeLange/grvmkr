<script lang="ts">
	import { defaultInstruments, GridModel, mapSavedGridToGridModel, serialiseToJsonV1, 

	type SavedGridV1, type SaveFileV1 } from '$lib';
	import { InstrumentManager } from '$lib/manager/instrument_manager.svelte';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let instrumentManager: InstrumentManager = $state() as InstrumentManager;
	
	let grids: SvelteMap<number, GridModel> = new SvelteMap();
	let activeGrid: GridModel | undefined = $state();

	// Playing state
	let playing = $state(false);
	let nextCount: number = 0;

	onMount(() => {
		instrumentManager = new InstrumentManager(defaultInstruments);
		// Add initial grid, and set active
		grids.set(0, new GridModel(instrumentManager))
		activeGrid = grids.get(0)
	});

	function save() {
		let saveFile = serialiseToJsonV1([...grids.values()], [...instrumentManager.instruments.values()])
		const text = JSON.stringify(saveFile)
		console.log("Saved", text)
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
			let saveFile: SaveFileV1 = JSON.parse(await file.text())
			instrumentManager.replaceInstruments(saveFile.instruments)

			// console.log("Loaded instruments", instrumentManager.instruments)
			// TODO EXTRACT GRID LOGIC SOMEWHERE BETTER
			grids.clear()
			saveFile.grids.forEach((grid, index) => {
				let gridModel: GridModel = mapSavedGridToGridModel(grid, instrumentManager)
				grids.set(index, gridModel)
			})
			// console.log("Loaded grids", grids)
			// console.log("Loaded grids", grids.get(0)?.rows[0])
		}
	}
</script>

<div class="m-2 p-4">
	<div class="flex gap-8 print:hidden">
		<h1 class="text-3xl">GrvMkr</h1>
		<button class="btn btn-outline btn-sm" onclick={save}>Save</button>
		<button class="btn btn-outline btn-sm" onclick={() => document.getElementById('hidden-file-input-for-load')?.click()} >Load</button>
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
			{activeGrid}
			{nextCount}
			{playing}
		 />
		<div class="print:hidden">
			<Instruments {instrumentManager} />
		</div>
	{/if}
</div>
