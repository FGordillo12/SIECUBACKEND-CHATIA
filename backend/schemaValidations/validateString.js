import { z } from 'zod';

const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[.!@#$%^&*])[\S]{8,16}$/;
const regexNombre = /^[a-zA-Z\s]+$/;

const userSchema = z.object({
  name: z.string()
    .min(6, { message: 'error1' })
    .regex(regexNombre, 'error1'),
  email: z.string().email({
    message: 'error2'
  }),

  password: z.string().regex(regex, { message: 'error3' })

});

export function validateRegisterUser (input) {
  return userSchema.safeParse(input);
};

export function validateLoginUser (input) {
  return userSchema.partial().safeParse(input);
}
