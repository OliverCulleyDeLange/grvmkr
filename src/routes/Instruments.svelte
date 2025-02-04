<script lang="ts">
	import type { HitId, InstrumentId, InstrumentManager } from '$lib';
	import { defaultInstrumentConfig } from '$lib/audio/default_instruments';

	let { instrumentManager }: { instrumentManager: InstrumentManager } = $props();

	function handleFile(event: Event, instrumentId: InstrumentId, hitId: HitId) {
		const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			let file = fileInput.files[0];
			instrumentManager.onChangeSample(file, instrumentId, hitId);
		}
	}
</script>

<h1 class="text-xl">Instruments</h1>
{#each [...instrumentManager.instruments] as [instrumentId, instrument]}
	<input
		value={instrument.name}
		oninput={(e) => instrumentManager.onChangeName(e.target.value, instrumentId)}
		type="text"
		class="input input-bordered input-xs"
	/>
	{#each [...instrument.hitTypes] as [hitId, hit]}
		<ul class="text-sm text-gray-600">
			<li class="flex-right flex p-1 gap-2">
				<input
					value={hit.key}
					oninput={(e) => instrumentManager.onChangeHitKey(e.target.value, instrumentId, hitId)}
					type="text"
					class="input input-bordered input-xs w-8"
				/>
				➜
				<input
					value={hit.description}
					oninput={(e) =>
						instrumentManager.onChangeHitDescription(e.target.value, instrumentId, hitId)}
					type="text"
					class="input input-bordered input-xs"
				/>

				<!-- This button is a proxy for the input below it to hide the un-needed file input UI -->
				<button 
					class="btn btn-xs btn-outline text-center text-sm font-semibold"
					onclick={() => document.getElementById(`hidden-file-input-${hitId}`)?.click()}
				>
					{hit.audioFileName}
				</button>
				<input id="hidden-file-input-{hitId}" type="file" onchange={(e) => handleFile(e, instrumentId, hitId)} accept="audio/*" hidden/>
				
				<!-- Play button -->
				<button class="btn btn-xs btn-outline" onclick={() => instrumentManager.play(instrumentId, hitId)}>▶︎</button>
			</li>
		</ul>
	{/each}
{/each}

<button class="btn btn-xs btn-outline" onclick={() => instrumentManager.addInstrument(defaultInstrumentConfig)}>
	Add Instrument
</button>
