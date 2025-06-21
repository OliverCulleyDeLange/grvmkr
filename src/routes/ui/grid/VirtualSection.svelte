<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let {
		estimatedHeight = 1,
		id,
		index,
		children
	}: {
		estimatedHeight?: number;
		id?: string;
		index: number;
		children: Snippet;
	} = $props();

	let containerElement: HTMLDivElement;
	let isVisible = $state(false);
	let isMeasuring = $state(true);
	let hasMeasured = $state(false);
	let gridSectionData: Array<{ id: string; height: number }> = $state([]);
	let gridConfigData: { height: number } | null = $state(null);
	let debug = $state(false);

	onMount(() => {
		if (typeof window === 'undefined') return;

		// Debug keyboard shortcut for toggling virtual sections
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey && event.key === 'd') {
				event.preventDefault();
				debug = !debug;
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		// Set up intersection observer for virtualization
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => (isVisible = entry.isIntersecting));
			},
			{
				root: null,
				rootMargin: '50px 0px', // Start loading 50px before it comes into view
				threshold: 0
			}
		);

		// Measure ALL content immediately on page load (force visible temporarily)
		const measureAndExtractSections = () => {
			if (containerElement) {
				// Temporarily force visible to measure content
				const wasVisible = isVisible;
				isVisible = true;

				requestAnimationFrame(() => {
					// Measure the total height
					if (containerElement.scrollHeight > 0) {
						// Find the grid config bar (sticky header)
						const gridConfigElement = containerElement.querySelector('[data-testid^="gridtools-"]');
						if (gridConfigElement) {
							const configRect = gridConfigElement.getBoundingClientRect();
							gridConfigData = {
								height: configRect.height
							};
						}

						// Find all grid sections within this virtual section
						const gridSectionElements = containerElement.querySelectorAll('.grid-section');
						const sectionData: Array<{ id: string; height: number }> = [];

						gridSectionElements.forEach((element) => {
							const htmlElement = element as HTMLElement;
							const sectionId = htmlElement.id;
							// Check if this looks like a grid section ID (format: gridId-sectionIndex)
							if (sectionId && sectionId.includes('-') && sectionId.match(/.*-\d+$/)) {
								const rect = htmlElement.getBoundingClientRect();
								sectionData.push({
									id: sectionId,
									height: rect.height
								});
							}
						});

						gridSectionData = sectionData;
						hasMeasured = true;
						isMeasuring = false;

						// Restore original visibility state
						isVisible = wasVisible;
					}
				});
			}
		};

		if (containerElement) {
			observer.observe(containerElement);
		}

		// Measure immediately on page load
		measureAndExtractSections();

		// Also handle resize events to remeasure if needed
		const handleResize = () => measureAndExtractSections();

		window.addEventListener('resize', handleResize);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<div bind:this={containerElement} class="virtual-section" {id}>
	{#if isVisible && !debug}
		<!-- Render actual content when visible or debug mode is on -->
		{@render children()}
	{:else if (hasMeasured && gridSectionData.length > 0) || debug}
		<!-- Grid config bar placeholder (sticky header) 56px-->
		{#if gridConfigData}
			<div
				class="virtual-section-config-placeholder"
				style="height: {gridConfigData.height}px;"
			></div>
		{/if}

		<div class="flex flex-col gap-2">
			<!-- Grid section placeholders 736px -->
			{#each gridSectionData as section}
				<div
					id={section.id}
					class="virtual-section-grid-placeholder"
					style="height: {section.height}px;"
					data-section-id={section.id}
				></div>
			{/each}
		</div>
	{:else}
		<!-- Fallback placeholder when no grid sections found or not measured yet -->
		<div class="default-virtual-section-placeholder" style="height: {estimatedHeight}px;"></div>
	{/if}
</div>

<style>
	.virtual-section {
		position: relative;
	}

	.default-virtual-section-placeholder {
		background: black;
		opacity: 0.1;
	}

	.virtual-section-config-placeholder {
		background: orange;
		opacity: 0.1;
		width: 100%;
		margin-bottom: 8px;
	}

	.virtual-section-grid-placeholder {
		background: brown;
		opacity: 0.1;
		border: 1px solid white;
		width: 100%;
	}
</style>
