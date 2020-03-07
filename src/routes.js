import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import FileController from './app/controllers/FileController';
import DelivermanController from './app/controllers/DelivermanController';
import DeliveryController from './app/controllers/DeliveryController';
import WithDrawController from './app/controllers/WithDrawController';
import OrderController from './app/controllers/OrderController';
import DeliveriesController from './app/controllers/DeliveriesController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.post('/users', UserController.store);
routes.put('/users', UserController.update);

routes.post('/recipients', RecipientController.store);
routes.get('/recipients', RecipientController.index);
routes.get('/recipients/:id', RecipientController.index);
routes.put('/recipients/:id', RecipientController.update);
routes.delete('/recipients/:id', RecipientController.delete);

routes.post('/files', upload.single('file'), FileController.store);

routes.get('/delivermans', DelivermanController.index);
routes.get('/delivermans/:id', DelivermanController.show);
routes.post('/delivermans', DelivermanController.store);
routes.put('/delivermans/:id', DelivermanController.update);
routes.delete('/delivermans/:id', DelivermanController.delete);

routes.get('/deliveries', DeliveryController.index);
routes.get('/deliveries/:id', DeliveryController.show);

routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:id', DeliveryController.update);
routes.delete('/deliveries/:id', DeliveryController.delete);

routes.put(
  '/orders/deliveryman/:idDman/withdraw/:idOrder',
  WithDrawController.update
);

routes.put(
  '/orders/deliveryman/:idDman/delivered/:idOrder',
  upload.single('file'),
  OrderController.update
);

routes.get('/deliveryman/:id/list', OrderController.index);

routes.get('/deliveryman/:id/deliveries', DeliveriesController.index);

routes.get('/delivery/problems', DeliveryProblemController.index);
routes.get('/delivery/:id/problems', DeliveryProblemController.show);
routes.post('/delivery/:id/problems', DeliveryProblemController.store);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

export default routes;
