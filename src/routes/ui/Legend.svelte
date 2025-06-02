<script lang="ts">
	import type { InstrumentStore, LegendInstrument } from '$lib';
	import type { LegendUi } from '$lib';

	let {
		instrumentManager
	}: {
		instrumentManager: InstrumentStore;
	} = $props();

	let ui: LegendUi = $derived.by(() => {
		let instruments: LegendInstrument[] = [...instrumentManager.getInstruments().values()]
			.map((instrument) => {
				let hits: string[] = Array.from(instrument.hitTypes.values())
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

<article class="my-2 hidden flex-wrap gap-x-8 print:flex">
	{#each ui.instruments as instrument}
		<div class="flex items-baseline gap-x-1">
			<div class="text-md font-bold">{instrument.name}</div>
			<div class="text-md">: {instrument.hits}</div>
		</div>
	{/each}
</article>
