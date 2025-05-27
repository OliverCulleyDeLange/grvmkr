import type { GridRepositoryI } from "../interface/GridRepositoryI";
import type { PlaybackControllerI } from "../interface/PlaybackControllerI";

// Space key toggles playing the currently playing grid.
export async function togglePlayUseCase(
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