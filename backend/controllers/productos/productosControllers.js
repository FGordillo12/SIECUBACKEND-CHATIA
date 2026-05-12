import Producto from '../../schema/productsSchema.js'
import Notificacion from '../../schema/notificacionSchema.js';

// Obtener todos los productos
export const getProducts = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true });
    if (!productos || productos.length === 0) {
      return res.status(404).json({ message: "No hay productos registrados" });
    }
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// Crear producto
export const registerProducts = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, stock } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ninguna imagen" });
    }

    const imagenUrl = req.file.path;

    const newProduct = {
      nombre,
      descripcion,
      precio: Number(precio), 
      categoria,
      stock: Number(stock),
      imagen: req.file.path
    };

    const createProduct = await Producto.create(newProduct);
    
    if (createProduct) {
      // NOTIFICACIÓN DE CREACIÓN
      await Notificacion.create({ 
        mensaje: `Se añadió el producto: ${nombre}`,
        tipo: 'creacion'
      });

      res.status(201).json({
        status: 'success',
        message: 'Producto Creado',
        product: createProduct 
      });
    }
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, stock } = req.body;

    let imagenActualizada = req.body.imagen; 
    if (req.file) {
      imagenActualizada = req.file.path; 
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      { nombre, descripcion, precio, categoria, stock, imagen: imagenActualizada },
      { new: true } 
    );

    if (!productoActualizado) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }

    // USAMOS productoActualizado.nombre PARA EVITAR ERRORES DE VARIABLE
    await Notificacion.create({ 
      mensaje: `Se actualizó el producto: ${productoActualizado.nombre}`,
      tipo: 'edicion',
      leido: false
    });

    res.status(200).json({
      status: 'success',
      message: 'Producto actualizado con éxito',
      product: productoActualizado
    });

  } catch (error) {
    // Si ves este error en la consola, es porque la DB rechazó la notificación
    console.error("Error al crear notificación:", error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Eliminar producto 
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero buscamos el producto para obtener el nombre antes de borrarlo
    const productoABorrar = await Producto.findById(id);
    const nombreProducto = productoABorrar ? productoABorrar.nombre : "Desconocido";

    const productoEliminado = await Producto.findByIdAndDelete(id);

    if (!productoEliminado) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }

    // NOTIFICACIÓN DE ELIMINACIÓN
    await Notificacion.create({ 
      mensaje: `Se eliminó el producto: ${nombreProducto}`,
      tipo: 'eliminacion'
    });

    res.status(200).json({
      status: 'success',
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};