<script lang="ts">
	import type { HitId, InstrumentId, InstrumentManager, OnUiEvent } from '$lib';
	import { defaultHitConfig } from '$lib/audio/default_instruments';
	import { InstrumentEvent } from '$lib/types/ui/instruments';

	// TODO Remove - replace with passed down instrument UI model
	let {
		instrumentManager,
		onEvent
	}: {
		instrumentManager: InstrumentManager;
		onEvent: OnUiEvent;
	} = $props();

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
	<div class="flex-right flex gap-2">
		<input
			value={instrument.name}
			oninput={(e) => instrumentManager.onChangeName(e.target.value, instrumentId)}
			type="text"
			class="input input-xs input-bordered"
		/>
		<button
			class="btn btn-outline btn-xs"
			onclick={() => onEvent({ event: InstrumentEvent.RemoveInstrument, instrumentId })}
		>
			X
		</button>
		<button
			class="btn btn-outline btn-xs"
			onclick={() => instrumentManager.addHit(defaultHitConfig, instrumentId)}
		>
			Add Hit
		</button>
	</div>

	{#each [...instrument.hitTypes] as [hitId, hit]}
		<ul class="text-sm text-gray-600">
			<li class="flex-right flex gap-2 p-1">
				<input
					value={hit.key}
					oninput={(e) => instrumentManager.onChangeHitKey(e.target.value, instrumentId, hitId)}
					type="text"
					class="input input-xs input-bordered w-8"
				/>
				➜
				<input
					value={hit.description}
					oninput={(e) =>
						instrumentManager.onChangeHitDescription(e.target.value, instrumentId, hitId)}
					type="text"
					class="input input-xs input-bordered"
				/>

				<!-- This button is a proxy for the input below it to hide the un-needed file input UI -->
				<button
					class="btn btn-outline btn-xs text-center text-sm font-semibold"
					class:btn-warning={!hit.audioFileName}
					onclick={() => document.getElementById(`hidden-file-input-${hitId}`)?.click()}
				>
					{#if hit.audioFileName != ''}
						{hit.audioFileName}
					{:else}
						Upload sample
					{/if}
				</button>
				<input
					id="hidden-file-input-{hitId}"
					type="file"
					onchange={(e) => handleFile(e, instrumentId, hitId)}
					accept="audio/*"
					hidden
				/>

				<!-- Play button -->
				{#if hit.audioFileName != ''}
					<button
						class="btn btn-outline btn-xs"
						onclick={() => instrumentManager.play(instrumentId, hitId)}>▶︎</button
					>
				{/if}

				<!-- Delete Button -->
				<button
					class="btn btn-outline btn-xs"
					onclick={() => instrumentManager.removeHit(instrumentId, hitId)}
				>
					X
				</button>
			</li>
		</ul>
	{/each}
{/each}

<button
	class="btn btn-outline btn-xs"
	onclick={() => onEvent({ event: InstrumentEvent.AddInstrument })}
>
	Add Instrument
</button>
