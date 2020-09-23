// conexion a mysql
const mysql = require('mysql');

// configuracion de base de datos
// Create a MySQL pool
// Para la eficiencia, vamos a crear un pool de MySQL, 
// que nos permite utilizar múltiples conexiones a la vez en lugar de tener 
// que manualmente abrir y cerrar conexiones múltiples.
// Por último, a exportar la piscina de MySQL para poder utilizar la aplicación.
const config = {
    host     : 'ec2-18-222-41-77.us-east-2.compute.amazonaws.com',
    user     : 'tpi115',
    password : 'Tpi115.$',
    database : 'dsi2',
    connectTimeout: 20000,
    acquireTimeout: 20000
};

// exportamos la conexion establecidas
export const pool = mysql.createPool(config);