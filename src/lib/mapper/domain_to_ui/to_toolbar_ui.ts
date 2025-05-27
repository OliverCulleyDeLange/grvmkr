import type { AppError } from '$lib';
import type { AppErrorUi, ToolbarUi } from '$lib';

export function mapToolbarUi(filename: string, errors: Map<string, AppError>, dark: boolean): ToolbarUi {
	let errorUi: AppErrorUi[] = [...errors.values()].map((e) => {
		return {
			id: e.id,
			message: e.message
		};
	});
	let ui: ToolbarUi = {
		errors: errorUi,
		fileName: filename,
		dark
	};
	return ui;
}
