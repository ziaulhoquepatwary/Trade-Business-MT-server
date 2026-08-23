import express from "express";
import { createGateway, getAllGateways, updateGateway } from "./gateway.controller.js";

const router = express.Router();

router.post("/", createGateway);
router.get("/", getAllGateways);
router.patch("/:id", updateGateway);

export default router;