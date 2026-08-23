import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import portfolioRoute from "./modules/portfolio/portfolio.route.js";
import ServiceRoute from "./modules/services/service.routes.js";
import ContactRoute from "./modules/contact/contact.route.js";
import QuotationRoute from "./modules/quotation/quotation.route.js";
import ReviewRoutes from "./modules/reviews/review.route.js";
import OrderRoute from "./modules/order/order.route.js";
import GatewayRoute from "./modules/gateway/gateway.route.js";
import { keepServerAlive } from "./keepAlive.js";

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
    app.use("/api/portfolios", portfolioRoute);
    app.use("/api/services", ServiceRoute);
    app.use("/api/contact", ContactRoute);
    app.use("/api/quotation", QuotationRoute);
    app.use("/api/reviews", ReviewRoutes);
    app.use("/api/orders", OrderRoute);
    app.use("/api/gateways", GatewayRoute);

    app.get("/", (req, res) => {
        res.send("M traders server is running successfully");
    });

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    keepServerAlive(backendUrl);

    return app;
}

export default createApp;