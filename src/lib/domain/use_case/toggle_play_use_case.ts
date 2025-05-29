import type { GridId, InstrumentRepositoryI } from "$lib";
import type { GridRepositoryI } from "../interface/GridRepositoryI";
import type { PlaybackControllerI } from "../interface/PlaybackControllerI";

// Play button should play the specified grid
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
        const currentlyPlaying = gridRepo.getCurrentlyPlayingGrid();
        if (currentlyPlaying) {
            player.play(currentlyPlaying);
        }
    } else {
        player.stop();
    }
}

// Space key toggles playing the most recently played grid.
export async function togglePlayRecentlyPlayedUseCase(
    gridRepo: GridRepositoryI,
    player: PlaybackControllerI,
) {
    const recentlyPlayed = gridRepo.getMostRecentlyPlayedGrid();
    if (recentlyPlayed) {
        if (recentlyPlayed.playing) {
            // If currently playing, stop it
            player.stop();
            gridRepo.setPlaying(recentlyPlayed.id, false);
            return;
        } else {
            // Play
            player.play(recentlyPlayed);
            gridRepo.setPlaying(recentlyPlayed.id, true);
        }
    } else {
        // Find first grid and play it
        const firstGrid = gridRepo.getFirstGrid()
        if (firstGrid) {
            player.play(firstGrid);
            gridRepo.setPlaying(firstGrid.id, true);
        }
    }
}