import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res) => {
  const token = req.cookies.access_token 
    || req.headers.authorization?.split(' ')[1]; // 👈 agrega esto

  if (!token) {
    return res.status(403).json({ valid: false, message: 'No token provided' });
  }

  try {
    const data = jwt.verify(token, process.env.JWT_TOKEN);
    return res.status(200).json({ valid: true, user: data, message: 'Token válido' });
  } catch (error) {
    return res.status(403).json({ valid: false, message: 'ACCESS NOT AUTHORIZED' });
  }
};
