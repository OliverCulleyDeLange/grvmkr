import type { AppError } from '$lib';
import type { AppErrorUi, ToolbarUi } from '$lib';

export function mapToolbarUi(
	filename: string,
	errors: Map<string, AppError>,
	darkMode: boolean
): ToolbarUi {
	let errorUi: AppErrorUi[] = [...errors.values()].map((e) => {
		return {
			id: e.id,
			message: e.message
		};
	});
	let ui: ToolbarUi = {
		errors: errorUi,
		fileName: filename,
		darkMode
	};
	return ui;
}
