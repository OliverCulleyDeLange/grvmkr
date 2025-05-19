<script lang="ts">
	import { base } from '$app/paths';
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="manifest" href={`${base}/manifest.json`} />
</svelte:head>

{@render children()}
