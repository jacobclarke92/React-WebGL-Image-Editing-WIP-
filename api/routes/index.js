import express from 'express'

import { login } from './auth'

const router = express.Router();

/*
 * Routes that can be accessed by any one
 */
router.post('/login', login);

/*
 * Routes that can be accessed only by autheticated users
 */
// router.get('/api/v1/products', products.getAll);
// router.get('/api/v1/product/:id', products.getOne);
// router.post('/api/v1/product/', products.create);
// router.put('/api/v1/product/:id', products.update);
// router.delete('/api/v1/product/:id', products.delete);
 
/*
 * Routes that can be accessed only by authenticated & authorized users
 */
// router.get('/api/v1/admin/users', user.getAll);
// router.get('/api/v1/admin/user/:id', user.getOne);
// router.post('/api/v1/admin/user/', user.create);
// router.put('/api/v1/admin/user/:id', user.update);
// router.delete('/api/v1/admin/user/:id', user.delete);

export default router;