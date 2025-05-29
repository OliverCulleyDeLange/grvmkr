import type { GridId, InstrumentRepositoryI } from "$lib";
import type { GridRepositoryI } from "../interface/GridRepositoryI";
import type { PlaybackControllerI } from "../interface/PlaybackControllerI";


// Space key toggles playing the most recently played grid.
export async function togglePlayRecentlyPlayedUseCase(
    gridRepo: GridRepositoryI,
    instrumentRepo: InstrumentRepositoryI,
    player: PlaybackControllerI,
) {
    const gridsToPlay = gridRepo.getGridsFromMostRecentlyPlayedGrid();
    const mostRecentlyPlayedGrid = gridsToPlay[0]
    if (gridsToPlay && mostRecentlyPlayedGrid) {
        let playing = mostRecentlyPlayedGrid.playing
        return await togglePlaySpecificGridUseCase(!playing, mostRecentlyPlayedGrid.id, gridRepo, instrumentRepo, player)
    } else {
        // Find first grid and play it
        const firstGrid = gridRepo.getFirstGrid()
        if (firstGrid) {
            return await togglePlaySpecificGridUseCase(!firstGrid.playing, firstGrid.id, gridRepo, instrumentRepo, player)
        }
    }
}

// Play button should play grids, starting with the specified grid
export async function togglePlaySpecificGridUseCase(
    newPlaying: boolean,
    gridId: GridId,
    gridRepo: GridRepositoryI,
    instrumentRepo: InstrumentRepositoryI,
    player: PlaybackControllerI,
) {
    await gridRepo.updatePlaying(newPlaying, gridId);

    if (newPlaying) {
        await instrumentRepo.ensureInstrumentsInitialised();
        player.stop();
        const gridsToPlay = gridRepo.getGridsFromCurrentlyPlaying();
        player.playGridsInSequence(gridsToPlay,
            (grid) => { gridRepo.updatePlaying(true, grid.id) },
            (grid) => { gridRepo.updatePlaying(false, grid.id) },
        );
    } else {
        player.stop();
    }
}
