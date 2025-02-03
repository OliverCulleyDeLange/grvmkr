<script lang="ts">
	import { defaultInstruments } from '$lib';
	import { InstrumentManager } from '$lib/manager/instrument_manager.svelte';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';

	let instrumentManager: InstrumentManager;

	onMount(() => {
		instrumentManager = new InstrumentManager(defaultInstruments);
	});
</script>

<div class="m-2 p-4">
	<h1 class="text-3xl">GrvMkr</h1>
	{#if instrumentManager}
		<Grids {instrumentManager} />
		<Instruments {instrumentManager} />
	{/if}
</div>
