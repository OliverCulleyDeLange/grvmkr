export class UiStore {
	public darkMode = $state(true);
	private shouldShowHelpOverlay: boolean = $state(false);
	public showGrooveSelector: boolean = $state(false);
	public showResetConfirmation: boolean = $state(false);

	getShouldShowHelpOverlay(): boolean {
		return this.shouldShowHelpOverlay;
	}

	showHelpOverlay() {
		this.shouldShowHelpOverlay = true;
	}

	hideHelpOverlay() {
		this.shouldShowHelpOverlay = false;
	}

	toggleShowHelp() {
		this.shouldShowHelpOverlay = !this.shouldShowHelpOverlay;
	}

	toggleShowGrooveSelector() {
		this.showGrooveSelector = !this.showGrooveSelector;
	}

	hideResetConfirmation() {
		this.showResetConfirmation = false;
	}

	setDarkMode(v: boolean): void {
		this.darkMode = v;
	}
}
