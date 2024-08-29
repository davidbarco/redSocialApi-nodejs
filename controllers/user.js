

const User = require('../models/user'); // Asegúrate de que la ruta al modelo sea correcta
const bcrypt = require('bcrypt'); // Para encriptar la contraseña, si es necesario
const validator = require('validator');
const jwt = require('../services/jwt'); // Importa tu archivo jwt.js
const fs = require('fs');
const path = require('path');


// Método para registrar un usuario
const register = async (req, res) => {
    const { name, surname, nick, email, password, bio } = req.body;
  
    // Validaciones usando la librería validator
    if (!name || !validator.isAlpha(name)) {
      return res.status(400).json({ message: 'El nombre es requerido y debe contener solo letras.' });
    }
    if (!nick || !validator.isAlphanumeric(nick)) {
      return res.status(400).json({ message: 'El nick es requerido y debe ser alfanumérico.' });
    }
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'El email es requerido y debe ser un correo electrónico válido.' });
    }
    if (!password || !validator.isLength(password, { min: 6 })) {
      return res.status(400).json({ message: 'La contraseña es requerida y debe tener al menos 6 caracteres.' });
    }
    
  
    try {
      let user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { nick: nick.toLowerCase() }] });
      if (user) {
        return res.status(400).json({ message: 'El usuario ya existe.' });
      }
  
      // Encriptar la contraseña con bcrypt
      const saltRounds = 10; // Número de saltos para generar el hash
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      user = new User({
        name,
        surname,
        nick,
        email,
        bio,
        password: hashedPassword, // Guardar la contraseña encriptada
      });

      await user.save();
  
      res.status(201).json({
        message: 'Usuario registrado correctamente.',
        user,
      });
     
    } catch (err) {
      res.status(500).json({
        message: 'Error en el servidor.',
        error: err.message,
      });
    }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  // Validaciones usando la librería validator
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: 'Datos invalidos email' });
  }
  if (!password || !validator.isLength(password, { min: 6 })) {
    return res.status(400).json({ message: 'Datos invalidados password' });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Comparar la contraseña ingresada con la almacenada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta.' });
    }

    // Generar el token usando la función del archivo jwt.js
    const token = jwt.createToken(user);

    user = user.toObject();
    delete user.password;

    res.status(200).json({ 
      message: 'Inicio de sesión exitoso.',
      token,
      user
       
    });


  } catch (err) {
    res.status(500).json({
      message: 'Error en el servidor.',
      error: err.message,
    });
  }
};

const profile = async (req, res) => {
  try {
    // Obtener el ID del usuario del objeto `req.user`, que fue añadido por el middleware `ensureAuth`
    const userId = req.params.id;
    
    // Buscar el usuario en la base de datos por ID
    const user = await User.findById(userId).select('-password'); // Excluye el campo `password` en la respuesta

    // Verificar si el usuario fue encontrado
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Devolver el perfil del usuario
    res.status(200).json({
      message: 'Perfil del usuario.',
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error en el servidor.',
      error: err.message,
    });
  }
};

const list = async (req, res) => {
  
  // Obtener los parámetros de paginación de la ruta
  const page = parseInt(req.params.page) || 1; // Página actual, predeterminado a 1
  const limit = parseInt(req.params.limit) || 3; // Número de resultados por página, predeterminado a 10

  try {
    // Configurar las opciones de paginación
    const options = {
      page: page,
      limit: limit,
      select: '-password' // Excluye el campo `password` en la respuesta
    };

    // Realizar la consulta paginada
    const result = await User.paginate({}, options);
    console.log(result)

    // Enviar la respuesta con los usuarios y la información de paginación
    res.status(200).json({
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalUsers: result.totalDocs,
      users: result.docs
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error en el servidor.',
      error: err.message,
    });
  }
};

// Método para actualizar el usuario
const update = async (req, res) => {
  const userId = req.user.id;

  const { name, surname, nick, email, password } = req.body;

  try {

    // Validar que los campos no estén vacíos
    if (!name || !surname || !nick || !email) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios y no pueden estar vacíos.',
      });
    }

    // Buscar el usuario por ID
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado.',
      });
    }

    // Si el email está siendo actualizado, verificar que no esté en uso por otro usuario
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email: email });
      if (emailExists) {
        return res.status(400).json({
          message: 'El email ya está en uso por otro usuario.',
        });
      }
      user.email = email;
    }

    // Validar y actualizar los campos
    if (name) user.name = name;
    if (surname) user.surname = surname;
    if (nick) user.nick = nick;
    if (email) user.email = email;

    // Si hay una nueva contraseña, encriptarla antes de guardar
    if (password) {
      if(validator.isLength(password, { min: 6 })){
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      }else{
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
      }
    }
    
    // Guardar los cambios
    await user.save();

    // Remover la contraseña del objeto user antes de enviarlo
    //user = user.toObject();
    //delete user.password;

    // Responder con el usuario actualizado
    res.status(200).json({
      message: 'Usuario actualizado correctamente.',
      user
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error en el servidor.',
      error: err.message,
    });
  }
};

const upload = async (req, res) => {
  try {
      let id = req.user.id;
      let datosActualizados = req.body;

     
      // Comprobar si se ha subido un archivo
      let imagen = req.file ? req.file.filename : null;
      if (imagen) {
          datosActualizados.image = imagen;
      }else{
          return res.status(404).json({
              status: "error",
              mensaje: "no hay file0"
          });
      }

      // Encontrar el usuario por ID y actualizarlo
      const userActualizado = await User.findByIdAndUpdate(id, datosActualizados, {
          new: true,  // Devuelve el documento actualizado
          runValidators: true // Ejecuta las validaciones definidas en el esquema
      });

      if (!userActualizado) {
          return res.status(404).json({
              status: "error",
              mensaje: "No se ha encontrado el usuario para actualizar"
          });
      }

      return res.status(200).json({
          status: "success",
          mensaje: "usuario actualizado con éxito",
          usuario: userActualizado
      });

  } catch (error) {
      return res.status(500).json({
          status: "error",
          mensaje: "Ha ocurrido un error al intentar actualizar el usuario",
          error: error.message
      });
  }
};

const imagen = async (req, res) => {
  let fichero = req.params.fichero;
  let ruta_fisica = "./uploads/avatars/"+fichero;

  fs.stat(ruta_fisica,(error, existe) =>{
      if(existe){
          return res.sendFile(path.resolve(ruta_fisica));
      }else{
          return res.status(404).json({
              status: "error",
              mensaje: "la imagen no existe",
              existe,
              fichero,
              ruta_fisica
          });
      }
  })

}

module.exports = {
    register,
    login,
    profile,
    list,
    update,
    upload,
    imagen
};
