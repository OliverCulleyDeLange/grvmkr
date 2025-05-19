<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		onClick,
		classes = "",
		disabled = false,
		children
	}: {
        classes?: string;
		disabled?: boolean;
		onClick: () => void;
		children: Snippet
	} = $props();
</script>

<button
	onclick={onClick}
	class={`btn btn-outline btn-xs m-2 disabled:cursor-not-allowed bg-white dark:bg-[#1D232A] ${classes}`}
	disabled={disabled}
>
	{@render children()}
</button>
