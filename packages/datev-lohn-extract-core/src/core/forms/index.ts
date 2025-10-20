import { AbstractForm } from "./abstract-form.js";
import { LOGN17Form } from "./logn17-form.js";
import { LOMS05Form } from "./loms05-form.js";
import { UnknownForm } from "./unknown-form.js";

export { AbstractForm, LOGN17Form, LOMS05Form, UnknownForm };

/**
 * All available form handlers.
 */
export const allFormHandlers: AbstractForm<any>[] = [
	new LOGN17Form(),
	new LOMS05Form(),
	new UnknownForm(),
];
