<script lang="ts">
	import type { InstrumentManager, LegendInstrument } from '$lib';
	import type { LegendUi } from '$lib';

	let {
		instrumentManager
	}: {
		instrumentManager: InstrumentManager;
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

<article class="flex gap-8">
	{#each ui.instruments as instrument}
    <div class="flex items-baseline">
        <div class="text-md font-bold">{instrument.name}</div><div class="text-md">: {instrument.hits}</div>
    </div>
	{/each}
</article>
