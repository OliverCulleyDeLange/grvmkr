<script lang="ts">
	import { clamp } from '$lib/util/math';

	export let volumeString: String = '';
	export let volume: number = 0.5; // from 0 to 1
	export let onChange: (volume: number | undefined, delta: number | undefined) => void;

	const width = 60;
	const height = 16;

	let isDragging = false;
	let startX = 0;
	let startY = 0;
	let startVolume = volume;

	function handlePointerDownForSlider(event: PointerEvent) {
		const rect = (event.target as SVGElement).getBoundingClientRect();
		startX = event.clientX;
		startY = event.clientY;
		startVolume = volume;
		isDragging = true;

		updateVolumeFromDelta(0, 0); // init
		window.addEventListener('pointermove', handlePointerMoveForSlider);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerDownForText(event: PointerEvent) {
		startX = event.clientX;
		window.addEventListener('pointermove', handlePointerMoveForText);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMoveForSlider(event: PointerEvent) {
		if (!isDragging) return;
		const dx = event.clientX - startX;
		const dy = startY - event.clientY; // Y increases downward, invert so up = +gain

		updateVolumeFromDelta(dx, dy);
	}

	function handlePointerMoveForText(event: PointerEvent) {
		onChange(undefined, event.clientX - startX);
		startX = event.clientX;
	}

	function handlePointerUp() {
		isDragging = false;
		window.removeEventListener('pointermove', handlePointerMoveForSlider);
		window.removeEventListener('pointermove', handlePointerMoveForText);
		window.removeEventListener('pointerup', handlePointerUp);
	}

	function updateVolumeFromDelta(dx: number, dy: number) {
		const deltaX = dx / width;
		const deltaY = dy / height;
		const delta = (deltaX + deltaY) / 2;
		volume = clamp(startVolume + delta, 0, 1);
		onChange(volume, undefined);
	}

	$: fillWidth = width * volume;
	$: fillHeight = height * volume;
</script>

<svg
	{width}
	{height}
	viewBox={`0 0 ${width} ${height}`}
	onpointerdown={handlePointerDownForSlider}
	style="touch-action: none; cursor: ew-resize;"
>
	<!-- Triangle outline -->
	<polygon points={`${width},${height} 0,${height} ${width},0`} fill="none" stroke="black" />

	<!-- Shaded volume triangle -->
	<polygon
		points={`${fillWidth},${height} 0,${height} ${fillWidth},${height - fillHeight}`}
		fill="green"
		opacity="0.6"
	/>
</svg>

<div
	class="cursor-ew-resize text-xs text-gray-500"
	onpointerdown={(e) => handlePointerDownForText(e)}
>
	{volumeString}
</div>
