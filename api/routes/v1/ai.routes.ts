import { Router } from "express";
import { ping, summarize } from "../../controllers/ai.controller";

const router = Router();

router.get("/ping", ping);
router.post("/summarize", summarize);

export default router;
