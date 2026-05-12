import mongoose from 'mongoose';

export const connectionDb = async () => {
  try {
    const connectDb = await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log(
      'Connection established',
      '\nnombre DB:',connectDb.connection.name,
    )

  } catch (err) {
    console.log('Fallo en la conexion: ' + err);
  };
};

