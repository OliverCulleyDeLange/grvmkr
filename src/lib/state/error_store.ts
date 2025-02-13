import type { ErrorId, AppError } from "$lib/types/domain/error";
import type { DatabaseError } from "$lib/types/domain/event";
import { SvelteMap } from "svelte/reactivity";

export type ErrorStore = {
    errors: Map<ErrorId, AppError>
    addError: (error: DatabaseError) => void
}

export const createErrorStore = (): ErrorStore => {

    const errors: SvelteMap<ErrorId, AppError> = new SvelteMap();

    function addError(event: DatabaseError){
        if (event.error == "UnknownError: The user denied permission to access the database.") {
            errors.set("DB Permissions", { message: "You have denied local storage. Please go to settings/content/cookies and enable 'allow sites to save and read cookie data', then refresh the page" })
        } else {
            errors.set(event.doingWhat, { message: `Error ${event.doingWhat}: [${event.error}]` })
        }
    }

    return { errors, addError };
};