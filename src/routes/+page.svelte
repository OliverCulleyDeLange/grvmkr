<script lang="ts">
	import { AppStateStore, GridEvent, mapToolbarUi, UiEvent } from '$lib';
	import { onMount } from 'svelte';
	import Grids from './Grids.svelte';
	import Instruments from './Instruments.svelte';
	import Toolbar from './Toolbar.svelte';
	import type { AppEvent } from '$lib/types/event';

	let appStateStore: AppStateStore = new AppStateStore();
	let onEvent = (e: AppEvent) => appStateStore.onEvent(e);

	onMount(() => onEvent({ event: UiEvent.Mounted }));

	let toolbarUi = $derived(mapToolbarUi(appStateStore.file.name, appStateStore.errors))
</script>

<div class="m-2 p-4">
	<Toolbar {onEvent} {toolbarUi} />
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
