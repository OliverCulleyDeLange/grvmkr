import type { AppError } from '$lib';
import type { AppErrorUi, ToolbarUi } from '$lib';

export function mapToolbarUi(
	filename: string,
	errors: Map<string, AppError>,
	darkMode: boolean,
	playingFile: boolean
): ToolbarUi {
	const errorUi: AppErrorUi[] = [...errors.values()].map((e) => {
		return {
			id: e.id,
			message: e.message,
			contact: e.contact
				? {
						email: e.contact.email,
						mailto: `mailto:${e.contact.email}?subject=${encodeURIComponent(e.contact.subject)}`,
						prompt: e.contact.prompt
					}
				: undefined
		};
	});
	const ui: ToolbarUi = {
		errors: errorUi,
		fileName: filename,
		darkMode,
		playingFile
	};
	return ui;
}
