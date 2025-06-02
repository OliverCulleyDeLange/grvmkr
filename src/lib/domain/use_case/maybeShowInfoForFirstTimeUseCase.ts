import { formatDateFriendly, UiStore } from "$lib";
import { keyValueRepository } from "$lib/data/db/local_storage/key_value_repository";

// Shows the info overlay for first time visitors
export async function maybeShowInfoForFirstTimeUseCase(uiStore: UiStore) {
    const welcomeSeenOn = keyValueRepository.getWelcomeSeenOn()
    if (!welcomeSeenOn){
        uiStore.showHelpOverlay()
        keyValueRepository.saveWelcomeSeenOn(formatDateFriendly())
    }
}