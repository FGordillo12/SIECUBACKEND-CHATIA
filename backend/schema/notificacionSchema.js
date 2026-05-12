
import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
    mensaje: { type: String, required: true },
    tipo: { type: String, required: true },
    leido: { type: Boolean, default: false }, 
    fecha: { type: Date, default: Date.now }
});


const Notificacion = mongoose.model('Notificacion', notificacionSchema, 'notificaciones');

export default Notificacion;