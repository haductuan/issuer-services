import axios from "axios";
import { v4 } from "uuid";
import { SchemaPropertyId, SchemaPropertyType, SchemaType } from "../common/enum/EnumType.js";
import Schema from "../models/Schema.js";
import { checkInEnum, getSchemaHashFromSchema } from "../util/utils.js";
import { schema as zidenjsSchema } from "@zidendev/zidenjs";
import { ISSUER_SERVER, ZIDEN_SERVER_URI } from "../common/config/secrets.js";

export async function createNewSchema(schema: any) {
    try {
        await checkValidFormSchema(schema);
        const schemaHash = getSchemaHashFromSchema(schema);

        const checkSchema = await Schema.findOne({"@hash": schemaHash});
        if (checkSchema) {
            throw("Schema existed!");
        }

        const newSchema = new Schema({
            ...schema
        });

        if (schema["@type"] == SchemaType.schema) {
            newSchema["@hash"] = schemaHash;
        }

        newSchema["@id"] = v4();

        try {
            await axios.request({
                method: "POST",
                url: `${ZIDEN_SERVER_URI}/api/v1/schemas`,
                data: {
                    // schema: newSchema
                    schema: {
                        name: newSchema["@name"],
                        hash: newSchema["@hash"],
                        accessUri: `${ISSUER_SERVER}/api/v1/schemas/${newSchema["@hash"]}`,
                        jsonSchema: newSchema
                    }
                }
            });
        } catch (err: any) {
            console.log(err)
        }

        await newSchema.save();
        return newSchema;
    } catch (err: any) {
        console.log(err);
        throw(err);
    }
}

export async function checkValidFormSchema(schema: any) {
    if (!schema || !schema["@name"] || !schema["@type"] || !schema["@context"] || !schema["@required"]) {
        throw("Invalid schema");
    }

    if (typeof schema["@name"] != "string" 
        || typeof schema["@type"] != "string"
        || typeof schema["@name"] != "string"
        || !Array.isArray(schema["@context"])
        || !Array.isArray(schema["@required"])) {
            throw("Invalid schema");
        }
    if (!checkInEnum(schema["@type"], SchemaType)) {
        throw("Invalid @type");
    }
    
    const listContext = await getSubContext(schema);

    const keys = Object.keys(schema);
    keys.forEach((key) => {
        if (key[0] != '@') {
            // key: property
            const property = schema[key];
            
            // get type
            const type = property["@type"];
            if (!type || typeof type != "string") {
                throw("Invalid type in " + key);
            }
            const arr = type.split(":");
            if (arr.length != 2) {
                throw("Invalid type in " + key);             
            }

            let checkValidType: boolean = false;
            if (checkInEnum(type, SchemaPropertyType)) {
                if (type == SchemaPropertyType.obj) {
                    if (checkPropertyNotObject(property, listContext)) {
                        checkValidType = true;
                    } else {
                        throw("Invalid propeties type in type std:object " + key);
                    }
                }
                else {
                    checkValidType = true;
                }
            }

            if (!checkValidType) {
                for (let index in listContext) {
                    if (checkAttribute(type, listContext[index])) {
                        checkValidType = true;
                        break;
                    }
                }
            }

            if (!checkValidType) {
                throw("Invalid type in " + key + ": " + type);
            }

            // get values in case context
            if (schema["@type"] == SchemaType.context) {
                
                const values = property["@values"];
                if (values && Array.isArray(values)) {
                    if (!checkInEnum(type, SchemaPropertyType) && values.length != 0) {
                        if (!checkSubValues(type, values, listContext)) {
                            throw("Invalid values in " + key + ": values must be subValues of values in " + type);
                        }
                    }                
                }
            
                
            }

            // get id in case schema
            if (schema["@type"] == SchemaType.schema) {
                const id = property["@id"];
                if (!id || !checkInEnum(id, SchemaPropertyId)) {
                    throw("Invalid id in " + key);
                }
            }

        }
    });
}

export async function getAllSchema() {
    const schemas = await Schema.find().select('-__v').select('-_id');
    if (schemas.length == 0) {
        return [];
    } else {
        return schemas;
    }
}

export async function getSchemaBySchemaHash(schemaHash: string) {
    const schema = await Schema.findOne({"@hash": schemaHash}).select('-__v').select('-_id');

    if (!schema) {
        throw("SchemaHash not existed!");
    }
    const schemaRaw = await getRawSchema(schemaHash);
    const schemaResponse: any = {
        "@name": schema["@name"],
        "@type": schema["@type"],
        "@id": schema["@id"],
        "@hash": schema["@hash"],
        "@required": schema["@required"],
        ...schemaRaw
    };

    return schemaResponse;
}

export function checkAttribute(type: string, context: any) {
    const arr = type.split(":");
    if (arr.length != 2) {
        return false;
    }
    if (arr[0] != context["@id"]) {
        return false;
    }
    const keys = Object.keys(context);
    for (let i in keys) {
        if (keys[i] == arr[1]) {
            return true;
        }
    }
    return false;
}

