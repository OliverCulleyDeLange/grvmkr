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
	class={`btn btn-outline btn-xs m-2 bg-white hover:text-gray-100 disabled:cursor-not-allowed dark:bg-[#1D232A] pointer-events-auto ${classes}`}
	{disabled}
>
	{@render children()}
</button>
