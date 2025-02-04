<script lang="ts">
	let { text, darken, onTap } = $props();
</script>

<button
	onclick={onTap}
	class="flex h-8 items-center justify-center border border-gray-400 bg-gray-300 {darken
		? 'brightness-[0.8]'
		: ''}"
>
	{text}
</button>