export enum ProofTypeQuery {
    MTP = "mtp",
    SIG = "sig",
    NON_REV_MTP = "nonRevMtp"
}

export enum KYCService {
    ATERMIS = "ATERMIS"
}

export enum SchemaHash {
    IDCARD = "123456"
}

export enum ClaimStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    REVIEWING = "REVIEWING",
    REJECT = "REJECT",
    PENDING_REVOKE = "PENDING_REVOKE",
    REVOKED = "REVOKED"
}

export enum ProofType {
    MTP = "mtp",
    SIG = "sig"
}

export enum BatchStatus {
    PENDING = "PENDING",
    INCLUDED = "INCLUDED",
    ACTIVE = "ACTIVE"
}

export enum OperatorType {
    ADMIN = 1,
    OPERATOR = 2
}

export enum SchemaType {
    context = "context",
    schema = "schema"
}

export enum SchemaPropertyId {
    val1 = "std-pos:val-1",
    val2 = "std-pos:val-2",
    idx1 = "std-pos:idx-1",
    idx2 = "std-pos:idx-2",
}

export enum SchemaPropertyType {
    str = "std:str",
    int64 =  "std:int",
    double = "std:double",
    obj = "std:obj",
    bool = "std:bool",
    date = "std:date"
}