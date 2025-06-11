import type { GridId, GridRepositoryI, InstrumentRepositoryI, PlaybackControllerI } from '$lib';

// Space key toggles playing whole file from the most recently played grid.
export async function togglePlayFileFromRecentlyPlayedUseCase(
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI
) {
	const recentlyPlayed = player.mostRecentlyPlayedGrid();
	if (recentlyPlayed) {
		return await togglePlayFileFromSpecificGridUseCase(
			recentlyPlayed.id,
			gridRepo,
			instrumentRepo,
			player
		);
	} else {
		// Find first grid and play it
		const firstGrid = gridRepo.getFirstGrid();
		if (firstGrid) {
			return await togglePlayFileFromSpecificGridUseCase(
				firstGrid.id,
				gridRepo,
				instrumentRepo,
				player
			);
		}
	}
}

async function togglePlayFileFromSpecificGridUseCase(
	gridId: GridId,
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI
) {
	await instrumentRepo.ensureInstrumentsInitialised();
	const gridsToPlay = gridRepo.getGridsFrom(gridId);
	player.togglePlayGridsInSequence(
		gridsToPlay,
		(grid) => {
			gridRepo.scrollToGrid(grid.id);
			// todo scroll to grid sections
		},
		(grid) => {
			//noop
		}
	);
}
