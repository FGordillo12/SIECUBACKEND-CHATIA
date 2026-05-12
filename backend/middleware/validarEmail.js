import crypto from 'crypto';
import nodemailer from 'nodemailer';
import 'dotenv/config';

export const enviarCorreoVerificacion = async (usuario, codigo) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: `"SIECU - Plataforma CDISFRUTA" <${process.env.EMAIL_USER}>`,
    to: usuario.email,
    subject: `${codigo} es tu código de verificación - SIECU`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; padding: 40px 10px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          
          <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px;">Bienvenido a <span style="color: #007bff;">SIECU</span></h1>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: left;">
            Hola <strong>${usuario.nombre || 'Usuario'}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: left;">
            Gracias por registrarte en la plataforma gestionada por <strong>CDISFRUTA</strong>. Para completar tu registro, por favor ingresa el siguiente código de verificación:
          </p>

          <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
              ${codigo}
            </span>
          </div>

          <p style="color: #888; font-size: 14px; margin-top: 25px;">
            Este código es válido por tiempo limitado. Si no solicitaste este registro, puedes ignorar este correo con total seguridad.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0 20px 0;">
          
          <p style="color: #aaa; font-size: 12px;">
            &copy; ${new Date().getFullYear()} CDISFRUTA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};