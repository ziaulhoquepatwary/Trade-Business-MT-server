import express from "express";
import { createPaymentSession } from "./order.controller.js";

const router = express.Router();

router.post("/create-payment", createPaymentSession);

export default router;