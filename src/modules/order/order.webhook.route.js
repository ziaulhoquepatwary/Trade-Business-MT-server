import express from "express";
import { handleStripeWebhook, handleAntomWebhook } from "./order.webhook.controller.js";

const router = express.Router();

// Stripe needs raw body buffer for signature validation
router.post(
    "/stripe",
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);

// Antom uses normal JSON parsing
router.post(
    "/antom",
    express.json(),
    handleAntomWebhook
);

export default router;