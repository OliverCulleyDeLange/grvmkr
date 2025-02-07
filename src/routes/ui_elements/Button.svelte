<script lang="ts">
	let {
		onClick, classes, text
	}: {
        text: string;
        classes: string;
		onClick: () => void;
	} = $props();
</script>

<button
	onclick={onClick}
	class={`btn btn-outline btn-xs m-2 ml-auto ${classes}`}
>
	{text}
</button>
