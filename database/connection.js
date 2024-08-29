const mongoose = require('mongoose');

const conexion = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/mi_red_social', {
            //useNewUrlParser: true,
            //useUnifiedTopology: true
        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error.message);
        process.exit(1); // Salir del proceso con un error si no se puede conectar
    }
};

module.exports = conexion;
