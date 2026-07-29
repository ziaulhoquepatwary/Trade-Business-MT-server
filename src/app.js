import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";

const createApp = (auth) => {
    const app = express();

    app.use(cors({
        origin: [
            process.env.FRONTEND_URL,
            "http://localhost:3000",
        ].filter(Boolean),
        credentials: true
    }));

    app.use(cookieParser());
    app.use(express.json());

    app.all("/api/auth/*splat", toNodeHandler(auth));

    app.get("/", (req, res) => {
        res.send("M traders server is running successfully");
    });

    return app;
}

export default createApp;