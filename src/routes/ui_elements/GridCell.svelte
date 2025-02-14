<script lang="ts">
	import type { GridCellUi } from '$lib';

	let {
		ui,
		onTap,
		onRightTap
	}: {
		ui: GridCellUi;
		onTap: (shiftKey: boolean) => void;
		onRightTap: (x: number, y: number) => void;
	} = $props();

	function handleClick(event: MouseEvent) {
		onTap(event.shiftKey);
	}

	function handleRightClick(event: Event & MouseEvent) {
		event.preventDefault();
		onRightTap(event.clientX, event.clientY);
	}

	let pressTimer: number;

	function startPress(event: Event & MouseEvent) {
		pressTimer = setTimeout(() => {
			onRightTap(event.clientX, event.clientY);
		}, 250);
	}
	function startTouch(event: Event & TouchEvent) {
		pressTimer = setTimeout(() => {
			const touch = event.touches[0];
			onRightTap(touch.clientX, touch.clientY);
		}, 250);
	}

	function cancelPress() {
		clearTimeout(pressTimer);
	}
</script>

<button
	onclick={handleClick}
	onmousedown={startPress}
	onmouseup={cancelPress}
	onmouseleave={cancelPress}
	ontouchstart={startTouch}
	ontouchend={cancelPress}
	oncontextmenu={handleRightClick}
	class="right-click-area relative flex h-8 flex-row flex-nowrap items-center justify-between font-bold
	text-gray-800 print:border print:border-gray-400"
	style="grid-column: span {ui.cellsOccupied}"
	class:bg-gray-100={!ui.isBeat && !ui.isFirstBeatOfBar}
	class:bg-gray-300={ui.isBeat && !ui.isFirstBeatOfBar}
	class:bg-gray-400={ui.isFirstBeatOfBar}
	class:no-print-adjust={ui.isBeat}
	class:border={ui.selected}
	class:border-green-500={ui.selected}
	class:border-2={ui.selected}
>
	{#each ui.content.split('') as char}
		<div style={`width: calc(1/${ui.cellsOccupied} * 100%)`}>{char}</div>
	{/each}
	<div id="spacer"></div>
	<div
		class="absolute left-px top-px text-[8px]"
		class:text-gray-500={ui.isFirstBeatOfBar}
		class:text-gray-400={!ui.isFirstBeatOfBar}
	>
		<!-- {ui.cellDescription} -->
	</div>
</button>

<style>
	.no-print-adjust {
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
</style>
