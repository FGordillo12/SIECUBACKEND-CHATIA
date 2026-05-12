import { validateLoginUser, validateRegisterUser } from '../schemaValidations/validateString.js';
import { enviarCorreoVerificacion } from '../middleware/validarEmail.js';
import bcrypt from 'bcrypt';
import User from '../schema/userSchema.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Todos los campos deben ser llenados'
    });
  }
  validateLogin(req, res);
};

const validateLogin = async (req, res) => {
  const validate = validateLoginUser(req.body);
  if (validate.error) {
    return res.status(400).json({
      status: 'error',
      message: 'Usuario o Contraseña Incorrecta'
    });
  }
  const { email, password } = validate.data;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'EMAIL NO REGISTRADO'
    });
  }
  if (!user.verificado) {
    return res.status(403).json({
      status: 'error',
      message: 'Debes verificar tu cuenta antes de iniciar sesión.'
    });
  }
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(404).json({
      status: 'error',
      message: 'Contraseña incorrecta'
    });
  }
  // Token y validacion con cookies
  const token = jwt.sign({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol
  }, process.env.JWT_TOKEN,
    {
      expiresIn: '1h'
    });

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  })
    .status(200).json({
      status: 'success',
      message: 'Ingreso Exitoso',
      rol: user.rol,
      token  // 👈 agrega esto
    });
};

export const verificarCuenta = async (req, res) => {
  const { email, codigo } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        mensaje: 'Usuario no encontrado.'
      });
    }

    if (user.verificado) {
      return res.status(400).json({
        status: 'error',
        mensaje: 'Esta cuenta ya ha sido verificada anteriormente.'
      });
    }

    if (codigo !== user.codigo_verificacion) {
      return res.status(400).json({
        status: 'error',
        mensaje: 'El código de verificación es incorrecto.'
      });
    }

    user.verificado = true;
    user.codigo_verificacion = null;
    await user.save();

    return res.status(200).json({
      status: 'success',
      mensaje: '¡Cuenta verificada correctamente! Ya puedes iniciar sesión.'
    });

  } catch (err) {
    console.error('Error en verificación:', err);
    return res.status(500).json({
      status: 'error',
      mensaje: 'Hubo un problema en el servidor al verificar la cuenta.'
    });
  }
};

