<script lang="ts">
	let {
		columnsOccupied,
		text,
		isBeat,
		isFirstBeatOfBar,
		onTap,
		onRightTap
	}: {
		columnsOccupied: number;
		text: string;
		isFirstBeatOfBar: boolean;
		isBeat: boolean;
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
	class="right-click-area flex h-8 items-center justify-evenly font-bold text-gray-800 print:border print:border-gray-400"
	class:bg-gray-100={!isBeat && !isFirstBeatOfBar}
	class:bg-gray-300={isBeat && !isFirstBeatOfBar}
	class:bg-gray-400={isFirstBeatOfBar}
	class:no-print-adjust={isBeat}
	class:merged-cells-2={columnsOccupied == 2}
	class:merged-cells-3={columnsOccupied == 3}
	class:merged-cells-4={columnsOccupied == 4}
>
	{#each text.split('') as char}
		<div>{char}</div>
	{/each}
</button>

<style>
	.no-print-adjust {
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}

	.merged-cells-2 {
		display: grid;
		grid-column: span 2;
		grid-template-columns: subgrid;
	}
	.merged-cells-3 {
		display: grid;
		grid-column: span 3;
		grid-template-columns: subgrid;
	}
	.merged-cells-4 {
		display: grid;
		grid-column: span 4;
		grid-template-columns: subgrid;
	}
</style>
