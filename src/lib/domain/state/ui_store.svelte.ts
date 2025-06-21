export class UiStore {
	public darkMode = $state(true);
	private shouldShowHelpOverlay: boolean = $state(false);
	private shouldShowDebugOverlay: boolean = $state(false);
	public showGrooveSelector: boolean = $state(false);
	public showResetConfirmation: boolean = $state(false);
	public screenWidth: number = $state(1024); // Safe default for SSR

	setScreenWidth(width: number): void {
		this.screenWidth = width;
	}

	getScreenWidth(): number {
		return this.screenWidth;
	}

	getShouldShowHelpOverlay(): boolean {
		return this.shouldShowHelpOverlay;
	}

	getShouldShowDebugOverlay(): boolean {
		return this.shouldShowDebugOverlay;
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

	toggleShowDebug() {
		this.shouldShowDebugOverlay = !this.shouldShowDebugOverlay;
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
