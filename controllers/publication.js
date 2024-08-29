const Publication = require('../models/publication'); // Asegúrate de que la ruta al modelo sea correcta
const Follow = require('../models/follow'); // Asegúrate de que la ruta al modelo sea correcta

const fs = require('fs');
const path = require('path');

//guardar publicacion.
const save = async (req, res) => {
    try {
        const params = req.body; // Extrae los datos del cuerpo de la solicitud
        const userId = req.user.id; // Asumiendo que el ID del usuario viene en el token o en la sesión

        // Verifica que el texto esté presente
        if (!params.text) {
            return res.status(400).json({
                success: false,
                message: 'El campo de texto es obligatorio.',
            });
        }

        // Crea una nueva instancia de la publicación
        const newPublication = new Publication(params);
        newPublication.user = userId

        // Guarda la publicación en la base de datos
        const savedPublication = await newPublication.save();

        // Respuesta exitosa
        return res.status(201).json({
            success: true,
            message: 'Publicación guardada correctamente.',
            publication: savedPublication,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al guardar la publicación.',
            error: error.message,
        });
    }
};


//sacar una publicacion en concreto
const detail = async (req, res) => {
    try {
        const publicationId = req.params.id; // Obtén el ID de la publicación desde los parámetros de la ruta

        // Busca la publicación en la base de datos por su ID
        const publication = await Publication.findById(publicationId).populate('user', 'name username');

        // Si la publicación no existe, devuelve un error 404
        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada.',
            });
        }

        // Respuesta exitosa con la publicación encontrada
        return res.status(200).json({
            success: true,
            publication: publication,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la publicación.',
            error: error.message,
        });
    }
};

//eliminar publicacion
const deletePublication = async (req, res) => {
    try {
        const publicationId = req.params.id; // Obtén el ID de la publicación desde los parámetros de la ruta

        // Busca la publicación en la base de datos por su ID
        const publication = await Publication.findByIdAndDelete(publicationId);

        // Si la publicación no existe, devuelve un error 404
        if (!publication) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada.',
            });
        }

        // Respuesta exitosa con la publicación encontrada
        return res.status(200).json({
            success: true,
            publication: publication,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la publicación.',
            error: error.message,
        });
    }
}




//listar publicaciones de un usuario
const getUserPublications = async (req, res) => {
    try {
        const userId = req.params.id; // Obtén el ID del usuario desde los parámetros de la ruta
        
        // Busca todas las publicaciones de un usuario específico
        const publications = await Publication.find({ user: userId }).sort('-created_at'); // Ordena por fecha de creación descendente
        
        // Si no se encuentran publicaciones, retorna una respuesta vacía
        if (!publications || publications.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron publicaciones para este usuario.',
            });
        }
        
        // Respuesta exitosa con las publicaciones encontradas
        return res.status(200).json({
            success: true,
            publications: publications,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener las publicaciones del usuario.',
            error: error.message,
        });
    }
};

//subir ficheros.
const upload = async (req, res) => {
    try {
        let id = req.user.id;
        console.log(id)
        let publicacionId = req.params.publicacionId;
        
        let datosActualizados = req.body;
        
       
        // Comprobar si se ha subido un archivo
        let imagen = req.file ? req.file.filename : null;
        if (imagen) {
            datosActualizados.file = imagen;
        }else{
            return res.status(404).json({
                status: "error",
                mensaje: "no hay file0"
            });
        }
        
        // Encontrar el usuario por ID y actualizarlo
        const publicationActualizado = await Publication.findOneAndUpdate({user: id, _id: publicacionId }, datosActualizados, {
            new: true,  // Devuelve el documento actualizado
            runValidators: true // Ejecuta las validaciones definidas en el esquema
        });
  
        if (!publicationActualizado) {
            return res.status(404).json({
                status: "error",
                mensaje: "No se ha encontrado la publicacion para actualizar"
            });
        }
  
        return res.status(200).json({
            status: "success",
            mensaje: "publicacion actualizado con éxito",
            publicacion: publicationActualizado
        });
        
    } catch (error) {
        return res.status(500).json({
            status: "error",
            mensaje: "Ha ocurrido un error al intentar actualizar la publicacion",
            error: error.message
        });
    }
};

//devolver archivos.
const imagen = async (req, res) => {
    let fichero = req.params.fichero;
    let ruta_fisica = "./uploads/publications/"+fichero;
    
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

//listar todas las publicaciones.
const getPublicationsFromFollowedUsers = async (req, res) => {
    try {
        const userId = req.user.id; // ID del usuario logueado

        // 1. Obtener los IDs de los usuarios que el usuario logueado sigue
        const follows = await Follow.find({ user: userId }).select('followed -_id');
        const followedUserIds = follows.map(follow => follow.followed);

        if (followedUserIds.length === 0) {
            return res.status(404).json({
                status: "error",
                mensaje: "No sigues a ningún usuario.",
            });
        }

        // 2. Buscar todas las publicaciones de los usuarios que sigue
        const publications = await Publication.find({ user: { $in: followedUserIds } }).populate('user', 'name username')
                                              .sort('-created_at'); // Ordenar por fecha de creación

        if (!publications || publications.length === 0) {
            return res.status(404).json({
                status: "error",
                mensaje: "No se encontraron publicaciones de los usuarios que sigues.",
            });
        }

        return res.status(200).json({
            status: "success",
            publications: publications
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            mensaje: "Ha ocurrido un error al intentar obtener las publicaciones.",
            error: error.message
        });
    }
};



module.exports = {
    save,
    detail,
    deletePublication,
    getUserPublications,
    upload,
    imagen,
    getPublicationsFromFollowedUsers

}