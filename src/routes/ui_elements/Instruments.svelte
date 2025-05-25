<script lang="ts">
	import type { HitId, InstrumentId, InstrumentStore, OnUiEvent } from '$lib';
	import { defaultHitType } from '$lib/audio/default_instruments';
	import { InstrumentEvent } from '$lib/types/ui/instruments';

	// TODO Remove - replace with passed down instrument UI model
	let {
		instrumentManager,
		onEvent
	}: {
		instrumentManager: InstrumentStore;
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

<div class="w-full overflow-x-auto">
	<h1 class="text-xl">Instruments</h1>
	{#each [...instrumentManager.instruments.values()].sort((a, b) => a.gridIndex - b.gridIndex) as instrument}
		<div id="instrument-config-container" class="mb-2">
			<div class="flex w-full gap-2 p-1">
				<div class="">{instrument.gridIndex}</div>
				<input
					value={instrument.name}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement | null;
						if (target) instrumentManager.onChangeName(target.value, instrument.id);
					}}
					type="text"
					class="input input-xs input-bordered w-24"
				/>
				<button
					class="btn btn-outline btn-xs"
					onclick={() =>
						onEvent({ event: InstrumentEvent.RemoveInstrument, instrumentId: instrument.id })}
				>
					X
				</button>
				<button
					class="btn btn-outline btn-xs"
					onclick={() => onEvent({ event: InstrumentEvent.MoveUp, instrumentId: instrument.id })}
				>
					⬆︎
				</button>
				<button
					class="btn btn-outline btn-xs"
					onclick={() => onEvent({ event: InstrumentEvent.MoveDown, instrumentId: instrument.id })}
				>
					⬇︎
				</button>
				<button
					class="btn btn-outline btn-xs"
					onclick={() => instrumentManager.addHit(defaultHitType, instrument.id)}
				>
					Add Hit
				</button>
			</div>

			{#each [...instrument.hitTypes] as [hitId, hit]}
				<ul class="text-sm text-gray-600">
					<li class="flex-right flex gap-2 p-1">
						<input
							value={hit.key}
							oninput={(e: Event) => {
								const target = e.target as HTMLInputElement | null;
								if (target) instrumentManager.onChangeHitKey(target.value, instrument.id, hitId);
							}}
							type="text"
							class="input input-xs input-bordered w-8"
						/>
						➜
						<input
							value={hit.description}
							oninput={(e: Event) => {
								const target = e.target as HTMLInputElement | null;
								if (target)
									instrumentManager.onChangeHitDescription(target.value, instrument.id, hitId);
							}}
							type="text"
							class="input input-xs input-bordered w-24"
						/>

						<!-- Delete Button -->
						<button
							class="btn btn-outline btn-xs"
							onclick={() => instrumentManager.removeHit(instrument.id, hitId)}
						>
							X
						</button>
						<!-- Play button -->
						{#if hit.audioFileName != ''}
							<button
								class="btn btn-outline btn-xs"
								onclick={() => instrumentManager.play(instrument.id, hitId)}>▶︎</button
							>
						{/if}

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
							onchange={(e) => handleFile(e, instrument.id, hitId)}
							accept="audio/*"
							hidden
						/>
					</li>
				</ul>
			{/each}
		</div>
	{/each}

	<button
		class="btn btn-outline btn-xs"
		onclick={() => onEvent({ event: InstrumentEvent.AddInstrument })}
	>
		Add Instrument
	</button>
</div>
