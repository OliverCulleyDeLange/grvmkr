import fs from 'fs';
import path from 'path';
import { vi } from 'vitest';

/**
 * Mocks global fetch to return the real static/example.grv file as a Response
 * when a request ends with 'example.grv'.
 * Also handles .mp3 and .wav audio file fetches with valid Blobs.
 * Call this at the start of your test.
 */
export function mockGrvFileFetch() {
	globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
		const inputString =
			typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		if (inputString.endsWith('example.grv')) {
			const filePath = path.resolve(process.cwd(), 'static/example.grv');
			const buffer = fs.readFileSync(filePath);
			// Pass the Buffer directly to Response (not as a Blob)
			const response = new Response(buffer, {
				status: 200,
				headers: { 'Content-Type': 'application/zip' }
			});
			return response;
		}
		// Handle audio file fetches (.mp3, .wav)
		if (inputString.endsWith('.mp3') || inputString.endsWith('.wav')) {
			const ext = inputString.endsWith('.mp3') ? 'mp3' : 'wav';
			const mime = ext === 'mp3' ? 'audio/mpeg' : 'audio/wav';
			const audioPath = path.resolve(process.cwd(), 'static', inputString.replace(/^\.?\/?/, ''));
			let response;
			try {
				const audioBuffer = fs.readFileSync(audioPath);
				response = new Response(audioBuffer, {
					status: 200,
					headers: { 'Content-Type': mime }
				});
			} catch {
				response = new Response(new Uint8Array(), {
					status: 200,
					headers: { 'Content-Type': mime }
				});
			}
			return response;
		}
		// Handle blob: URLs (jsdom fake blob audio URLs)
		if (inputString.startsWith('blob:')) {
			// Return a dummy audio file (empty buffer with audio/mpeg)
			const mime = 'audio/mpeg';
			const response = new Response(new Uint8Array(), {
				status: 200,
				headers: { 'Content-Type': mime }
			});
			return response;
		}
		return Promise.reject(new Error('Unhandled fetch: ' + inputString));
	});
}
