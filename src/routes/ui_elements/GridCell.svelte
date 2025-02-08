<script lang="ts">
	let { text, isBeat, isFirstBeatOfBar, onTap } = $props();
</script>

<button
	onclick={onTap}
	class="flex h-8 items-center justify-center font-bold text-gray-800"
	class:bg-gray-100={!isBeat && !isFirstBeatOfBar}
	class:bg-gray-300={isBeat && !isFirstBeatOfBar}
	class:bg-gray-400={isFirstBeatOfBar}
>
	{text}
</button>
