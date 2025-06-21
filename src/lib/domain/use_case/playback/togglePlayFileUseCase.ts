import type { GridRepositoryI, InstrumentRepositoryI, PlaybackControllerI } from '$lib';

// 'Play File' button in toolbar should play all grids, starting with the first grid
export async function togglePlayFileUseCase(
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI,
	screenWidth?: number
) {
	await instrumentRepo.ensureInstrumentsInitialised();

	const gridsToPlay = Array.from(gridRepo.getGrids().values());
	await player.togglePlayGridsInSequence(
		gridsToPlay,
		(gridId, sectionIndex) => {
			gridRepo.scrollToGridSection(gridId, sectionIndex);
		},
		screenWidth
	);
}
