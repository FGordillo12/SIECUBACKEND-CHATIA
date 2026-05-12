import express from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Importaciones de Rutas 
import { connectionDb } from './db/connection.js';
import { routerNotificaciones } from './backend/router/notificacionesRouter.js';
import { routerUsuarios } from './backend/router/userRoutes.js'; 
import { routerProductos } from './backend/router/productRoutes.js';
import { routerChat } from './backend/router/chatRoutes.js';

const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'https://cdisfruta.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // PATCH habilitado para el "chulooo"
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};  

const app = express();
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Registro de Rutas con prefijo /api
app.use('/api', routerUsuarios);
app.use('/api', routerProductos);
app.use('/api', routerNotificaciones);
app.use('/api', routerChat);

app.get('/', (req, res) => {
  res.send("El servidor de Cdisfruta está funcionando");
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.status(200).json({ message: 'Sesión cerrada' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectionDb(); 
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
  }
};

startServer();

export default app;