const conexion = require('./database/connection');
const express = require('express');
const cors = require('cors');

conexion();

const app = express();
const port = 3900;

app.use(cors());

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//rutas
const UserRoutes = require("./routes/user");
const PublicationRoutes = require("./routes/publication");
const FollowRoutes = require("./routes/follow");


//cargo las rutas
app.use("/api/user", UserRoutes);
app.use("/api/publication", PublicationRoutes);
app.use("/api/follow", FollowRoutes);




// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor Express escuchando en http://localhost:${port}`);
  });