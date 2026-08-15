import express from "express";
import { capturePayPalPayment, createPaymentSession } from "./order.controller.js";

const router = express.Router();

router.post("/create-payment", createPaymentSession);
router.post("/capture-paypal", capturePayPalPayment);

export default router;