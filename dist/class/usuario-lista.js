"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UsuariosListas {
    constructor() {
        this.lista = [];
    }
    // Agregar un nuevo usuario (usuario ya debe de estar creado para insertarlo en la lista)
    agregar(usuario) {
        this.lista.push(usuario);
        console.log(this.lista);
        return usuario;
    }
    actualizaNombre(id, nombre) {
        // recorremos la lista de usuario
        for (let usuario of this.lista) {
            if (usuario.id === id) {
                usuario.nombre = nombre;
                break;
            }
        }
        console.log('========== Actualizando usuario ============');
        console.log(this.lista);
    }
    // Obtener lista de usuario conectado
    getLista() {
        return this.lista.filter(usuario => usuario.nombre !== 'sin-nombre');
    }
    // obtener un usuario
    getUsuario(id) {
        return this.lista.find(usuario => usuario.id === id);
    }
    // obtener usuarios en una sala en particular
    getUsuarioEnSala(salaNombre) {
        return this.lista.filter(usuario => usuario.sala === salaNombre);
    }
    // borrar usuario del chat
    borrarUsuario(id) {
        const tempUsuario = this.getUsuario(id);
        this.lista = this.lista.filter(usuario => usuario.id !== id);
        // console.log(this.lista);
        return tempUsuario;
    }
}
exports.UsuariosListas = UsuariosListas;
