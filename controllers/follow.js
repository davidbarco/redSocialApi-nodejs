const Follow = require('../models/follow'); // Asegúrate de que la ruta al modelo sea correcta
const User = require('../models/user'); // Asegúrate de que la ruta al modelo sea correcta

const followService = require('../services/followService');


// Método para guardar un nuevo seguimiento
const save = async (req, res) => {
  const userId = req.user.id; // ID del usuario que sigue (obtenido del token)
  const { followed } = req.body; // ID del usuario a seguir

  try {
    // Verificar que el usuario a seguir exista
    const followedUser = await User.findById(followed);
    if (!followedUser) {
      return res.status(404).json({
        message: 'El usuario que intentas seguir no existe.',
      });
    }

    // Verificar que el usuario no se siga a sí mismo
    if (userId === followed) {
      return res.status(400).json({
        message: 'No puedes seguirte a ti mismo.',
      });
    }

    // Verificar si ya existe el seguimiento
    const existingFollow = await Follow.findOne({ user: userId, followed });
    if (existingFollow) {
      return res.status(400).json({
        message: 'Ya sigues a este usuario.',
      });
    }

    // Crear y guardar el nuevo seguimiento
    const follow = new Follow({
      user: userId,
      followed: followed,
      created_at: Date.now()
    });

    await follow.save();

    res.status(200).json({
      message: 'Seguimiento guardado correctamente.',
      follow
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error en el servidor.',
      error: err.message,
    });
  }
};

const unfollow = async (req, res) => {
    const userId = req.user.id; // ID del usuario que deja de seguir (obtenido del token)
    const { followed } = req.body; // ID del usuario al que se deja de seguir
  
    try {
      // Verificar si el seguimiento existe
      const follow = await Follow.findOne({ user: userId, followed });
  
      if (!follow) {
        return res.status(404).json({
          message: 'No sigues a este usuario.',
        });
      }
  
      // Eliminar la relación de seguimiento
      await Follow.findByIdAndDelete(follow._id);
  
      res.status(200).json({
        message: 'Has dejado de seguir al usuario correctamente.',
      });
    } catch (err) {
      res.status(500).json({
        message: 'Error en el servidor.',
        error: err.message,
      });
    }
  };

  //listado de usuarios que estoy siguiendo
  const following = async (req, res) => {
    
    const userId = req.params.id; // Obtén el ID del usuario desde los parámetros de la ruta
    
    try {

        // Busca todos los documentos donde el usuario especificado sigue a otros
        const follows = await Follow.find({ user: userId }).populate('followed', 'name surname'); // Ajusta los campos que necesitas

        // Extrae los usuarios seguidos de los resultados
        const followingUsers = follows.map(follow => follow.followed);

        let seguidoresEnComun = await followService.getFollowersWithRelation(req.user.id, userId)
        
        // Retorna la lista de usuarios seguidos
        return res.status(200).json({
            success: true,
            //mensaje: `${req.user.name} ${req.user.surname} sigue a`,
            following: followingUsers,
            seguidoresEnComun: seguidoresEnComun
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los usuarios que sigue.',
            error,
        });
    }
};  

//listado de usuarios que me siguen
const followers = async (req, res) => {
  
  const userId = req.params.id; // ID del usuario cuyo seguidores quieres obtener

  try {
    // Encuentra los registros donde el campo 'followed' es el usuario especificado
    const followRecords = await Follow.find({ followed: userId }).populate('user', 'name surname'); // Asegúrate de que 'name' y 'surname' son los campos correctos en tu modelo de User

    // Extrae los detalles de los seguidores
    const followersUsers = followRecords.map(follow => follow.user);

    return res.status(200).json({
      success: true,
      followers: followersUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los seguidores', error });
  }

}



module.exports = {
    save,
    unfollow,
    following,
    followers

}