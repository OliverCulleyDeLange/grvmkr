import { UiEvent, type UiEvents } from '$lib';

/** How long (ms) to wait after the first keystroke before dispatching a composed hit key. */
export const HIT_KEY_WINDOW_MS = 300;

export function registerAppKeyboardShortcuts(onEvent: (event: UiEvents) => void): () => void {
	let pendingKey = '';
	let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

	function flushPendingKey() {
		if (pendingKey) {
			onEvent({ event: UiEvent.TypeHitKey, key: pendingKey });
		}
		pendingKey = '';
		pendingTimeout = null;
	}

	function isInputTarget(target: EventTarget | null): boolean {
		return target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(target.tagName);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
			onEvent({ event: UiEvent.Copy });
		}
		if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
			onEvent({ event: UiEvent.Paste });
		}
		if (
			event.code === 'Space' &&
			!isInputTarget(event.target)
		) {
			event.preventDefault();
			onEvent({ event: UiEvent.PlayPause });
		}

		// Delete / Backspace clears hits on the currently selected cells.
		// Ignored in input fields so text editing still works normally.
		if (
			(event.key === 'Delete' || event.key === 'Backspace') &&
			!isInputTarget(event.target)
		) {
			event.preventDefault();
			onEvent({ event: UiEvent.ClearHits });
			return;
		}

		// Buffer single printable characters to compose multi-char hit keys (e.g. "Xx", "rr").
		// Ignore modifier combos and input fields.
		if (
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey &&
			event.key.length === 1 &&
			!isInputTarget(event.target)
		) {
			pendingKey += event.key;
			if (pendingTimeout !== null) clearTimeout(pendingTimeout);
			pendingTimeout = setTimeout(flushPendingKey, HIT_KEY_WINDOW_MS);
		}
	}

	window.addEventListener('keydown', handleKeyDown);
	return () => {
		window.removeEventListener('keydown', handleKeyDown);
		if (pendingTimeout !== null) clearTimeout(pendingTimeout);
	};
}
