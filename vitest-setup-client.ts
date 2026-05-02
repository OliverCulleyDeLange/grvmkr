import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Global mocks for browser APIs needed by GrvMkr tests

// Mock AudioContext for jsdom
globalThis.AudioContext = vi.fn().mockImplementation(() => {
	const gainNode = {
		connect: vi.fn(),
		disconnect: vi.fn(),
		gain: {
			value: 1,
			setValueAtTime: vi.fn()
		}
	};
	return {
		resume: vi.fn(),
		close: vi.fn(),
		createBufferSource: vi.fn().mockReturnValue({
			connect: vi.fn(),
			start: vi.fn(),
			stop: vi.fn(),
			disconnect: vi.fn(),
			buffer: null,
			onended: null
		}),
		createGain: vi.fn().mockReturnValue(gainNode),
		destination: {},
		currentTime: 0,
		decodeAudioData: vi.fn((arrayBuffer: ArrayBuffer, cb: (buffer: any) => void) => cb && cb({}))
	};
});
// Patch for legacy webkitAudioContext in jsdom
(globalThis as any).webkitAudioContext = globalThis.AudioContext;

// Patch for jsdom: mock URL.createObjectURL if not present
if (!globalThis.URL.createObjectURL) {
	globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
}

// jsdom has no Worker. Stub a minimal one so WorkerPlaybackStore can construct.
// Tests don't drive timing through the worker; they just need construction to succeed.
class WorkerStub {
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;
	postMessage = vi.fn();
	terminate = vi.fn();
	addEventListener = vi.fn();
	removeEventListener = vi.fn();
	dispatchEvent = vi.fn();
}
(globalThis as any).Worker = WorkerStub;

// jsdom has no IntersectionObserver. Stub one that immediately reports visible
// so the grid virtualization code measures and renders content under test.
class IntersectionObserverStub {
	constructor(private callback: IntersectionObserverCallback) {}
	observe = vi.fn((target: Element) => {
		this.callback(
			[{ isIntersecting: true, target } as IntersectionObserverEntry],
			this as unknown as IntersectionObserver
		);
	});
	unobserve = vi.fn();
	disconnect = vi.fn();
	takeRecords = vi.fn(() => []);
	root = null;
	rootMargin = '';
	thresholds: ReadonlyArray<number> = [];
}
(globalThis as any).IntersectionObserver = IntersectionObserverStub;

// add more mocks here if you need them
