import express from "express";
import { sendQuotationEmail } from "./quotation.controller.js";

const router = express.Router();

router.post('/', sendQuotationEmail)

export default router;