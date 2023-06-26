export function buildResponse(apiCode: number, data: Object, message: string) {
    return data;
}

export function buildExceptionMessage(apiCode: number, message: string) {
    return { error: "", message: message };
}

export function buildErrorMessage(apiCode: number, err: Error | string, message: string) {
    if (typeof err == 'string')
        return { error: err, message: message };

    return { error: err.message, message: message };
}