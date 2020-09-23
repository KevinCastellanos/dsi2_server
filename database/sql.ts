import { pool } from "./config";

export const query = (query: string) => {
    // obteniendo la conexion a MySQL
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err:any, conn: any) {
            // Evaluar si existe algun error
            if (err) {
                console.log("ERROR CONN: " + err);
                // throw err;
                return reject(err);          
            }
            // consulta
            conn.query(query, function (err: any, rows: any) {
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
}