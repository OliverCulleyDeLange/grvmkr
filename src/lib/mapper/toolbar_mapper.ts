import type { AppError } from "$lib";
import type { AppErrorUi, ToolbarUi } from "$lib";

export function mapToolbarUi(filename: string, errors: Map<string, AppError>): ToolbarUi {
    let errorUi: AppErrorUi[] = [...errors.values()]
        .map((e) => { return { message: e.message } })
    let ui: ToolbarUi = {
        errors: errorUi,
        fileName: filename
    }
    return ui
}