import express from 'express';
import { loginUser, verificarCuenta } from '../controllers/userController.js';
import { verifyToken } from '../middleware/getToken.js';
import { registrarUsuario } from '../controllers/usuarios/registrarUsuario.js';
import { googleLogin } from '../controllers/usuarios/registrarUsuariosGoogle.js';
export const routerUsuarios = express.Router();

routerUsuarios.post('/registro', registrarUsuario);

routerUsuarios.post('/login', loginUser);

routerUsuarios.post('/validacion', verificarCuenta);

routerUsuarios.get('/verify-token', verifyToken);

routerUsuarios.post('/auth/google', googleLogin);