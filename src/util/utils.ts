import { utils as zidenjsUtils, claim as zidenjsClaim, claim } from "@zidendev/zidenjs";
import fs, { readFileSync } from "fs";
import { GlobalVariables } from "../common/config/global.js";
import { ISSUER_SERVER } from "../common/config/secrets.js";

export function serializaData(data: Object): string {
    return JSON.stringify(data, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
    );
}

export function serializaDataClaim(claim: zidenjsClaim.Entry): Array<string> {
    let dataResponse = new Array<string>;
    claim.elements.forEach(function (value: Buffer) {
        dataResponse.push(zidenjsUtils.bufferToHex(value));
    });

    return dataResponse;
}

export function deserializaDataClaim(claim: Array<string>): zidenjsClaim.Entry {
    let data = new Array<Buffer>;
    claim.forEach(function (value: string) {
        data.push(zidenjsUtils.hexToBuffer(value, 32));
    });
    return new zidenjsClaim.Entry(data);
}

export function uint8ArrayToArray(uint8Array: Uint8Array) {
    var array = [];

    for (var i = 0; i < uint8Array.byteLength; i++) {
        array[i] = uint8Array[i];
    }

    return array;
}

export async function getCountryCode(countryName: string) {
    try {
        const country = JSON.parse(readFileSync("src/util/countryCode.json", "utf-8"));
        let ans = 0;
        let newName = (countryName.replace(/\s/g, '')).toLowerCase();
        for (let i = 0; i < country.length; i++) {
            if (country[i]["countryName"] == newName) {
                ans = country[i]["countryCode"];
                break;
            }
        }
        return ans;

    } catch (err: any) {
        return 0;
    }
}


export async function urltoFile(url: string, filename: string, mimeType: string) {
    const base64 = url;
    const pathToSaveImage = filename;

    const path = converBase64ToImage(base64, pathToSaveImage);
}

function converBase64ToImage(base64: string, path: string) {
    try {
        let base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (!base64.startsWith("data:image")) {
            throw ('Invalid base64 string');
        }
        if (!base64) {
            throw ('Base64 can not be empty');
        }
        if (!path) {
            throw ('Path can not be empty');
        }
        let base64String = readBase64File(base64);
        let buffer = convertBase64ToBuffer(base64String);
        bufferToImageAndWriteImageToPath(buffer, path);

    } catch(err: any) {
        throw(err);
    }
}

function manipulateUTF8String(utf8: string) {
    try {
        let base64 = utf8.split(',')[1];
        return base64;
    } catch(err: any) {
        throw("Invalid base64 string");
    }
}

function readBase64File(base64: string) {
    try {
        var utf8OrBase64String = base64;
        var base64String = manipulateUTF8String(utf8OrBase64String);
        return base64String;
    } catch (err: any) {
        throw(err);
    }
}

function convertBase64ToBuffer(base64: string) {
    try {
        var buffer = Buffer.from(base64, 'base64');
        return buffer;
    }
    catch (err: any) {
        throw(err);
    }
}

function bufferToImageAndWriteImageToPath(base64: Buffer, path: string) {
    try {
        var fullPath = path.split('/');
        var fileName = fullPath.at(-1);
        var dir = fullPath.slice(0, -1).join('/');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync("".concat(dir, "/").concat(fileName!), base64);
        }
        else {
            fs.writeFileSync(path, base64);
        }
    }
    catch (error: any) {
        throw error;
    }
}

export async function b64ToBlob(b64Data: string, contentType: string = '', sliceSize: number = 512) {
    const byteCharacters = Buffer.from(b64Data, 'base64');
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice[i];
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

export function checkInEnum(x: any, y: any) {
    return Object.values(y).includes(x as typeof y);
}

export function getSchemaHashFromSchema(schema: any) {
    let hashData = GlobalVariables
    .F.toObject(GlobalVariables.hasher([BigInt(zidenjsUtils.stringToHex(JSON.stringify(schema)))]))
    .toString(2);
  let bitRemove = hashData.length < 124 ? 0 : hashData.length - 124;
  let hashDataFixed = BigInt('0b' + hashData.slice(0, hashData.length - bitRemove));
  let value = BigInt(hashDataFixed);
  return value.toString();
}

export function parseBigInt(val: Array<any>) {
    let res = [];
    for (let i = 0; i < val.length; i++) {
        res.push(BigInt(val[i]));
    }
    return res;
}

export function getImagesUrl(filename: string) {
    return `${ISSUER_SERVER}/public/${filename}`;
}

export function resolveId(id: string) {
    return `did:zid:${id}`;
}