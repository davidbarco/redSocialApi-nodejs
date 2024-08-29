const jwt = require('jwt-simple');
const moment = require('moment');

const secretKey = 'your_secret_key'; // Cambia esto por una clave secreta fuerte y almacénala en una variable de entorno

// Función para crear un token
const createToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    nick: user.nick,
    email: user.email,
    role: user.role,
    imagen: user.imagen,
    iat: moment().unix(), // Fecha de creación del token (issued at)
    exp: moment().add(30, 'days').unix() // Fecha de expiración del token (30 dias)
  };

  return jwt.encode(payload, secretKey);
};

// Función para decodificar un token
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token, secretKey);
    if (decoded.exp <= moment().unix()) {
      throw new Error('Token expirado');
    }
    return decoded;
  } catch (err) {
    throw new Error('Token inválido');
  }
};

module.exports = {
  createToken,
  decodeToken,
};
