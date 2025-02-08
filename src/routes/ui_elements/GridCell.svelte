<script lang="ts">
	let { text, isBeat, isFirstBeatOfBar, onTap } = $props();
</script>

<button
	onclick={onTap}
	class="flex h-8 items-center justify-center font-bold text-gray-800 print:border print:border-gray-400"
	class:bg-gray-100={!isBeat && !isFirstBeatOfBar}
	class:bg-gray-300={isBeat && !isFirstBeatOfBar}
	class:bg-gray-400={isFirstBeatOfBar}
	class:no-print-adjust={isBeat}
>
	{text}
</button>

<style>
	.no-print-adjust {
		-webkit-print-color-adjust: exact;
        print-color-adjust: exact;
	}
</style>
