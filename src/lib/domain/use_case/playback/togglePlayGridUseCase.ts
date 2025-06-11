import type {
	GridId,
	Grid,
	GridRepositoryI,
	InstrumentRepositoryI,
	PlaybackControllerI
} from '$lib';

// Loops a single grid
export async function togglePlayGridUseCase(
	gridId: GridId,
	gridRepo: GridRepositoryI,
	instrumentRepo: InstrumentRepositoryI,
	player: PlaybackControllerI
) {
	await instrumentRepo.ensureInstrumentsInitialised();
	const gridToPlay = gridRepo.getGrid(gridId);
	if (gridToPlay) {
		player.togglePlayback(gridToPlay, 0, (grid: Grid) => {
			// Nothing to do anymore
		});
	}
}
