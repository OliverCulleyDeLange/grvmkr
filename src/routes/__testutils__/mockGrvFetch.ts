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
	globalThis.fetch = vi.fn(async (input: any, init?: any) => {
		if (typeof input === 'string' && input.endsWith('example.grv')) {
			const filePath = path.resolve(process.cwd(), 'static/example.grv');
			console.log('[mockGrvFileFetch] Intercepted fetch for:', input);
			console.log('[mockGrvFileFetch] example.grv filepath:', filePath);
			const buffer = fs.readFileSync(filePath);
			console.log('[mockGrvFileFetch] Read buffer length:', buffer.length);
			// Pass the Buffer directly to Response (not as a Blob)
			const response = new Response(buffer, {
				status: 200,
				headers: { 'Content-Type': 'application/zip' }
			});
			console.log('[mockGrvFileFetch] Returning Response:', response);
			return response;
		}
		// Handle audio file fetches (.mp3, .wav)
		if (typeof input === 'string' && (input.endsWith('.mp3') || input.endsWith('.wav'))) {
			const ext = input.endsWith('.mp3') ? 'mp3' : 'wav';
			const mime = ext === 'mp3' ? 'audio/mpeg' : 'audio/wav';
			const audioPath = path.resolve(process.cwd(), 'static', input.replace(/^\.?\/?/, ''));
			let response;
			try {
				const audioBuffer = fs.readFileSync(audioPath);
				response = new Response(audioBuffer, {
					status: 200,
					headers: { 'Content-Type': mime }
				});
				console.log(
					`[mockGrvFileFetch] Served real audio file: ${audioPath}, size: ${audioBuffer.length}`
				);
			} catch (e) {
				response = new Response(new Uint8Array(), {
					status: 200,
					headers: { 'Content-Type': mime }
				});
				console.warn(
					`[mockGrvFileFetch] Audio file not found, serving empty response: ${audioPath}`
				);
			}
			return response;
		}
		// Handle blob: URLs (jsdom fake blob audio URLs)
		if (typeof input === 'string' && input.startsWith('blob:')) {
			// Return a dummy audio file (empty buffer with audio/mpeg)
			const mime = 'audio/mpeg';
			const response = new Response(new Uint8Array(), {
				status: 200,
				headers: { 'Content-Type': mime }
			});
			console.log('[mockGrvFileFetch] Served dummy audio for blob URL:', input);
			return response;
		}
		console.warn('[mockGrvFileFetch] Unhandled fetch:', input);
		return Promise.reject(new Error('Unhandled fetch: ' + input));
	});
}
