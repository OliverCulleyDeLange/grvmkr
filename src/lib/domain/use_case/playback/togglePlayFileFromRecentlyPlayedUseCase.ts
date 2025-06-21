import type { GridId, GridRepositoryI, InstrumentRepositoryI, PlaybackControllerI } from '$lib';

// Space key toggles playing whole file from the most recently played grid.
export async function togglePlayFileFromRecentlyPlayedUseCase(
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI,
	screenWidth?: number
) {
	const recentlyPlayed = player.mostRecentlyPlayedGrid();
	if (recentlyPlayed) {
		return await togglePlayFileFromSpecificGridUseCase(
			recentlyPlayed.id,
			gridRepo,
			instrumentRepo,
			player,
			screenWidth
		);
	} else {
		// Find first grid and play it
		const firstGrid = gridRepo.getFirstGrid();
		if (firstGrid) {
			return await togglePlayFileFromSpecificGridUseCase(
				firstGrid.id,
				gridRepo,
				instrumentRepo,
				player,
				screenWidth
			);
		}
	}
}

async function togglePlayFileFromSpecificGridUseCase(
	gridId: GridId,
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI,
	screenWidth?: number
) {
	await instrumentRepo.ensureInstrumentsInitialised();
	const gridsToPlay = gridRepo.getGridsFrom(gridId);
	await player.togglePlayGridsInSequence(
		gridsToPlay,
		(gridId, sectionIndex) => {
			gridRepo.scrollToGridSection(gridId, sectionIndex);
		},
		screenWidth
	);
}
