import type { GridRepositoryI, InstrumentRepositoryI, PlaybackControllerI } from '$lib';

// 'Play File' button in toolbar should play all grids, starting with the first grid
export async function togglePlayFileUseCase(
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI
) {
	const newPlaying = !player.isPlayingFile();
	if (newPlaying) {
		await instrumentRepo.ensureInstrumentsInitialised();
		player.stop();

		const gridsToPlay = Array.from(gridRepo.getGrids().values());
		await player.playGridsInSequence(
			gridsToPlay,
			(grid) => {
				gridRepo.updatePlaying(true, grid.id);
			},
			(grid) => {
				gridRepo.updatePlaying(false, grid.id);
			}
		);
	} else {
		player.stop();
		gridRepo.stopPlayingGrid();
	}
}
