"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
// archivo destinado a crear los api Resfull
const express_1 = require("express");
const server_1 = __importDefault(require("../class/server"));
const socket_1 = require("../sockets/socket");
const mysql = __importStar(require("../database/sql"));
const fs = require('fs');
//Agregado por para rama doc
var multer = require('multer');
// var upload = multer({ dest: 'uploads/' })
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // imprimos los valores que traemos de la api
        // console.log('datos de formdata');
        console.log(req.headers);
        //cb(null, './subir');
        // reestructuramos el path personalizado dependiento del usuario
        const path = `./uploads/${req.headers.id_usuario}`;
        // creamos el directorio sino existe
        fs.mkdirSync(path, { recursive: true });
        //almacenamos el archivo en el subdirectorio del proytecto
        return cb(null, path);
    },
    filename: function (req, file, cb) {
        // renombramos el archivo al nombre original
        cb(null, file.originalname);
        // aqui vas a guardar la info a la base de datos
        // id_usuario
        /*let consultaSQL =  `INSERT INTO DETALLEPAGOS (IDPAGO ,IDEXPEDIENTE, FECHAPAGO, ABONO, SALDO)
                        VALUES (${req.body.id_pago}, ${req.body.id_expediente}, '${req.body.fecha}', ${req.body.abono}, ${req.body.saldo});`;

        // consulta estructurada con promesas
        mysql.query(consultaSQL).then( (data: any) => {
        }).catch( (err) => {
        });*/
    }
});
const uploadStorage = multer({ storage: storage });
////Agregado por Carlos Luna**********************************(Fin)
//exportamos la constante router -- Origina de Kevin
exports.router = express_1.Router();
exports.router.get('/mensajes', (req, res) => {
    res.json({
        ok: true,
        message: 'todo esta bien'
    });
});
exports.router.post('/mensajes', (req, res) => {
    // leer la informacion que estoy recibiendo desde el cliente
    const cuerpo = req.body.cuerpo;
    const de = req.body.de;
    const payload = {
        cuerpo,
        de
    };
    const server = server_1.default.instance;
    server.io.emit('mensaje-nuevo', payload);
    res.json({
        ok: true,
        cuerpo,
        de
    });
});
// nueva ruta con parametros
exports.router.post('/mensajes/:id', (req, res) => {
    // leer la informacion que estoy recibiendo desde el cliente
    const cuerpo = req.body.cuerpo;
    const de = req.body.de;
    // obtener el id
    const id = req.params.id;
    const payload = {
        de,
        cuerpo
    };
    // Aqui tenemos que agregar nuestro servicio rest con el servidor de sockets
    // para que la app obtenga los mensaje en tiempo real
    // declaramos la instancia de nuestro server
    // como usa el patron singleton, es la misma instancia del servidor de sockets corriendo
    const server = server_1.default.instance;
    // nos vamos a referir a nuesro servidor de sockets
    // el in sirve para enviar mensaje a un cliente en una canal en paticular
    server.io.in(id).emit('mensaje-privado', payload);
    res.json({
        ok: true,
        cuerpo,
        de,
        id
    });
});
// Servicios para obtener todos los IDs de los usuarios
exports.router.get('/usuarios', (req, res) => {
    // usamos la insancia de ioSockets para obtener los id conectados
    const server = server_1.default.instance;
    server.io.clients((err, clientes) => {
        if (err) {
            return res.json({
                ok: false,
                err
            });
        }
        res.json({
            ok: true,
            clientes
        });
    });
});
// obtenemos los nombre de los departamenos sin filtro
exports.router.get('/obtener-departamentos', (req, res) => {
    const consultaSQL = `SELECT *
                        FROM DEPARTAMENTO;`;
    mysql.query(consultaSQL).then((data) => {
        // data: retorna un array de objetos (si tiene objetos sino mandara un array vacio)
        // respondemos al cliente si es exito
        res.json(data);
    }).catch((err) => {
        // respondemos al cliente que hay error
        res.status(500).json({
            err
        });
    });
});
//Api Login
exports.router.post('/login', (req, res) => {
    console.log(req.body);
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    let consultaSQL = `SELECT * 
                    FROM USUARIO 
                    WHERE NOMBRE = '${req.body.usuario}'
                    AND CONTRASEÑA = '${req.body.password}';`;
    // consulta estructurada con promesas
    mysql.query(consultaSQL).then((data) => {
        res.json(data[0]);
    }).catch((err) => {
        res.status(500).json({ err });
    });
});
// obtener usuarios y sus nombres
exports.router.get('/usuarios/detalle', (req, res) => {
    res.json({
        ok: true,
        clientes: socket_1.usuarioConectados.getLista()
    });
});
// api obtener detalle abono
exports.router.post('/obtener-abonos-cliente', (req, res) => {
    // NOTA: esta consulta sql está estructurada para leer datos de 3 tablas diferentes
    // tabla a: independiente = es la tabla de expediente
    // tabla b: independiente = es la tabla pago
    // tabla c: dependiente = es la tabla detallepago que une datos entre a y c
    const consultaSQL = `SELECT a.*,
                                    (
                                        (
                                            select JSON_ARRAYAGG(
                                                       json_object( 'IDDETALLEPAGO',c.IDDETALLEPAGO,
                                                                    'FECHAPAGO',c.FECHAPAGO,
                                                                    'ABONO',c.ABONO,
                                                                    'SALDO',c.SALDO,
                                                                                    'MONTO', b.MONTO )
                                            )   
                                            from DETALLEPAGOS as c, PAGO b
                                            where c.IDPAGO = b.IDPAGO
                                            AND a.IDEXPEDIENTE = c.IDEXPEDIENTE
                                            
                                        )
                                     ) as 'detalle'
                                FROM EXPEDIENTE as a
                                WHERE a.IDEXPEDIENTE = ${req.body.id_expediente};`;
    mysql.query(consultaSQL).then((data) => {
        // data: retorna un array de objetos (si tiene objetos sino mandara un array vacio)
        // respondemos al cliente si es exito
        // mysql retorna un arreglo dentro de otro arreglo el ultimo lo retorna en forma de cadena
        // para eso vamos a convertirlo a un objeto json (este es un caso especial cuando ocupamos unicamente json_arrayg)
        for (var i = 0; i < data.length; i++) {
            // parseamos el array que recibimos en cadena a objeto y lo volvemos a asignar a la misma variable
            data[i].detalle = JSON.parse(data[i].detalle);
        }
        // retornamos solo el objeto para mayor facilidad de manipulacion de datos
        res.json(data[0]);
    }).catch((err) => {
        // respondemos al cliente que hay error
        res.status(500).json({
            err
        });
    });
});
// api para registrar abno de cliente
exports.router.post('/registrar-abono-cliente', (req, res) => {
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    let consultaSQL = `INSERT INTO DETALLEPAGOS (IDPAGO ,IDEXPEDIENTE, FECHAPAGO, ABONO, SALDO) 
                        VALUES (${req.body.id_pago}, ${req.body.id_expediente}, '${req.body.fecha}', ${req.body.abono}, ${req.body.saldo});`;
    // consulta estructurada con promesas
    mysql.query(consultaSQL).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ err });
    });
});
exports.router.post('/obtener-clientes', (req, res) => {
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    let consultaSQL = `SELECT a.*, b.IDEXPEDIENTE, b.IDETAPA, c.ETDESCRIPCION FROM CLIENTE as a, EXPEDIENTE AS b, ETAPA AS c
                        WHERE a.IDCLIENTE = b.IDCLIENTE
                        AND b.IDETAPA = c.IDETAPA;`;
    // consulta estructurada con promesas
    mysql.query(consultaSQL).then((data) => {
        // caso de exito
        res.json(data);
    }).catch((err) => {
        // caso de error
        res.status(500).json({ err });
    });
});
// obtenemos los nombre de los departamenos sin filtro
exports.router.get('/obtener-eventos-agenda', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('evento calendar');
    // enviar al cliente los eventos programando en google calendar
    const server = server_1.default.instance;
    console.log('antes de leer datos calendar');
    setTimeout(function () {
        res.json(server.eventosGoogleCalendar);
    }, 2000);
    yield server.leerDatosGmail();
    // respondemos con un json ya sea vacio o con datos
    console.log('despues de leer calendar');
}));
// api para registrar abno de cliente
exports.router.post('/registrar-rama', (req, res) => {
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    const descripcion = req.body.nombreRama;
    let consultaSQL = `SELECT * FROM INTO RAMA (RADESCRIPCION) 
                        VALUES ('${descripcion}');`;
    // consulta estructurada con promesas
    mysql.query(consultaSQL).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ err });
    });
});
exports.router.post('/obtener-historial-expediente', (req, res) => {
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    let consultaSQL = `SELECT * FROM HISTORIAL_EXPEDIENTE
                        WHERE ID_EXPEDIENTE = '${req.body.id_expediente}'`;
    // consulta estructurada con promesas
    mysql.query(consultaSQL).then((data) => {
        // caso de exito
        res.json(data);
    }).catch((err) => {
        // caso de error
        res.status(500).json({ err });
    });
});
// api para registrar avance expediente
exports.router.post('/registrar-avance-expediente', (req, res) => {
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    let consultaSQL = `INSERT INTO HISTORIAL_EXPEDIENTE (ID_EXPEDIENTE, DESCRIPCION, FECHA) 
                        VALUES (${req.body.id_expediente}, '${req.body.comentario}', '${req.body.fecha}');`;
    // consulta estructurada con promesas
    mysql.query(consultaSQL).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ err });
    });
});
exports.router.get('/obtener-etapas', (req, res) => {
    const consultaSQL = `SELECT *
                        FROM ETAPA;`;
    mysql.query(consultaSQL).then((data) => {
        // data: retorna un array de objetos (si tiene objetos sino mandara un array vacio)
        // respondemos al cliente si es exito
        res.json(data);
    }).catch((err) => {
        // respondemos al cliente que hay error
        res.status(500).json({
            err
        });
    });
});
// Single file
exports.router.post("/api/subir", uploadStorage.any("archivo"), (req, res) => {
    // console.log('----');
    // console.log(req.headers)
    //return res.send("Single file");
    //return res.send(req.body);
    res.json({
        'message': 'Fichero subido correctamente!'
    });
});
////Agregado por Carlos Luna**********************************(Inicio)//
//To download files
exports.router.post('/obtener-documento', (req, res) => {
    let ruta = `./uploads/${req.headers.id_usuario}`;
    res.json({
        'message': 'Fichero recuperado correctamente!'
    });
});
////Agregado por Carlos Luna**********************************(Fin)
exports.router.post('/descarga', function (req, res, next) {
    let ruta = `./uploads/${req.headers.id_usuario}`;
    res.sendFile(ruta);
});
////Agregado por Carlos Luna**********************************(Inicio)//Inutilizable
//EndPoint to Upload files
exports.router.post('/api/subir2', (req, res) => {
    res.json({
        'message': 'Fichero subido correctamente!'
    });
});
////Agregado por Carlos Luna**********************************(Fin)