export function checkSubValues(type: string, values: Array<any>, context: any) {
    const arr = type.split(":");
    if (arr.length != 2) {
        return false;
    }
    if (arr[0] != context["@id"]) {
        return false;
    }
    const keys = Object.keys(context);
    for (let i in keys) {
        if (keys[i] == arr[1]) {
            if (!context[keys[i]] || !context[keys[i]]["@values"]) {
                return false;
            }
            if (values.every(val => context[keys[i]]["@values"].includes(val))) {
                return false;
            }
            return true;
        }
    }
    return false;
}

function checkPropertyNotObject(property: any, listContext: Array<any>) {
    let keysObject = Object.keys(property);
    let listPropertyCheck: Array<any> = [];

    for (let index in keysObject) {
        const keyObject = keysObject[index];
        if (keyObject == "@type" || keyObject == "@id") {
            continue;
        }
        listPropertyCheck.push(property[keyObject]);
    }

    for (let index = 0; index < listPropertyCheck.length; index++) {
        const obj = listPropertyCheck[index];
        const typeObj = obj["@type"];

        let checkValidTypeObj = false;
        if (!typeObj || typeof typeObj != "string") {
            return false;
        }
        const arr = typeObj.split(":");
        if (arr.length != 2) {
            return false;
        }

        if (checkInEnum(typeObj, SchemaPropertyType)) {
            if (typeObj == SchemaPropertyType.obj) {
                return false;
            }
            else {
                checkValidTypeObj = true;
            }
        }
        if (!checkValidTypeObj) {
            for (let index in listContext) {
                if (checkValidTypeObj) {
                    break;
                }
                const subContext = listContext[index];
                if (arr[0] != subContext["@id"]) {
                    continue;
                }
                const keysSubContext = Object.keys(subContext);
                for (let id in keysSubContext) {
                    if (keysSubContext[id] == arr[1]) {
                        const subType = subContext[keysSubContext[id]]["@type"];

                        if (checkInEnum(subType, SchemaPropertyType)) {
                            if (subType == SchemaPropertyType.obj) {
                                return false;
                            }
                            else {
                                checkValidTypeObj = true;
                                break;
                            }
                        } else {
                            listPropertyCheck.push(subContext[keysSubContext[id]]);
                            checkValidTypeObj = true;
                        }
                    }
                }
            }
        }
        if (!checkValidTypeObj) {
            return false;
        }
    }

    return true;
}

export async function getPrimitiveSchema(schemaHash: string) {
    const schema = await Schema.findOne({"@hash": schemaHash});
    if (!schema) {
        throw("SchemaHash not exist!");
    }
    if (schema["@type"] == SchemaType.context) {
        throw("Invalid schemaHash!");
    }

    const schemaRaw: any = schema;

    const schema2: any = {};

    const listContext = await getSubContext(schema);

    const keys = Object.keys(schemaRaw);
    keys.forEach(key => {
        if (key[0] ==  '_' || key[0] == '$' || key == "@context" || key == "@required") {
            return;
        } 
        schema2[key] = schemaRaw[key];
    })

    schema2["@context"] = listContext;
    schema2["@required"] = schema["@required"];
    
    let primitiveSchema = zidenjsSchema.getInputSchema(schema2);

    return primitiveSchema;
}


async function getSubContext(schema: any) {
    let listContextUrl: Array<string> = [];
    let listContextId: Array<string> = [];
    let listContext: Array<any> = [];

    for (let i in schema["@context"]) {
        const url = schema["@context"][i];
        if (!url || typeof url != "string") {
            continue;
        }
        if (listContextUrl.includes(url)) {
            continue;
        }
        listContextUrl.push(url);
    }

    for (let i = 0; i < listContextUrl.length; i++) {
        const url = listContextUrl[i];
        try {
            const response = await axios.get(url);
            if (response.status == 200) {
                const data = await (response.data);
                if (!data["@type"] || data["@type"] != SchemaType.context) {
                    continue;
                }
                if (listContextId.includes(data["@id"])) {
                    continue;
                }
                listContext.push(data);
                listContextId.push(data["@id"]);
                for (let index in data["@context"]) {
                    const urlContext = data["@context"][index];
                    if (!urlContext || typeof urlContext != "string") {
                        continue;
                    }
                    if (listContextUrl.includes(urlContext)) {
                        continue;
                    }
                    listContextUrl.push(urlContext);
                }
            }

        } catch (err: any) {
            console.log(err);
        }
    }

    return listContext;
}

export async function getRawSchema(schemaHash: string) {
    const schema = await Schema.findOne({"@hash": schemaHash});
    if (!schema) {
        throw("SchemaHash not exist!");
    }
    if (schema["@type"] == SchemaType.context) {
        throw("Invalid schemaHash!");
    }

    const schemaRaw: any = schema;

    const schema2: any = {};

    const listContext = await getSubContext(schema);

    const keys = Object.keys(schemaRaw);
    console.log(keys)
    keys.forEach(key => {
        if (key[0] ==  '_' || key[0] == '$' || key == "@context" || key == "@required") {
            return;
        } 
        schema2[key] = schemaRaw[key];
    })

    schema2["@context"] = listContext;
    schema2["@required"] = schema["@required"];

    return schema2;
}
