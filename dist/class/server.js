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
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
// como se utilizará en otra parte hay que poner la palabra reservada export
// tambien se le colocará la palabra reservada default para que sea la que se llame por defecto
class Server {
    constructor() {
        // If modifying these scopes, delete token.json.
        this.SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
        // The file token.json stores the user's access and refresh tokens, and is
        // created automatically when the authorization flow completes for the first
        // time.  
        this.TOKEN_PATH = 'src/token.json';
        // eventos calendar
        this.eventosGoogleCalendar = [];
        this.app = express_1.default();
        this.port = enviroment_1.SERVER_PORT;
        this.httpServer = new http_1.default.Server(this.app);
        // tiene el control de quienes estan conectados
        this.io = socket_io_1.default(this.httpServer);
        this.escucharSockets();
        this.leerDatosGmail();
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
    leerDatosGmail() {
        // Load client secrets from a local file.
        fs.readFile('src/credentials.json', (err, content) => {
            if (err)
                return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Calendar API.
            this.authorize(JSON.parse(content), this.listEvents);
        });
    }
    /**
      * Cree un cliente OAuth2 con las credenciales dadas y luego ejecute el
      * función de devolución de llamada dada.
      * @param {Object} credenciales Las credenciales del cliente de autorización.
      * @param {function} callback La devolución de llamada para llamar con el cliente autorizado.
      */
    authorize(credentials, callback) {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        // Check if we have previously stored a token.
        fs.readFile(this.TOKEN_PATH, (err, token) => {
            if (err)
                return this.getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    }
    /**
    * Get and store new token after prompting for user authorization, and then
    * execute the given callback with the authorized OAuth2 client.
    * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
    * @param {getEventsCallback} callback The callback for the authorized client.
    */
    getAccessToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err)
                    return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err)
                        return console.error(err);
                    console.log('Token stored to', this.TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }
    listEvents(auth) {
        const calendar = google.calendar({ version: 'v3', auth });
        calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        }, (err, res) => {
            if (err)
                return console.log('The API returned an error: ' + err);
            const events = res.data.items;
            if (events.length) {
                console.log('eventos: ');
                console.log(events);
                // aqui estoy ocupando el patron singleton
                const server = Server.instance;
                //
                server.eventosGoogleCalendar.push(...events);
                console.log('Upcoming 10 events:');
                events.map((event, i) => {
                    const start = event.start.dateTime || event.start.date;
                    console.log(`${start} - ${event.summary}`);
                });
            }
            else {
                console.log('No upcoming events found.');
            }
        });
    }
    // Método para levantar el servidor
    // No es nesesario de importacion de Function porque ya viene por defecto
    start(callback) {
        this.httpServer.listen(this.port, callback());
    }
}
exports.default = Server;
