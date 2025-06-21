import type { GridUis } from '$lib/ui/grid/GridUis';
import type { BeatIndicatorUi, GridConfig, GridId, GridSection } from '$lib';

export function mapBeatIndicatorUi(
	gridsUi: GridUis,
): Map<GridId, BeatIndicatorUi[][]> {
	const result = new Map<GridId, BeatIndicatorUi[][]>();
	for (const gridUi of gridsUi.grids) {

		const sectionIndicators: BeatIndicatorUi[][] = gridUi.notationSections.map((section) => {
			return beatIndicatorsForSection(section, gridUi.config);
		});

		result.set(gridUi.id, sectionIndicators);
	}
	return result;
}

// Split rows into sections for BeatIndicator UI, same as in grid_to_grid_ui but only for beat indicators
function beatIndicatorsForSection(
	section: GridSection,
	config: GridConfig,
) {
	return Array.from({ length: section.columns }, (_, i) => {
		let text = '';
		const index = section.minIndex + i;

		const divisionModulo = index % config.beatDivisions;
		const isBeat = divisionModulo == 0;
		const isFirstBeatOfBar = isBeat && index % (config.beatsPerBar * config.beatDivisions) == 0;
		const isAndBeatOfBar = divisionModulo == config.beatDivisions * 0.5;
		const isEBeatOfBar = divisionModulo == config.beatDivisions * 0.25;
		const isABeatOfBar = divisionModulo == config.beatDivisions * 0.75;
		if (isBeat) {
			text = `${((index / config.beatDivisions) % config.beatsPerBar) + 1}`;
		} else if (isAndBeatOfBar) {
			text = '&';
		} else if (isEBeatOfBar) {
			text = 'e';
		} else if (isABeatOfBar) {
			text = 'a';
		}
		const indicator: BeatIndicatorUi = { isFirstBeatOfBar, isBeat, text };
		return indicator;
	});
}
