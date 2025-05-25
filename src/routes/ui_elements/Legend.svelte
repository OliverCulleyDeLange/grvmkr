<script lang="ts">
	import type { InstrumentStore, LegendInstrument } from '$lib';
	import type { LegendUi } from '$lib';

	let {
		instrumentManager
	}: {
		instrumentManager: InstrumentStore;
	} = $props();

	let ui: LegendUi = $derived.by(() => {
		let instruments: LegendInstrument[] = [...instrumentManager.instruments.values()]
			.map((instrument) => {
				let hits: string[] = [...instrument.hitTypes.values()]
					.map((hit) => (hit.description ? ` ${hit.key}: ${hit.description}` : null))
					.filter((i) => i != null);
				let legendInstrument: LegendInstrument = {
					name: instrument.name,
					hits: hits
				};
				return hits.length > 0 ? legendInstrument : null;
			})
			.filter((i) => i != null);
		let ui: LegendUi = { instruments };
		return ui;
	});
</script>

<article class="flex flex-wrap gap-x-8 my-2 hidden print:block">
	{#each ui.instruments as instrument}
    <div class="flex flex-nowrap items-baseline">
        <div class="text-md font-bold">{instrument.name}</div><div class="text-md">: {instrument.hits}</div>
    </div>
	{/each}
</article>
