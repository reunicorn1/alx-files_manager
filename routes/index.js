/* eslint-disable jest/require-hook */
import { Router } from 'express';
import AppController from '../controllers/AppController';

const router = Router();

router.route('/status')
  .get((req, res) => {
    // GET /status => AppController.getStatus
    AppController.getStatus(req, res);
  });

router.route('/stats')
  .get((req, res) => {
    // GET /stats => AppController.getStats
    AppController.getStats(req, res);
  });

export default router;
