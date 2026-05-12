import express from 'express';
subirImg
import { 
  registerProducts, 
  getProducts, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productos/productosControllers.js'
import { subirImg } from '../middleware/subirImg.js';

export const routerProductos = express.Router();


routerProductos.get('/get-productos', getProducts); // Obtener todos
routerProductos.post('/registro-productos',subirImg, registerProducts); // Crear
routerProductos.put('/productos/:id',subirImg, updateProduct); // Actualizar
routerProductos.delete('/productos/:id', deleteProduct); // Eliminar