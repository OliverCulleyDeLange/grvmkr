<script lang="ts">
	import { defaultInstruments } from '$lib/default';
	import { InstrumentManager } from '$lib/instrument_manager.svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';

	let instrumentManager = new InstrumentManager(defaultInstruments);

</script>

<div class="m-2 p-4">
	<h1 class="text-3xl">GrvMkr</h1>

	<Grids {instrumentManager}/>
	<Instruments instrumentManager={instrumentManager} />

</div>
