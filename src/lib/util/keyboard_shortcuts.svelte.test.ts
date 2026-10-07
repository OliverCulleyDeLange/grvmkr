// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { registerAppKeyboardShortcuts, HIT_KEY_WINDOW_MS } from '$lib/util/keyboard_shortcuts';
import { UiEvent } from '$lib';

function keydown(key: string, options: Partial<KeyboardEventInit> = {}) {
	window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
}

function typeHitCalls(mockFn: ReturnType<typeof vi.fn>) {
	return (mockFn.mock.calls as unknown[]).filter(
		(c) => (c as [{ event: string }])[0]?.event === UiEvent.TypeHitKey
	) as [{ event: string; key: string }][];
}

describe('registerAppKeyboardShortcuts – TypeHitKey buffering', () => {
	let onEvent: ReturnType<typeof vi.fn>;
	let unregister: () => void;

	beforeEach(() => {
		vi.useFakeTimers();
		onEvent = vi.fn();
		unregister = registerAppKeyboardShortcuts(onEvent);
	});

	afterEach(() => {
		unregister();
		vi.useRealTimers();
	});

	it('dispatches TypeHitKey after the window for a single key', () => {
		keydown('X');
		expect(onEvent).not.toHaveBeenCalledWith(
			expect.objectContaining({ event: UiEvent.TypeHitKey })
		);
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.TypeHitKey, key: 'X' });
	});

	it('respects case – lower-case key dispatched as-is', () => {
		keydown('x');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.TypeHitKey, key: 'x' });
	});

	it('buffers multiple keys typed within the window into one dispatch', () => {
		keydown('X');
		keydown('x');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.TypeHitKey, key: 'Xx' });
		expect(typeHitCalls(onEvent)).toHaveLength(1);
	});

	it('handles three-character sequences', () => {
		keydown('r');
		keydown('r');
		keydown('r');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.TypeHitKey, key: 'rrr' });
	});

	it('dispatches separate events for keys typed with a gap between them', () => {
		keydown('X');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		keydown('m');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		const calls = typeHitCalls(onEvent);
		expect(calls).toHaveLength(2);
		expect(calls[0][0]).toEqual({ event: UiEvent.TypeHitKey, key: 'X' });
		expect(calls[1][0]).toEqual({ event: UiEvent.TypeHitKey, key: 'm' });
	});

	it('resets the timer on each new keystroke within the window', () => {
		keydown('X');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS - 10);
		// Window not yet elapsed – no dispatch
		expect(typeHitCalls(onEvent)).toHaveLength(0);
		keydown('x');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS - 10);
		// Combined window still not elapsed
		expect(typeHitCalls(onEvent)).toHaveLength(0);
		vi.advanceTimersByTime(20);
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.TypeHitKey, key: 'Xx' });
	});

	it('does not dispatch TypeHitKey when typing in an INPUT element', () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'X', bubbles: true }));
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
		document.body.removeChild(input);
	});

	it('does not dispatch TypeHitKey when typing in a TEXTAREA element', () => {
		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);
		textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
		document.body.removeChild(textarea);
	});

	it('does not dispatch TypeHitKey for Ctrl+key combos', () => {
		keydown('c', { ctrlKey: true });
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('does not dispatch TypeHitKey for Meta+key combos', () => {
		keydown('c', { metaKey: true });
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('does not dispatch TypeHitKey for Alt+key combos', () => {
		keydown('a', { altKey: true });
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('still dispatches Copy for Ctrl+C alongside no TypeHitKey', () => {
		keydown('c', { ctrlKey: true });
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.Copy });
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('still dispatches Paste for Ctrl+V', () => {
		keydown('v', { ctrlKey: true });
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.Paste });
	});

	it('leaves Ctrl+C to a focused input', () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
		expect(onEvent).not.toHaveBeenCalledWith({ event: UiEvent.Copy });
		input.remove();
	});

	it('leaves Ctrl+V to editable content', () => {
		const editable = document.createElement('div');
		editable.setAttribute('contenteditable', 'true');
		document.body.appendChild(editable);
		editable.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true })
		);
		expect(onEvent).not.toHaveBeenCalledWith({ event: UiEvent.Paste });
		editable.remove();
	});

	it('does not dispatch TypeHitKey for non-printable keys like Escape', () => {
		keydown('Escape');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('does not dispatch TypeHitKey for Arrow keys', () => {
		keydown('ArrowRight');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('cancels pending dispatch when unregistered', () => {
		keydown('X');
		unregister(); // clears the timeout
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS * 2);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('dispatches ClearHits when Delete is pressed', () => {
		keydown('Delete');
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.ClearHits });
	});

	it('dispatches ClearHits when Backspace is pressed', () => {
		keydown('Backspace');
		expect(onEvent).toHaveBeenCalledWith({ event: UiEvent.ClearHits });
	});

	it('does not buffer Delete/Backspace as TypeHitKey', () => {
		keydown('Delete');
		keydown('Backspace');
		vi.advanceTimersByTime(HIT_KEY_WINDOW_MS);
		expect(typeHitCalls(onEvent)).toHaveLength(0);
	});

	it('does not dispatch ClearHits when Backspace is pressed inside an INPUT', () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
		expect(onEvent).not.toHaveBeenCalledWith({ event: UiEvent.ClearHits });
		document.body.removeChild(input);
	});

	it('does not dispatch ClearHits when Delete is pressed inside a TEXTAREA', () => {
		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);
		textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
		expect(onEvent).not.toHaveBeenCalledWith({ event: UiEvent.ClearHits });
		document.body.removeChild(textarea);
	});
});
