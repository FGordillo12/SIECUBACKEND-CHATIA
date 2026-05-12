import express from 'express';
import { 
  obtenerNotificaciones, 
  marcarLeida, 
  borrarTodas 
} from '../controllers/productos/notificacionesControllers.js';

export const routerNotificaciones = express.Router();

// Obtener notificaciones no leídas
routerNotificaciones.get('/get-notificaciones', obtenerNotificaciones);

// Marcar una como leída 
routerNotificaciones.patch('/notificaciones/:id', marcarLeida);

// Todas leidas
routerNotificaciones.delete('/notificaciones-todas', borrarTodas);