<script lang="ts">
	import type { GridCellUi } from '$lib';

	let {
		ui,
		selected,
		onTap,
		onpointerdown,
		onpointermove
	}: {
		ui: GridCellUi;
		selected: boolean;
		onTap: (shiftKey: boolean) => void;
		onpointerdown: (e: PointerEvent) => void;
		onpointermove: () => void;
	} = $props();

	function handleClick(event: MouseEvent) {
		onTap(event.shiftKey);
	}
</script>

<button
	onclick={handleClick}
	onpointerdown={(event: PointerEvent) => {
		event.preventDefault();
		(event.currentTarget as HTMLElement)?.releasePointerCapture(event.pointerId);
		onpointerdown(event);
	}}
	{onpointermove}
	class="right-click-area relative flex h-8 flex-row flex-nowrap items-center justify-between font-bold
	text-gray-800 print:border print:border-gray-400"
	style="grid-column: span {ui.cellsOccupied};"
	class:bg-gray-100={!ui.isBeat && !ui.isFirstBeatOfBar}
	class:bg-gray-300={ui.isBeat && !ui.isFirstBeatOfBar}
	class:bg-gray-400={ui.isFirstBeatOfBar}
	class:no-print-adjust={ui.isBeat}
	class:outline={selected}
	class:outline-green-500={selected}
	class:outline-2={selected}
>
	{#if ui.addColorTint}
		<div class="pointer-events-none absolute inset-0 bg-yellow-300 opacity-10 print:hidden"></div>
	{/if}

	{#each ui.content.split('') as char}
		<div class="pointer-events-none" style={`width: calc(1/${ui.cellsOccupied} * 100%)`}>
			{char}
		</div>
	{/each}
	<div id="spacer"></div>
	<!-- {#if typeof window !== 'undefined' && window.location.hostname === 'localhost'}
		<div
			class="absolute left-px top-px text-[8px]"
			class:text-gray-500={ui.isFirstBeatOfBar}
			class:text-gray-400={!ui.isFirstBeatOfBar}
		>
			{ui.locator.row} {ui.locator.cell}
		</div>
	{/if} -->
</button>

<style>
	.no-print-adjust {
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
</style>
