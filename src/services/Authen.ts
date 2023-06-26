import axios from "axios";
import { AUTHEN_SERVER } from "../common/config/secrets.js";

export async function verifyTokenAdmin(token: string, issuerId: string) {
    try {
        if (!token || !issuerId) {
            return false;
        }
    
        let url = AUTHEN_SERVER + `/api/v1/auth/verify-token-admin/${issuerId}`;


        const response = await axios.request({
            method: "POST",
            url: url,
            data: {
                "token": token
            }
        });
    
        if (response.data["isValid"]) {
            return true;
        } else {
            return false;
        }
    } catch (err: any) {
        return false;
    }
    
}

export async function verfifyTokenWithRole(token: string, issuerId: string, role: number) {
    try {
        if (!token || !issuerId) {
            return false;
        }
    
        let url = AUTHEN_SERVER + `/api/v1/auth/verify-token/${issuerId}`;
        
        const response = await axios.request({
            method: "POST",
            url: url,
            data: {
                "token": token,
                "role": role
            }
        });
    
        if (response.data["isValid"]) {
            return true;
        } else {
            return false;
        }
    } catch (err: any) {
        return false;
    }
}

export async function login(data: any, issuerId: string) {
    if (!issuerId) {
        throw("Invalid issuerId");
    }

    try {
        let url = AUTHEN_SERVER + `/api/v1/auth/login/${issuerId}`;
        const respone = await axios.request({
            method: "POST",
            url: url,
            data: data
        });

        const token = respone.data["token"];
        if (token == undefined) {
            throw("Invalid request");
        }
        return token;

    } catch (err) {
        throw("Invalid request");
    }
}

export async function registerNewIssuer(issuerId: string) {
    try {
        const url = AUTHEN_SERVER + "/api/v1/register";
        const response = await axios.request({
            method: "POST",
            url: url,
            data: {
                "userId": issuerId
            }
        });

        return {
            userId: response.data.userId,
            issuerId: response.data.adminId,
            operator: response.data.operator,
            claimId: response.data.claimId,
            version: response.data.version,
            revNonce: response.data.revNonce
        };
    } catch (err: any) {
        throw("Invalid request");
    }
}

export async function createOperator(operatorId: string, issuerId: string, token: string) {
    try {
        const url = AUTHEN_SERVER + `/api/v1/${issuerId}/operators`;
        const response = await axios.request({
            method: "POST",
            url: url,
            data: {
                "operatorId": operatorId,
                "role": 2
            },
            headers: {
                "Authorization": token
            }
        });

        return {
            userId: response.data.userId,
            issuerId: response.data.adminId,
            operator: response.data.operator,
            claimId: response.data.claimId,
            version: response.data.version,
            revNonce: response.data.revNonce
        };
    } catch (err: any) {
        throw("Invalid request");
    }
}

export async function revokeOperator(operatorId: string, issuerId: string, token: string) {
    try {
        const url = AUTHEN_SERVER + `/api/v1/${issuerId}/operators/${operatorId}`;
        const response = await axios.request({
            method: "DELETE",
            url: url,
            headers: {
                "Authorization": token
            }
        });

    } catch (err: any) {
        throw("Invalid request");
    }
}

export async function getAuthenProof(claimId: string, type: string) {
    let url = AUTHEN_SERVER + `/api/v1/claims/${claimId}/proof?type=${type}`;
    const proof = await axios.request({
        method: "GET",
        url: url
    });
    return proof.data;
}

export async function getOperatorInforInAuthen(operatorId: string, issuerId: string) {
    let url = AUTHEN_SERVER + `/api/v1/${issuerId}/operators/${operatorId}`;
    const response = await axios.request({
        method: "GET",
        url: url
    });
    return {
        userId: response.data.userId,
        issuerId: response.data.adminId,
        role: response.data.role,
        claimId: response.data.claimId,
        schemaHash: response.data.schemaHash,
        version: response.data.version,
        revNonce: response.data.revNonce
    };
}