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

// add more mocks here if you need them
