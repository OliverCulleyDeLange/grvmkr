<script lang="ts">
	import type { GridCellUi } from '$lib';

	let {
		ui,
		onTap,
		onRightTap
	}: {
		ui: GridCellUi;
		onTap: () => void;
		onRightTap: (x: number, y: number) => void;
	} = $props();

	function handleRightClick(event: Event & MouseEvent) {
		event.preventDefault();
		onRightTap(event.pageX, event.pageY);
	}
</script>

<button
	onclick={onTap}
	oncontextmenu={handleRightClick}
	class="right-click-area relative flex h-8 flex-row flex-nowrap items-center justify-evenly font-bold text-gray-800 print:border print:border-gray-400"
	style="grid-column: span {ui.cellsOccupied}"
	class:bg-gray-100={!ui.isBeat && !ui.isFirstBeatOfBar}
	class:bg-gray-300={ui.isBeat && !ui.isFirstBeatOfBar}
	class:bg-gray-400={ui.isFirstBeatOfBar}
	class:no-print-adjust={ui.isBeat}
>
	{#each ui.content.split('') as char}
		<div>{char}</div>
	{/each}
	<div
		class="absolute left-px top-px text-[8px]"
		class:text-gray-500={ui.isFirstBeatOfBar}
		class:text-gray-400={!ui.isFirstBeatOfBar}
	>
		{ui.cellDescription}
	</div>
</button>

<style>
	.no-print-adjust {
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
</style>
