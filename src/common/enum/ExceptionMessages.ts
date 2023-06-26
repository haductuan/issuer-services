export const ExceptionMessage = Object.freeze({
    UNKNOWN: {
        message: 'api error unknown',
        apiCode: 400
    },
    USER_NOT_EXITS: {
        message: 'user not exits',
        apiCode: 301
    },
    INVALID_PASSWORD: {
        message: 'invalid password',
        apiCode: 302
    },
    INVALID_JWT: {
        message: 'invalid jwt',
        apiCode: 303
    },
    INVALID_DATA: {
        apiCode: 'invalid data',
        status: 304
    },
    USERNAME_EXITED: {
        message: 'username exited',
        apiCode: 305
    },
    INVALID_LENGTH_USERNAME: {
        message: `username's length must be less than 20`,
        apiCode: 306
    },
    INVALID_LENGTH_PASSWORD: {
        message: `password's length must be less than 20`,
        apiCode: 307
    },
    UNAUTHORIZED: {
        message: 'unauthorized',
        apiCode: 401
    },

    FAILED_SETUP_TREE: {
        message: 'failed to setup issuer clear tree',
        apiCode: 901
    },

    BATCH_UPDATE_LOCK: {
        message: 'batch update is locked',
        apiCode: 902
    }
})