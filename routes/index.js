import { Router } from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';

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

router.route('/users')
  .post((req, res) => {
    // POST /users => UsersController.postNew
    UsersController.postNew(req, res);
  });

router.route('/files').post((req, res) => {
  // POST /files => FilesController.postUpload
  FilesController.postUpload(req, res);
});

router.route('/connect')
  .get((req, res) => {
    // GET /connect => AuthController.getConnect
    AuthController.getConnect(req, res);
  });

router.route('/disconnect')
  .get((req, res) => {
    // GET /disconnect => AuthController.getDisconnect
    AuthController.getDisconnect(req, res);
  });

router.route('/users/me')
  .get((req, res) => {
    // GET /users/me => UserController.getMe
    UsersController.getMe(req, res);
  });

export default router;
