<script lang="ts">
	import { type BeatIndicatorUi } from '$lib';

	let {
		indicator,
		playing
	}: {
		indicator: BeatIndicatorUi;
		playing: Boolean;
	} = $props();
</script>

<div
	class="beat-indicator flex h-6 items-center justify-center print:border print:border-gray-400"
	class:bg-green-300={playing}
	class:bg-gray-100={!playing && !indicator.isBeat && !indicator.isFirstBeatOfBar}
	class:bg-gray-300={!playing && indicator.isBeat}
	class:bg-gray-400={!playing && indicator.isFirstBeatOfBar}
	class:text-gray-800={!playing && indicator.isFirstBeatOfBar}
	class:text-gray-600={!playing && indicator.isBeat}
>
	{indicator.text}
</div>

<style>
	.beat-indicator {
		will-change: background, color;
	}
</style>
