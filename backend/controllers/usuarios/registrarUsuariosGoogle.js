import User from '../../schema/userSchema.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // Esto permite la comunicación con el flujo de React
);

export const googleLogin = async (req, res) => {
  const { code } = req.body;

  try {

    const { tokens } = await client.getToken(code);

    // 3. VALIDACIÓN: Ahora sí usamos el id_token que nos dio Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, sub: googleId } = ticket.getPayload();

    // LÓGICA DE MONGODB
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        nombre: name,
        email: email,
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
        verificado: true,
        rol: 'user'
      });
      await user.save();
    }

    // GENERAR TU JWT PROPIO
    const token = jwt.sign({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    }, process.env.JWT_TOKEN, {
      expiresIn: '1h'
    });

    // SETEAR COOKIE Y RESPONDER
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

  } catch (error) {
    console.error('Error Google Login:', error);
    res.status(400).json({
      status: 'error',
      message: 'Error de autenticación con Google'
    });
  }
};