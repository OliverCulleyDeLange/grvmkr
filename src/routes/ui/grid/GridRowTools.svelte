<script lang="ts">
	import { GridEvent, type GridRowUi, type OnUiEvent } from '$lib';
	import VolumeControls from './VolumeControls.svelte';

	let {
		row,
		onEvent
	}: {
		row: GridRowUi;
		onEvent: OnUiEvent;
	} = $props();
</script>

<!-- The first cell in the grid row - containing instrument name and volume controls -->
<div class={'select-none px-2 text-xs print:text-lg'}>
	<div>{row.instrumentName}</div>
	<div class="print:hidden flex gap-2">
		<VolumeControls
			model={row.volume}
			onMute={() =>
				onEvent({
					event: GridEvent.MuteInstrument,
					instrumentId: row.instrumentId
				})}
			onSolo={() =>
				onEvent({
					event: GridEvent.SoloInstrument,
					instrumentId: row.instrumentId
				})}
			onChange={(volume, delta) =>
				onEvent({
					event: GridEvent.VolumeChanged,
					instrumentId: row.instrumentId,
					volume: volume,
					delta: delta
				})}
		/>
	</div>
</div>
