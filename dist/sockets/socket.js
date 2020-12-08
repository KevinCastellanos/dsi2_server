"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usuario_lista_1 = require("../class/usuario-lista");
const usuario_1 = require("../class/usuario");
// creamos una instancia de usuarios conectados
// para exportarlos
// es la unica instancia que se debería de manejar para la lista de usuario
exports.usuarioConectados = new usuario_lista_1.UsuariosListas();
exports.conectarCliente = (cliente, io) => {
    // instanciar un usuario
    const usuario = new usuario_1.Usuario(cliente.id);
    // Agregar usuario a la lista
    exports.usuarioConectados.agregar(usuario);
};
exports.desconectar = (cliente, io) => {
    cliente.on('disconnect', () => {
        console.log('Sockets: Cliente desconectado...');
        // borrar un usuario cuando se desconecta
        exports.usuarioConectados.borrarUsuario(cliente.id);
        io.emit('usuarios-activos', exports.usuarioConectados.getLista());
    });
};
// Escuchar mensajes
exports.mensaje = (cliente, io) => {
    cliente.on('mensaje', (payload) => {
        console.log('mensaje recibido: ', payload);
        // emitir mensaje
        io.emit('mensaje-nuevo', payload);
    });
};
// configurar usuario
exports.configurarUsuario = (cliente, io) => {
    cliente.on('configurar-usuario', (payload, callback) => {
        // actualizar datos de un usuario
        exports.usuarioConectados.actualizaNombre(cliente.id, payload.nombre);
        console.log('configurando usuario: ', payload.nombre);
        io.emit('usuarios-activos', exports.usuarioConectados.getLista());
        // io.emit('mensaje-nuevo', payload);
        // este mensaje se envia al cliente (Respondiendo del servidor al cliente)
        callback({
            ok: true,
            origen: 'Enviado desde el servidor nodejs',
            message: `Usuario ${payload.nombre} configurado`
        });
    });
};
// obtener todos los usuarios conectados
exports.obtenerUsuarios = (cliente, io) => {
    cliente.on('obtener-usuarios', () => {
        // mandamos la informacion unicamente a la persona que se está conectado
        io.to(cliente.id).emit('usuarios-activos', exports.usuarioConectados.getLista());
    });
};
