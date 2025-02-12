<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		onClick, classes = "",
		children
	}: {
        classes?: string;
		onClick: () => void;
		children: Snippet
	} = $props();
</script>

<button
	onclick={onClick}
	class={`btn btn-outline btn-xs m-2 ${classes}`}
>
	{@render children()}
</button>
