<script lang="ts">
	import type { HitId, InstrumentId, InstrumentsUi, OnUiEvent } from '$lib';
	import { InstrumentEvent } from '$lib';

	let {
		ui,
		onEvent
	}: {
		ui: InstrumentsUi;
		onEvent: OnUiEvent;
	} = $props();

	function handleFile(event: Event, instrumentId: InstrumentId, hitId: HitId) {
		const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			let file = fileInput.files[0];
			onEvent({ event: InstrumentEvent.ChangeSample, instrumentId, file, hitId });
		}
	}
</script>

<div class="w-full overflow-x-auto">
	<h1 class="text-xl">Instruments</h1>
	{#each ui.instruments as instrumentUi}
		<div id="instrument-config-container" class="mb-2">
			<div class="flex w-full gap-2 p-1">
				<div class="">{instrumentUi.gridIndex}</div>
				<input
					value={instrumentUi.name}
					oninput={(e: Event) => {
						const target = e.target as HTMLInputElement | null;
						if (target) {
							onEvent({
								event: InstrumentEvent.RenameInstrument,
								instrumentId: instrumentUi.id,
								newName: target.value
							});
						}
					}}
					type="text"
					class="input input-xs input-bordered w-24"
				/>
				<button
					class="btn btn-outline btn-xs"
					onclick={() =>
						onEvent({ event: InstrumentEvent.RemoveInstrument, instrumentId: instrumentUi.id })}
				>
					🗑️ Delete
				</button>
				<button
					class="btn btn-outline btn-xs"
					onclick={() => onEvent({ event: InstrumentEvent.MoveUp, instrumentId: instrumentUi.id })}
				>
					⬆️ Move Up
				</button>
				<button
					class="btn btn-outline btn-xs"
					onclick={() =>
						onEvent({ event: InstrumentEvent.MoveDown, instrumentId: instrumentUi.id })}
				>
					⬇️ Move Down
				</button>
				<button
					class="btn btn-outline btn-xs"
					onclick={() => onEvent({ event: InstrumentEvent.AddHit, instrumentId: instrumentUi.id })}
				>
					＋ Add Hit
				</button>
			</div>

			{#each [...instrumentUi.hitTypes] as hitUi}
				<ul class="ml-8 text-sm text-gray-600">
					<li class="flex-right flex gap-2 p-1">
						<input
							value={hitUi.key}
							oninput={(e: Event) => {
								const target = e.target as HTMLInputElement | null;
								if (target) {
									onEvent({
										event: InstrumentEvent.ChangeHitKey,
										instrumentId: instrumentUi.id,
										hitId: hitUi.id,
										newKey: target.value
									});
								}
							}}
							type="text"
							class="input input-xs input-bordered w-8"
						/>
						➜
						<input
							value={hitUi.description}
							oninput={(e: Event) => {
								const target = e.target as HTMLInputElement | null;
								if (target) {
									onEvent({
										event: InstrumentEvent.ChangeHitDescription,
										instrumentId: instrumentUi.id,
										hitId: hitUi.id,
										description: target.value
									});
								}
							}}
							type="text"
							class="input input-xs input-bordered w-24"
						/>

						<!-- Delete Button -->
						<button
							class="btn btn-outline btn-xs"
							onclick={() =>
								onEvent({
									event: InstrumentEvent.RemoveHit,
									instrumentId: instrumentUi.id,
									hitId: hitUi.id
								})}
						>
							🗑️ Delete
						</button>
						<!-- Play button -->
						{#if hitUi.audioFileName != ''}
							<button
								class="btn btn-outline btn-xs"
								onclick={() =>
									onEvent({
										event: InstrumentEvent.PlayHit,
										instrumentHit: {
											instrumentId: instrumentUi.id,
											hitId: hitUi.id
										}
									})}
							>
								▶︎ Play
							</button>
						{/if}

						<!-- This button is a proxy for the input below it to hide the un-needed file input UI -->
						<button
							class="btn btn-outline btn-xs text-center text-sm font-semibold"
							class:btn-warning={!hitUi.audioFileName}
							onclick={() => document.getElementById(`hidden-file-input-${hitUi.id}`)?.click()}
						>
							{#if hitUi.audioFileName != ''}
								{hitUi.audioFileName}
							{:else}
								Upload sample
							{/if}
						</button>
						<input
							id="hidden-file-input-{hitUi.id}"
							type="file"
							onchange={(e) => handleFile(e, instrumentUi.id, hitUi.id)}
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
