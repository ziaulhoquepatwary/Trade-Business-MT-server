import express from "express";
import { capturePaymentController, createPaymentSession } from "./order.controller.js";

const router = express.Router();

router.post("/create-payment", createPaymentSession);
router.post("/capture-payment", capturePaymentController);

export default router;