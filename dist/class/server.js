"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const enviroment_1 = require("../global/enviroment");
// importamos socketIo
const socket_io_1 = __importDefault(require("socket.io"));
// intermediario entre SocketIO y express
const http_1 = __importDefault(require("http"));
const socket = __importStar(require("../sockets/socket"));
// como se utilizará en otra parte hay que poner la palabra reservada export
// tambien se le colocará la palabra reservada default para que sea la que se llame por defecto
class Server {
    constructor() {
        this.app = express_1.default();
        this.port = enviroment_1.SERVER_PORT;
        this.httpServer = new http_1.default.Server(this.app);
        // tiene el control de quienes estan conectados
        this.io = socket_io_1.default(this.httpServer);
        this.escucharSockets();
    }
    // patron singleton
    static get instance() {
        // si ya existe una instancia, regrese esa instancia,
        // sino existe crear una nueva instancia y será unica
        return this._intance || (this._intance = new this());
    }
    escucharSockets() {
        console.log('escuchando conexiones-sockets...');
        // escuchar sockets
        this.io.on('connect', cliente => {
            console.log('Nuevo cliente conectado');
            console.log('id cliente;', cliente.id);
            // console.log('dataCliente: ', cliente.broadcast);
            // verifica cuando un cliente se desconecta
            /*cliente.on('disconnect', () => {
                console.log('Cliente desconectado');
            });*/
            // Conectar cliente
            socket.conectarCliente(cliente, this.io);
            // Mensajes (escuchando)
            socket.mensaje(cliente, this.io);
            // desconectar
            socket.desconectar(cliente, this.io);
            // configurar usuario
            socket.configurarUsuario(cliente, this.io);
            // Obtener usuarios activos
            socket.obtenerUsuarios(cliente, this.io);
        });
    }
    // Método para levantar el servidor
    // No es nesesario de importacion de Function porque ya viene por defecto
    start(callback) {
        this.httpServer.listen(this.port, callback());
    }
}
exports.default = Server;
