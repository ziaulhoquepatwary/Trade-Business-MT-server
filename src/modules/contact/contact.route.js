import express from "express";
import { contactEmail } from "./contact.controller.js";

const router = express.Router();

router.post('/', contactEmail)

export default router;