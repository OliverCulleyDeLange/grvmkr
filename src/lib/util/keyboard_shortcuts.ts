import { UiEvent, type UiEvents } from '$lib';

export function registerAppKeyboardShortcuts(onEvent: (event: UiEvents) => void): () => void {
	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
			onEvent({ event: UiEvent.Copy });
		}
		if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
			onEvent({ event: UiEvent.Paste });
		}
		if (
			event.code === 'Space' &&
			event.target instanceof HTMLElement &&
			!['INPUT', 'TEXTAREA'].includes(event.target.tagName)
		) {
			event.preventDefault();
			onEvent({ event: UiEvent.PlayPause });
		}
	}

	window.addEventListener('keydown', handleKeyDown);
	return () => window.removeEventListener('keydown', handleKeyDown);
}
