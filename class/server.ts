import express from 'express';
import { SERVER_PORT } from '../global/enviroment';
// importamos socketIo
import socketIO from 'socket.io';
// intermediario entre SocketIO y express
import http from 'http';
import * as socket from '../sockets/socket';

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');


// como se utilizará en otra parte hay que poner la palabra reservada export
// tambien se le colocará la palabra reservada default para que sea la que se llame por defecto
export default class Server {

    private static _intance: Server;
    public app: express.Application;
    public port: number;
    
    // If modifying these scopes, delete token.json.
    private SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.  
    private TOKEN_PATH = 'src/token.json';        

    //Socket (Servidor: encargada de emiti eventos o escuchar eventos)
    public io: SocketIO.Server;
    // este es el servidor que vamos a levantar y no el app
    private httpServer: http.Server;

    // eventos calendar
    public eventosGoogleCalendar: any[] = [];

    private constructor() {
        this.app = express();
        this.port = SERVER_PORT;
        this.httpServer = new http.Server(this.app);
        // tiene el control de quienes estan conectados
        this.io = socketIO(this.httpServer);
        this.escucharSockets();
        this.leerDatosGmail();
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

    private leerDatosGmail() {
        
        // Load client secrets from a local file.
        fs.readFile('src/credentials.json', (err: any, content: any) => {
            if (err) return console.log('Error loading client secret file:', err);
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
    private authorize(credentials: any, callback: any) {
        
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
              client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(this.TOKEN_PATH, (err: any, token: any) => {
            if (err) return this.getAccessToken(oAuth2Client, callback);
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
    private getAccessToken(oAuth2Client: any, callback: any) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code: any) => {
            rl.close();
            oAuth2Client.getToken(code, (err: any, token: any) => {
              if (err) return console.error('Error retrieving access token', err);
              oAuth2Client.setCredentials(token);
              // Store the token to disk for later program executions
              fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (err: any) => {
                if (err) return console.error(err);
                console.log('Token stored to', this.TOKEN_PATH);
              });
              callback(oAuth2Client);
            });
        });
    }

    private listEvents(auth: any) {
        const calendar = google.calendar({version: 'v3', auth});
          calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        }, (err: any, res: any) => {
            if (err) return console.log('The API returned an error: ' + err);
            const events = res.data.items;
            if (events.length) {
                console.log('eventos: ');
                console.log(events);
                
                // aqui estoy ocupando el patron singleton
                const server = Server.instance;

                //
                server.eventosGoogleCalendar.push(...events);
                
                console.log('Upcoming 10 events:');
                events.map((event: any, i: any) => {
                const start = event.start.dateTime || event.start.date;
                console.log(`${start} - ${event.summary}`);
              });
            } else {
              console.log('No upcoming events found.');
            }
          });
    }

    // Método para levantar el servidor
    // No es nesesario de importacion de Function porque ya viene por defecto
    start(callback: Function) {
        this.httpServer.listen(this.port, callback());
    }
}