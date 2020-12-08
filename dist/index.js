"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./class/server"));
const enviroment_1 = require("./global/enviroment");
const router_1 = require("./routes/router");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// const nombre = 'Kevin Castellanos, Estudiante de ingeniería de sistemas';
// no son apostrofes, son backticks para poder hacer inyecciones de variables en las cadena de textos
// console.log(`Mi nombre es: ${ nombre }`);
// Instanciamos un nuevo servidor
const server = server_1.default.instance;
// bodyParser
// para leer la informacion del frontend al backend se usa bodyparse
// importante que sea antes de la ruta
server.app.use(body_parser_1.default.urlencoded({ extended: true }));
// pasar la informacion a un formato json
server.app.use(body_parser_1.default.json());
// Configuramos el cors
server.app.use(cors_1.default({ origin: true, credentials: true }));
// Definimos el path de la aplicacion
// Rutas de servicios
server.app.use('/', router_1.router);
// inicializamos el servidor
server.start(() => {
    console.log(`Servidor corriendo en el puerto: ${enviroment_1.SERVER_PORT}`);
});
