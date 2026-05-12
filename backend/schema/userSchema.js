import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  rol: {
    type: String,
    enum: ["admin", "user"], 
    default: "user"
  },

  resetPasswordToken: {
    type: String,
    default: null
  },

  resetPasswordExpires: {
    type: Date,
    default: null
  },

  verificado: {
    type: Boolean,
    default: false
  },
  codigo_verificacion: String
});

export default mongoose.model('User', userSchema);
