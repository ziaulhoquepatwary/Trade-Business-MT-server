import express from "express";
import { getHomeTopReviews } from "./review.controller.js";


const router = express.Router();

router.get("/home-reviews", getHomeTopReviews)

export default router;