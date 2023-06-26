import type { Express, NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { buildErrorMessage } from '../common/APIBuilderResponse.js';
import { IMAGE_MAX_SIZE, IMAGE_TYPES } from '../common/config/constant.js';
import { MULTER_STORAGE_DEST } from '../common/config/secrets.js';
import { ExceptionMessage } from '../common/enum/ExceptionMessages.js';
import fs from "fs-extra";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;

export class UploadMiddleWare {

    public uploadPublic(req: Request, res: Response, next: NextFunction): any {
        try {
            const storagePath = `${MULTER_STORAGE_DEST}/public`;
            if (!fs.existsSync(storagePath)) {
                fs.mkdirSync(storagePath, { recursive: true });
            }

            const fileStorage = multer.diskStorage({
                destination: (
                    req: Request,
                    file: Express.Multer.File,
                    cb: DestinationCallback
                ): void => {
                    cb(null, storagePath);
                },
                filename: (
                    req: Request,
                    file: Express.Multer.File,
                    cb: FilenameCallback
                ): void => {
                    const portal = file.fieldname.slice(0, -4);
                    cb(null, portal+'-'+uuid()+path.extname(file.originalname));
                }
            });
        
            const fileFilter = (
                req: Request,
                file: Express.Multer.File,
                cb: FileFilterCallback
            ): void => {
                // Allowed ext
                const filetypes = IMAGE_TYPES;
                // Check ext
                const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
                // Check mime
                const mimetype = filetypes.test(file.mimetype);
    
                if (!(mimetype && extname)) cb(new Error('Invalid upload file type'));
    
                // Allowed size
                const limit = IMAGE_MAX_SIZE;
                // Check size
                if (file.size > limit) cb(new Error('Upload file size too big'));
    
                cb(null, true);
            }
            return multer({ storage: fileStorage, fileFilter: fileFilter }).fields([
                { name: 'fileUpload' }
            ])(req, res, next);
        } catch (err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}

export type UploadedFile = {
    [fieldname: string]: Express.Multer.File[]
}