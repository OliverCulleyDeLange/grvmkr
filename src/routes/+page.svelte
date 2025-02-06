<script lang="ts">
	import { createAppStateStore, GridEvent, UiEvent } from '$lib';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import Toolbar from './Toolbar.svelte';

	let appStateStore = createAppStateStore();
	let onEvent = appStateStore.onEvent;

	onMount(() => onEvent({ event: UiEvent.Mounted }));
</script>

<div class="m-2 p-4">
	<Toolbar {onEvent} errors={[...appStateStore.errors.values()]} />
	{#if appStateStore.instrumentManager != undefined}
		<Grids
			instrumentManager={appStateStore.instrumentManager}
			grids={appStateStore.grids}
			{onEvent}
		/>

		<div class="flex">
			<button
				onclick={() => onEvent({ event: GridEvent.AddGrid })}
				class="btn btn-outline btn-xs m-2 ml-auto print:hidden"
			>
				Add Grid
			</button>
		</div>

		<div class="print:hidden">
			<Instruments instrumentManager={appStateStore.instrumentManager} {onEvent} />
		</div>
	{/if}
</div>
