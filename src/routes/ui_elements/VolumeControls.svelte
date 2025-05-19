<script lang="ts">
	import type { VolumeControlUi } from '$lib';
	import { clamp } from '$lib/util/math';

	export let model: VolumeControlUi;
	export let onChange: (volume: number | undefined, delta: number | undefined) => void;
	export let onMute: () => void;
	export let onSolo: () => void;

	const volumeSliderWidth = 30;
	const volumeSliderHeight = 16;

	let isDragging = false;
	let startX = 0;
	let startY = 0;
	let startVolume = model.volume;

	function handlePointerDownForSlider(event: PointerEvent) {
		const rect = (event.target as SVGElement).getBoundingClientRect();
		startX = event.clientX;
		startY = event.clientY;
		startVolume = model.volume;
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
		const deltaX = dx / volumeSliderWidth;
		const deltaY = dy / volumeSliderHeight;
		const delta = (deltaX + deltaY) / 2;
		const volume = clamp(startVolume + delta, 0, 1);
		onChange(volume, undefined);
	}

	$: fillWidth = volumeSliderWidth * model.volume;
	$: fillHeight = volumeSliderHeight * model.volume;
</script>

<div class="print:hidden flex gap-2">
	<button class="text-xs" class:text-blue-500={model.muted} onclick={() => onMute()}>M</button>
	<button class="text-xs" class:text-orange-400={model.soloed} onclick={() => onSolo()}>S</button>

	<svg
		width={volumeSliderWidth}
		height={volumeSliderHeight}
		viewBox={`0 0 ${volumeSliderWidth} ${volumeSliderHeight}`}
		onpointerdown={handlePointerDownForSlider}
		style="touch-action: none; cursor: ew-resize;"
	>
		<!-- Triangle outline -->
		<polygon
			points={`${volumeSliderWidth},${volumeSliderHeight} 0,${volumeSliderHeight} ${volumeSliderWidth},0`}
			fill="none"
			stroke="black"
		/>

		<!-- Shaded volume triangle -->
		<polygon
			points={`${fillWidth},${volumeSliderHeight} 0,${volumeSliderHeight} ${fillWidth},${volumeSliderHeight - fillHeight}`}
			fill="green"
			opacity="0.6"
		/>
	</svg>

	<div
		class="cursor-ew-resize text-xs text-gray-500"
		onpointerdown={(e) => handlePointerDownForText(e)}
	>
		{model.volumeString}
	</div>
</div>
