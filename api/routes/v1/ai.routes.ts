import { Router } from "express";
import { ping, summarize } from "../../controllers/ai.controller.js";
import {
  validateGeminiAPIKey,
  validateInputs,
} from "@/api/middlewares/ai.middleware";

const router = Router();

// routes
router.get("/ping", ping);
router.post("/summarize", [validateGeminiAPIKey, validateInputs], summarize);

export default router;
