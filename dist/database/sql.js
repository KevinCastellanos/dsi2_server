"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
exports.query = (query) => {
    // obteniendo la conexion a MySQL
    return new Promise((resolve, reject) => {
        config_1.pool.getConnection(function (err, conn) {
            // Evaluar si existe algun error
            if (err) {
                console.log("ERROR CONN: " + err);
                // throw err;
                return reject(err);
            }
            // consulta
            conn.query(query, function (err, rows) {
                //Evaluar si existe algun error
                if (err) {
                    // console.log("ERROR QUERY: " + err);
                    return reject(err);
                }
                // Se resuelve la data retornando los valores obtenidos
                resolve(rows);
                // Cuando haya terminado con la conexión, suéltela.
                conn.release();
                // No use la conexión aquí, se ha devuelto al grupo.
            });
        });
    });
};
