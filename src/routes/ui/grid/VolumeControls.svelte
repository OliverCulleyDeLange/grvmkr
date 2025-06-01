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

	function handlePointerDownForVolume(event: PointerEvent) {
		const rect = (event.target as SVGElement).getBoundingClientRect();
		startX = event.clientX;
		startY = event.clientY;
		startVolume = model.volume;
		isDragging = true;

		updateVolumeFromDelta(0, 0); // init
		window.addEventListener('pointermove', handlePointerMoveForVolume);
		window.addEventListener('pointerup', handlePointerUpForVolume);
	}

	function handlePointerMoveForVolume(event: PointerEvent) {
		event.preventDefault();
		if (!isDragging) return;
		const dx = event.clientX - startX;
		const dy = startY - event.clientY; // Y increases downward, invert so up = +gain

		updateVolumeFromDelta(dx, dy);
	}

	function handlePointerUpForVolume() {
		isDragging = false;
		window.removeEventListener('pointermove', handlePointerMoveForVolume);
		window.removeEventListener('pointerup', handlePointerUpForVolume);
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

<div class="flex gap-2 print:hidden">
	<button class="text-xs" class:text-blue-500={model.muted} onclick={() => onMute()}>M</button>
	<button class="text-xs" class:text-orange-400={model.soloed} onclick={() => onSolo()}>S</button>

	<div
		class="flex cursor-ew-resize touch-none flex-row gap-2 text-xs text-gray-500"
		onpointerdown={(e) => handlePointerDownForVolume(e)}
	>
		<svg
			width={volumeSliderWidth}
			height={volumeSliderHeight}
			viewBox={`0 0 ${volumeSliderWidth} ${volumeSliderHeight}`}
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

		<div class="cursor-ew-resize text-xs text-gray-500">
			{model.volumeString}
		</div>
	</div>
</div>
