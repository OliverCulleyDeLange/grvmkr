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
		return (
			target instanceof HTMLElement &&
			(['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
				target.isContentEditable ||
				target.closest('[contenteditable]:not([contenteditable="false"])') !== null)
		);
	}

	function hasTextSelection(): boolean {
		return (window.getSelection()?.toString().length ?? 0) > 0;
	}

	function handleCopy(event: ClipboardEvent) {
		if (isInputTarget(event.target) || hasTextSelection()) return;
		event.preventDefault();
		onEvent({ event: UiEvent.Copy });
	}

	function handlePaste(event: ClipboardEvent) {
		if (isInputTarget(event.target)) return;
		event.preventDefault();
		onEvent({ event: UiEvent.Paste });
	}

	function handleKeyDown(event: KeyboardEvent) {
		const arrowDirections = {
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right'
		} as const;
		const direction = arrowDirections[event.key as keyof typeof arrowDirections];
		if (
			direction &&
			!isInputTarget(event.target) &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey
		) {
			event.preventDefault();
			// Commit a buffered hit before changing the selection so fast keyboard entry
			// applies the hit to the cell it was typed on.
			if (pendingTimeout !== null) clearTimeout(pendingTimeout);
			flushPendingKey();
			onEvent({ event: UiEvent.MoveCellSelection, direction });
			return;
		}

		if (
			(event.ctrlKey || event.metaKey) &&
			event.key.toLowerCase() === 'c' &&
			!isInputTarget(event.target) &&
			!hasTextSelection()
		) {
			event.preventDefault();
			onEvent({ event: UiEvent.Copy });
		}
		if (
			(event.ctrlKey || event.metaKey) &&
			event.key.toLowerCase() === 'v' &&
			!isInputTarget(event.target)
		) {
			event.preventDefault();
			onEvent({ event: UiEvent.Paste });
		}
		if (event.code === 'Space' && !isInputTarget(event.target)) {
			event.preventDefault();
			onEvent({ event: UiEvent.PlayPause });
		}

		// Delete / Backspace clears hits on the currently selected cells.
		// Ignored in input fields so text editing still works normally.
		if ((event.key === 'Delete' || event.key === 'Backspace') && !isInputTarget(event.target)) {
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
	window.addEventListener('copy', handleCopy);
	window.addEventListener('paste', handlePaste);
	return () => {
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('copy', handleCopy);
		window.removeEventListener('paste', handlePaste);
		if (pendingTimeout !== null) clearTimeout(pendingTimeout);
	};
}
