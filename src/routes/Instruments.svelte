<script lang="ts">
	import type { InstrumentManager } from "$lib/instrument_manager.svelte";

	let { instrumentManager }: {  instrumentManager: InstrumentManager} = $props();
</script>

<h1 class="text-xl">Instruments</h1>
{#each [...instrumentManager.instruments] as [instrumentId, instrument]}
	<input
		value={instrument.name}
		oninput={(e) => instrumentManager.onChangeName(e.target.value, instrumentId)}
		type="text"
		class="block rounded-lg border border-gray-300 bg-gray-300 p-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500"
	/>
	{#each [...instrument.hitTypes] as [hitId, hit]}
		<ul class="text-sm text-gray-600">
			<li class="flex-right flex p-1">
				<input
					value={hit.key}
					oninput={(e) => instrumentManager.onChangeHitKey(e.target.value, instrumentId, hitId)}
					type="text"
					class="block w-8 rounded-lg border border-gray-300 bg-gray-300 p-1 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500"
				/>
				➜
				<input
					value={hit.description}
					oninput={(e) => instrumentManager.onChangeHitDescription(e.target.value, instrumentId, hitId)}
					type="text"
					class="block w-24 rounded-lg border border-gray-300 bg-gray-300 p-1 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500"
				/>
				{hit.audioPath}
			</li>
		</ul>
	{/each}
{/each}
