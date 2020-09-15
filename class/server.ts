import express from 'express';
import { SERVER_PORT } from '../global/enviroment';
// importamos socketIo
import socketIO from 'socket.io';
// intermediario entre SocketIO y express
import http from 'http';
import * as socket from '../sockets/socket';

// como se utilizará en otra parte hay que poner la palabra reservada export
// tambien se le colocará la palabra reservada default para que sea la que se llame por defecto
export default class Server {

    private static _intance: Server;
    public app: express.Application;
    public port: number;

    //Socket (Servidor: encargada de emiti eventos o escuchar eventos)
    public io: SocketIO.Server;
    // este es el servidor que vamos a levantar y no el app
    private httpServer: http.Server;

    private constructor() {
        this.app = express();
        this.port = SERVER_PORT;
        this.httpServer = new http.Server(this.app);
        // tiene el control de quienes estan conectados
        this.io = socketIO(this.httpServer);
        this.escucharSockets();
    }

    // patron singleton
    public static get instance() {
        // si ya existe una instancia, regrese esa instancia,
        // sino existe crear una nueva instancia y será unica
        return this._intance || (this._intance = new this());
    }

    private escucharSockets() {
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
    start(callback: Function) {
        this.httpServer.listen(this.port, callback());
    }
}