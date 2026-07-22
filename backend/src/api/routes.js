import express from 'express';
import { handleChat } from './controller.js';

const router = express.Router();

router.post('/chat', express.json(), handleChat);

export default router;
