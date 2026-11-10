import { StatusCodes } from 'http-status-codes';
import { CustomError } from './custom-error';

export async function readBody(
	request: Request
): Promise<Record<string, unknown>> {
	const requestText = await request.text();
	const formattedText = requestText.trim();
	if (!formattedText) {
		return {};
	}

	if (formattedText.startsWith('{')) {
		const parsed: unknown = JSON.parse(formattedText);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new CustomError('Ожидался JSON-объект', StatusCodes.BAD_REQUEST);
		}
		return parsed as Record<string, unknown>;
	}
	return Object.fromEntries(new URLSearchParams(formattedText));
}
