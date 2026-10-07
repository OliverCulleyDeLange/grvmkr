<script lang="ts">
	import type { PlaybackControllerI } from '$lib';
	const { playbackStore } = $props<{ playbackStore: PlaybackControllerI }>();

	const metrics = playbackStore.debugMetrics;
	const deltaClass = $derived(Math.abs(metrics.delta - metrics.expected) > 3 ? 'text-red-400' : '');
</script>

<div
	class="fixed bottom-2 right-2 z-50 max-w-xs rounded bg-black bg-opacity-80 p-3 font-mono text-xs text-white shadow-lg"
>
	<div><b>Playback Debug</b></div>
	<div>Δ (ms): <span class={deltaClass}>{metrics.delta.toFixed(2)}</span></div>
	<div>Expected (ms): {metrics.expected}</div>
	<div>onBeat (ms): {metrics.onBeat}</div>
	<div>Grid: {metrics.position.gridName} ({metrics.position.gridId})</div>
	<div>Repetition: {metrics.position.repetition}</div>
	<div>Bar: {metrics.position.bar}</div>
	<div>Beat: {metrics.position.beat}</div>
	<div>Division: {metrics.position.beatDivision}</div>
	<div>Cell: {metrics.position.cell} / {metrics.position.gridCells}</div>
	<div>PlayingCell: {metrics.position.playingCell}</div>
</div>
