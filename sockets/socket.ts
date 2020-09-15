import { Socket } from 'socket.io';
import socketIO from 'socket.io';
import { UsuariosListas } from '../class/usuario-lista';
import { Usuario } from '../class/usuario';
import Server from '../class/server';

// creamos una instancia de usuarios conectados
// para exportarlos
// es la unica instancia que se debería de manejar para la lista de usuario
export const usuarioConectados = new UsuariosListas();

export const conectarCliente = (cliente: Socket, io: socketIO.Server) => {
    // instanciar un usuario
    const usuario = new Usuario(cliente.id);
    // Agregar usuario a la lista
    usuarioConectados.agregar(usuario);

}

export const desconectar = (cliente: Socket, io: socketIO.Server) =>  {
    cliente.on('disconnect', () =>{
        console.log('Sockets: Cliente desconectado...');
        // borrar un usuario cuando se desconecta
        usuarioConectados.borrarUsuario(cliente.id);
        io.emit('usuarios-activos', usuarioConectados.getLista());
    });
}

// Escuchar mensajes
export const mensaje = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('mensaje', (payload: {de: string, cuerpo: string}) => {
        console.log('mensaje recibido: ', payload);
        // emitir mensaje
        io.emit('mensaje-nuevo', payload);
    });
}

// configurar usuario
export const configurarUsuario = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('configurar-usuario', (payload: { nombre: string}, callback: Function) => {

        // actualizar datos de un usuario
        usuarioConectados.actualizaNombre(cliente.id, payload.nombre);
        console.log('configurando usuario: ', payload.nombre);

        io.emit('usuarios-activos', usuarioConectados.getLista());
        // io.emit('mensaje-nuevo', payload);
        // este mensaje se envia al cliente (Respondiendo del servidor al cliente)
        callback({
            ok: true,
            origen: 'Enviado desde el servidor nodejs',
            message: `Usuario ${payload.nombre} configurado`
        });
    });
}

// obtener todos los usuarios conectados
export const obtenerUsuarios = (cliente: Socket, io: socketIO.Server) => {
    cliente.on('obtener-usuarios', () => {
        // mandamos la informacion unicamente a la persona que se está conectado
        io.to(cliente.id).emit('usuarios-activos', usuarioConectados.getLista());

    });
}