import express from 'express';
import { getAllServices, getServiceBySlug, getServiceCategories } from './services.controller.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/categories', getServiceCategories);
router.get('/:slug', getServiceBySlug);

export default router;