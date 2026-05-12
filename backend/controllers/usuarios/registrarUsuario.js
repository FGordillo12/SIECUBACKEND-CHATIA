import { validateRegisterUser } from '../../schemaValidations/validateString.js';
import { enviarCorreoVerificacion } from '../../middleware/validarEmail.js';
import bcrypt from 'bcrypt';
import User from '../../schema/userSchema.js';
import jwt from 'jsonwebtoken';

const generarTokenVerificacion = () => {
  // Genera un número entre 100,000 y 999,999
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registrarUsuario = async (req, res) => {
  const validar = validateRegisterUser(req.body);

  if (validar.error) {
    return res.status(400).json({
      status: 'error',
      error: JSON.parse(validar.error.message)
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(validar.data.password, 10);
    
    // Generamos el código de 6 dígitos
    const codigoSeisDigitos = generarTokenVerificacion();

    const newUser = {
      nombre: validar.data.name,
      email: validar.data.email,
      password: hashedPassword,
      verificado: false,
      codigo_verificacion: codigoSeisDigitos // Guardamos los 6 dígitos
    };

    const statusMessage = await createUser(newUser);

    try {
      // Enviamos el código por correo
      await enviarCorreoVerificacion(newUser, codigoSeisDigitos);
    } catch (emailError) {
      // Rollback: Si no se puede enviar el correo, eliminamos al usuario
      await User.deleteOne({ email: newUser.email });
      throw new Error('Error enviando correo de verificación. Inténtalo de nuevo.');
    }

    res.status(201).json({
      status: 'success',
      message: statusMessage,
      user: { name: newUser.nombre, email: newUser.email }
    });

  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
const createUser = async (user) => {
  const findUser = await User.findOne({ email: user.email });
  if (findUser) {
    throw new Error('ERROR: CORREO YA REGISTRADO!');
  }
  const create = await User.create(user);
  if (create) {
    return 'USUARIO REGISTRADO EXITOSAMENTE';
  }
};
