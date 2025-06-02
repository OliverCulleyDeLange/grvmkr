import type { GridId, GridRepositoryI, InstrumentRepositoryI, PlaybackControllerI } from '$lib';

// Space key toggles playing whole file from the most recently played grid.
export async function togglePlayFileFromRecentlyPlayedUseCase(
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI
) {
	const gridsToPlay = gridRepo.getGridsFromMostRecentlyPlayedGrid();
	const mostRecentlyPlayedGrid = gridsToPlay[0];
	if (gridsToPlay && mostRecentlyPlayedGrid) {
		let playing = mostRecentlyPlayedGrid.playing;
		return await togglePlayFileFromSpecificGridUseCase(
			!playing,
			mostRecentlyPlayedGrid.id,
			gridRepo,
			instrumentRepo,
			player
		);
	} else {
		// Find first grid and play it
		const firstGrid = gridRepo.getFirstGrid();
		if (firstGrid) {
			return await togglePlayFileFromSpecificGridUseCase(
				!firstGrid.playing,
				firstGrid.id,
				gridRepo,
				instrumentRepo,
				player
			);
		}
	}
}

async function togglePlayFileFromSpecificGridUseCase(
	newPlaying: boolean,
	gridId: GridId,
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI
) {
	await gridRepo.updatePlaying(newPlaying, gridId);

	if (newPlaying) {
		await instrumentRepo.ensureInstrumentsInitialised();
		player.stop();
		const gridsToPlay = gridRepo.getGridsFromCurrentlyPlaying();
		player.playGridsInSequence(
			gridsToPlay,
			(grid) => {
				gridRepo.updatePlaying(true, grid.id);
				gridRepo.scrollToGrid(grid.id);
			},
			(grid) => {
				gridRepo.updatePlaying(false, grid.id);
			}
		);
	} else {
		player.stop();
	}
}
