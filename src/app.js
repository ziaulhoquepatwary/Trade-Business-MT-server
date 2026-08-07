import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import portfolioRoute from "./modules/portfolio/portfolio.route.js"

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
    app.use("/api/portfolios", portfolioRoute)

    app.get("/", (req, res) => {
        res.send("M traders server is running successfully");
    });

    return app;
}

export default createApp;