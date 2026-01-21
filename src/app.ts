import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares";

const app = express();

// 1) CORS first
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 2) Body parsers before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3) Routes
app.use("/api/auth", toNodeHandler(auth));
app.use("/api", routes);

// 4) 404 handler AFTER routes
app.use(notFoundHandler);

// 5) Error handler LAST
app.use(errorHandler);

export default app;
