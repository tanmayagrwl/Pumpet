import { template } from "dot";

// biome-ignore lint/suspicious/noExplicitAny: Ignore this particular function
export const getTemplatedString = (data: any, file: string): string => {
	try {
		const templateVariable = template(file);
		return templateVariable(data);
	} catch (err) {
		console.error(err);

		throw err;
	}
};
