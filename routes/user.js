const express = require('express');
const router = express.Router();
const ensureAuth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');


const UserController = require('../controllers/user');

// Configurar el almacenamiento de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/avatars/'); // Carpeta donde se almacenarán las imágenes
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`); // Nombre único para cada archivo
    }
})

// Filtrar los archivos por tipo de imagen
const fileFilter = (req, file, cb) => {
    // Aceptar solo archivos con las extensiones: .jpeg, .jpg, .png, .gif
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
};

// Crear el middleware de Multer
const subidas = multer({ storage: storage, fileFilter: fileFilter});



router.post('/register', UserController.register),
router.post('/login', UserController.login),
router.get('/profile/:id', ensureAuth, UserController.profile),
router.get('/list/:page?', ensureAuth, UserController.list),
router.put('/update', ensureAuth, UserController.update),
router.post('/upload', [ensureAuth, subidas.single("file0")], UserController.upload);
router.get('/imagen/:fichero', ensureAuth, UserController.imagen),





module.exports = router;