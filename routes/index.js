import { Router } from 'express';
import { getUserBase, getUserX } from '../middlewares/authMiddleware.js';
import AppController from '../controllers/AppController.js';
import AuthController from '../controllers/AuthController.js';
import UsersController from '../controllers/UsersController.js';
import FilesController from '../controllers/FilesController.js';

const router = Router();

// GET /status => AppController.getStatus
router.route('/status')
  .get((req, res) => {
    AppController.getStatus(req, res);
  });
// GET /stats => AppController.getStats
router.route('/stats')
  .get((req, res) => {
    AppController.getStats(req, res);
  });
// POST /users => UsersController.postNew
router.route('/users')
  .post((req, res) => {
    UsersController.postNew(req, res);
  });
// POST /files => FilesController.postUpload
router.post('/files', getUserX, FilesController.postUpload);

// Middlware related routes
// GET /connect => AuthController.getConnect
router.get('/connect', getUserBase, AuthController.getConnect);
// GET /disconnect => AuthController.getDisconnect
router.get('/disconnect', getUserX, AuthController.getDisconnect);
// GET /users/me => UserController.getMe~
router.get('/users/me', getUserX, UsersController.getMe);
export default router;
