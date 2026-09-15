import { Router } from "express";
import aiRoute from "./v1/ai.routes.js";

const router = Router();

// set routes under `ai`
router.use("/ai", aiRoute);
// add new v1 routes here

export default router;
