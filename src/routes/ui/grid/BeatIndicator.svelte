<script lang="ts">
	import { type BeatIndicatorUi } from '$lib';

	let {
		indicator
	}: {
		indicator: BeatIndicatorUi;
	} = $props();
</script>

<div
	class="flex h-6 items-center justify-center print:border print:border-gray-400"
	class:bg-green-300={indicator.playing}
	class:bg-gray-100={!indicator.playing && !indicator.isBeat && !indicator.isFirstBeatOfBar}
	class:bg-gray-300={!indicator.playing && indicator.isBeat}
	class:bg-gray-400={!indicator.playing && indicator.isFirstBeatOfBar}
	class:text-gray-800={!indicator.playing && indicator.isFirstBeatOfBar}
	class:text-gray-600={!indicator.playing && indicator.isBeat}
>
	{indicator.text}
</div>
