<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		onClick,
		classes = '',
		disabled = false,
		children
	}: {
		classes?: string;
		disabled?: boolean;
		onClick: () => void;
		children: Snippet;
	} = $props();
</script>

<button
	onclick={onClick}
	class={`btn btn-outline btn-xs m-2 ${classes}`}
	{disabled}
>
	{@render children()}
</button>
