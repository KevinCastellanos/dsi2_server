import Server from './class/server';
import { SERVER_PORT } from './global/enviroment';
import { router } from './routes/router';
import bodyParser from 'body-parser';
import cors from 'cors';
// const nombre = 'Kevin Castellanos, Estudiante de ingeniería de sistemas';
// no son apostrofes, son backticks para poder hacer inyecciones de variables en las cadena de textos
// console.log(`Mi nombre es: ${ nombre }`);

// Instanciamos un nuevo servidor
const server = Server.instance;

// bodyParser
// para leer la informacion del frontend al backend se usa bodyparse
// importante que sea antes de la ruta
server.app.use( bodyParser.urlencoded({extended: true}) );
// pasar la informacion a un formato json
server.app.use( bodyParser.json() );

// Configuramos el cors
server.app.use(cors({origin: true, credentials: true}));

// Definimos el path de la aplicacion
// Rutas de servicios
server.app.use('/', router);

// inicializamos el servidor
server.start( () => {
    console.log(`Servidor corriendo en el puerto: ${ SERVER_PORT }`);
});
