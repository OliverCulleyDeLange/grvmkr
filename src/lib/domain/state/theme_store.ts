import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { keyValueRepository } from '$lib';

const dark = writable(true);

function initTheme() {
	if (!browser) return;

	const saved = keyValueRepository.getTheme();
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const isDark = saved === 'dark' || (!saved && prefersDark);
	setTheme(isDark);
	dark.set(isDark);
}

function toggleTheme() {
	dark.update((curr) => {
		const next = !curr;
		setTheme(next);
		return next;
	});
}

function setTheme(isDark: boolean) {
	const html = document.documentElement;
	if (isDark) {
		html.classList.add('dark');
		html.setAttribute('data-theme', 'dark');
		keyValueRepository.saveTheme('dark');
	} else {
		html.classList.remove('dark');
		html.setAttribute('data-theme', 'light');
		keyValueRepository.saveTheme('light');
	}
}

export const themeStore = {
	dark,
	toggleTheme,
	initTheme
};
