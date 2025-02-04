<script lang="ts">
	import { defaultInstruments } from '$lib';
	import { InstrumentManager } from '$lib/manager/instrument_manager.svelte';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import Legend from './Legend.svelte';

	let instrumentManager: InstrumentManager;

	onMount(() => {
		instrumentManager = new InstrumentManager(defaultInstruments);
	});
</script>

<div class="m-2 p-4">
	<div class="flex gap-8">
		<h1 class="text-3xl print:hidden">GrvMkr</h1>
		<button class="btn btn-sm btn-outline" onclick={() => window.print()}>Print / Save PDF</button>
	</div>
	{#if instrumentManager}
		<Grids {instrumentManager} />
		<div class="print:hidden">
			<Instruments {instrumentManager} />
		</div>
	{/if}
</div>
