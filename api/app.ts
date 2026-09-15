import express, { Application } from "express";
import v1Routes from "./routes/v1.routes.js";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// set routes under `/api/v1`
app.use("/api/v1", v1Routes);

export default app;
