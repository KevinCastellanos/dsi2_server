// archivo destinado a crear los api Resfull
import { Router, Request, Response } from 'express';
import Server from '../class/server';
import { usuarioConectados } from '../sockets/socket';
import * as mysql from '../database/sql';


//exportamos la constante router
export const router  = Router();



router.get('/mensajes', (req: Request, res: Response) => {
    res.json({
        ok: true,
        message: 'todo esta bien'
    });
});

router.post('/mensajes', (req: Request, res: Response) => {
    // leer la informacion que estoy recibiendo desde el cliente
    const cuerpo = req.body.cuerpo;
    const de = req.body.de;

    const payload = {
        cuerpo,
        de
    }

    const server  = Server.instance;

    server.io.emit('mensaje-nuevo', payload);

    res.json({
        ok: true,
        cuerpo,
        de
    });
});

// nueva ruta con parametros
router.post('/mensajes/:id', (req: Request, res: Response) => {
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
    const server = Server.instance;

    // nos vamos a referir a nuesro servidor de sockets
    // el in sirve para enviar mensaje a un cliente en una canal en paticular
    server.io.in( id ).emit('mensaje-privado', payload);

    res.json({
        ok: true,
        cuerpo,
        de,
        id
    });
});

// Servicios para obtener todos los IDs de los usuarios
router.get('/usuarios', (req: Request, res: Response) => {

    // usamos la insancia de ioSockets para obtener los id conectados
    const server = Server.instance;
    server.io.clients( (err: any, clientes: string[])=> {
        if(err) {
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
router.get('/obtener-departamentos', (req: Request, res: Response) => {
    
    const consultaSQL = `SELECT *
                        FROM DEPARTAMENTO;`;

        mysql.query(consultaSQL).then( (data: any) => {
            // data: retorna un array de objetos (si tiene objetos sino mandara un array vacio)


            // respondemos al cliente si es exito
            res.json(data);
        
        }).catch( (err: any) => {

            // respondemos al cliente que hay error
            res.status(500).json({ 
                err 
            });
        });
    
});

//Api Login
router.post('/login', (req: Request, res: Response) => {
    console.log(req.body);

    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    

    let consultaSQL = `SELECT * 
                    FROM USUARIO 
                    WHERE NOMBRE = '${req.body.usuario}'
                    AND CONTRASEÑA = '${req.body.password}';`;

    // consulta estructurada con promesas
    mysql.query(consultaSQL).then( (data: any) => {
        res.json(data[0]);
    }).catch( (err) => {
        res.status(500).json({ err });
    });
});

// obtener usuarios y sus nombres
router.get('/usuarios/detalle', (req: Request, res: Response) => {

    res.json({
        ok: true,
        clientes: usuarioConectados.getLista()
    });
});