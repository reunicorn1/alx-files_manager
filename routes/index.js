import { Router } from 'express';
import { getUserBase, getUserX, getFile } from '../middlewares/authMiddleware';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';

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

// Middlware related routes ---------------------------------------

// POST /files => FilesController.postUpload
router.post('/files', getUserX, FilesController.postUpload);

// GET /connect => AuthController.getConnect
router.get('/connect', getUserBase, AuthController.getConnect);

// GET /disconnect => AuthController.getDisconnect
router.get('/disconnect', getUserX, AuthController.getDisconnect);

// GET /users/me => UserController.getMe~
router.get('/users/me', getUserX, UsersController.getMe);

// GET /files/:id => FilesController.getShow
router.get('/files/:id', getUserX, getFile, FilesController.getShow);

// GET /files => FilesController.getIndex
router.get('/files', getUserX, FilesController.getIndex);

// PUT /files/:id/publish => FilesController.putPublish
router.put('/files/:id/publish', getUserX, getFile, FilesController.putPublish);

// PUT /files/:id/publish => FilesController.putUnpublish
router.put('/files/:id/unpublish', getUserX, getFile, FilesController.putUnpublish);

export default router;
