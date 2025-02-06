<script lang="ts">
	import {
		createAppStateStore,
		GridEvent
	} from '$lib';
	import { InstrumentManager } from '$lib/manager/instrument_manager.svelte';
	import { InstrumentEvent } from '$lib/types/ui/instruments';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import Toolbar from './Toolbar.svelte';

	let instrumentManager: InstrumentManager = $state(new InstrumentManager());
	let appStateStore = createAppStateStore(instrumentManager);
	let onEvent = appStateStore.onEvent;

	onMount(() => {
		instrumentManager.initialise().then(() => {
			onEvent({event: InstrumentEvent.InstrumentsInitialised})
		});
	});
</script>

<div class="m-2 p-4">
	<Toolbar {onEvent} errors={[...appStateStore.errors.values()]}/>
	{#if instrumentManager != undefined}
		<Grids {instrumentManager} grids={appStateStore.grids} {onEvent} />

		<div class="flex">
			<button
				onclick={() => onEvent({ event: GridEvent.AddGrid })}
				class="btn btn-outline btn-xs m-2 ml-auto print:hidden"
			>
				Add Grid
			</button>
		</div>

		<div class="print:hidden">
			<Instruments {instrumentManager} {onEvent} />
		</div>
	{/if}
</div>
