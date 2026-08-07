import express from "express";
import { getPortfolios } from "./portfolio.controller.js";


const router = express.Router();

router.get('/', getPortfolios);


export default router;