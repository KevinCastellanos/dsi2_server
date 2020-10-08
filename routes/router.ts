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

// api obtener detalle abono
router.post('/obtener-abonos-cliente', (req: Request, res: Response) => {
    
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

        mysql.query(consultaSQL).then( (data: any) => {
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
        
        }).catch( (err: any) => {

            // respondemos al cliente que hay error
            res.status(500).json({ 
                err 
            });
        });
    
});

// api para registrar abno de cliente
router.post('/registrar-abono-cliente', (req: Request, res: Response) => {
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url
    

    let consultaSQL =  `INSERT INTO DETALLEPAGOS (IDPAGO ,IDEXPEDIENTE, FECHAPAGO, ABONO, SALDO) 
                        VALUES (${req.body.id_pago}, ${req.body.id_expediente}, '${req.body.fecha}', ${req.body.abono}, ${req.body.saldo});`;

    // consulta estructurada con promesas
    mysql.query(consultaSQL).then( (data: any) => {
        res.json(data);
    }).catch( (err) => {
        res.status(500).json({ err });
    });
});

router.post('/obtener-clientes', (req: Request, res: Response) => {
    // query: viene concatenado en la url
    // body: los parametros no vienen en la url

    let consultaSQL =  `SELECT a.*, b.IDEXPEDIENTE FROM CLIENTE as a, EXPEDIENTE as b
                        WHERE a.IDCLIENTE = b.IDCLIENTE`;

    // consulta estructurada con promesas
    mysql.query(consultaSQL).then( (data: any) => {
        // caso de exito
        res.json(data);
    }).catch( (err) => {
        // caso de error
        res.status(500).json({ err });
    });
});

