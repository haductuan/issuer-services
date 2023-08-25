import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { RegistriesController } from "../controllers/RegistriesController.js";

export class RegistriesRoutes {
    public router: Router;
    public authenController = new AuthenController();
    public registriesController = new RegistriesController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("", this.registriesController.registerNewSchemaRegistry);
        this.router.get("", this.registriesController.findSchemaRegistry);
        this.router.put("/:registryId", this.registriesController.updateRegistrySchema);
        this.router.put("/:registryId/activate", this.registriesController.changeStatusSchemaRegistry);
        this.router.post("/requirements", this.registriesController.checkProofRequirement);
        this.router.get("/:registryId", this.registriesController.getRegistryById);
        this.router.get("/:registryId/challenge", this.registriesController.generateChallengeForProof);
    }
}