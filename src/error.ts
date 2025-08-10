// errors.ts
export class APILoaderError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace?.(this, this.constructor);
	}
}

export class VersionNotSupportedError extends APILoaderError {}
export class MethodNotFoundError extends APILoaderError {}
