import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";

export class AthenRoutes {
    public router: Router;
    public authenController = new AuthenController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("/login/:issuerId", this.authenController.authentication);
        this.router.post("/verify-token/:issuerId", this.authenController.verifyToken);
        this.router.get("/proof/:claimId", this.authenController.generateProofInput);
    }
}