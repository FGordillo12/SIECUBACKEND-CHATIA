
import Notificacion from '../../schema/notificacionSchema.js'; 

export const obtenerNotificaciones = async (req, res) => {
    try {
        const notificaciones = await Notificacion.find({ leido: false }).sort({ fecha: -1 });
        res.status(200).json(notificaciones);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener notificaciones", error });
    }
};

export const marcarLeida = async (req, res) => {
    const { id } = req.params;
    try {
        await Notificacion.findByIdAndUpdate(id, { leido: true });
        res.status(200).json({ message: "Notificación marcada como leída" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar notificación", error });
    }
};

export const borrarTodas = async (req, res) => {
    try {
        await Notificacion.updateMany({ leido: false }, { leido: true });
        res.status(200).json({ message: "Todas marcadas como leídas" });
    } catch (error) {
        res.status(500).json({ message: "Error al borrar notificaciones", error });
    }
};