const jwt = require('../services/jwt');

const ensureAuth = (req, res, next) => {
  // Obtener el token de los encabezados de la solicitud
  let token = req.header('Authorization');
  
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No token provided.' });
  }

  // Limpiar comillas simples y dobles del token
  token = token.replace(/['"]+/g, '');

  try {
    // Decodificar y verificar el token
    const decoded = jwt.decodeToken(token);
    // Adjuntar la información del usuario decodificado a la solicitud
    req.user = decoded;
    // Continuar con el siguiente middleware o la ruta
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

module.exports = ensureAuth;
