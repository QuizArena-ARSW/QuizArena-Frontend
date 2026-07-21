import { API_URL } from "./config";
import { obtenerSesion } from "./auth";

// Helper: hace fetch e incluye el token si hay sesion
async function pedir(ruta, opciones = {}) {
  const sesion = obtenerSesion();
  const headers = { "Content-Type": "application/json", ...(opciones.headers || {}) };
  if (sesion?.token) headers["Authorization"] = "Bearer " + sesion.token;

  const resp = await fetch(API_URL + ruta, { ...opciones, headers });
  const texto = await resp.text();
  const data = texto ? JSON.parse(texto) : null;
  if (!resp.ok) {
    throw new Error(data?.error || "Error " + resp.status);
  }
  return data;
}

// --- Autenticacion ---
export function registro(correo, contrasena, nombre) {
  return pedir("/api/auth/registro", {
    method: "POST",
    body: JSON.stringify({ correo, contrasena, nombre }),
  });
}

export function login(correo, contrasena) {
  return pedir("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ correo, contrasena }),
  });
}

export function verificarCorreo(correo, codigo) {
  return pedir("/api/auth/verificar", {
    method: "POST",
    body: JSON.stringify({ correo, codigo }),
  });
}

export function reenviarCodigo(correo) {
  return pedir("/api/auth/reenviar-codigo", {
    method: "POST",
    body: JSON.stringify({ correo }),
  });
}

// --- Bancos de preguntas ---

/** Lista los bancos creados por el usuario autenticado. */
export function misBancos() {
  return pedir("/api/bancos/mios");
}

export function crearBanco(nombre, materia) {
  return pedir("/api/bancos", {
    method: "POST",
    body: JSON.stringify({ nombre, materia }),
  });
}

/** Devuelve el banco completo, con sus preguntas y opciones. */
export function obtenerBanco(idBanco) {
  return pedir("/api/bancos/" + idBanco);
}

/** Bancos predeterminados de QuizArena, disponibles para cualquier usuario. */
export function bancosOficiales() {
  return pedir("/api/bancos/oficiales");
}

/**
 * Agrega una pregunta a un banco.
 * pregunta = { enunciado, tipo, tiempoLimiteSegundos, opciones: [{texto, esCorrecta}] }
 */
export function agregarPregunta(idBanco, pregunta) {
  return pedir("/api/bancos/" + idBanco + "/preguntas", {
    method: "POST",
    body: JSON.stringify(pregunta),
  });
}

/**
 * Genera preguntas de opción múltiple con IA (bono). No las guarda: solo
 * devuelve borradores, cada uno { enunciado, opciones: [{texto, esCorrecta}] }.
 */
export function generarPreguntasIA(materia, tema, cantidad) {
  return pedir("/api/ia/preguntas", {
    method: "POST",
    body: JSON.stringify({ materia, tema, cantidad }),
  });
}

// --- Salas ---
export function crearSala(idBanco) {
  return pedir("/api/salas", {
    method: "POST",
    body: JSON.stringify({ idBanco }),
  });
}

export function invitarASala(codigo, idAmigo, nombreInvitador) {
  return pedir("/api/salas/" + codigo + "/invitaciones", {
    method: "POST",
    body: JSON.stringify({ idAmigo, nombreInvitador }),
  });
}

export function misInvitacionesSala() {
  return pedir("/api/salas/invitaciones");
}

// --- Amigos ---
export function buscarUsuarios(q) {
  return pedir("/api/amigos/buscar?q=" + encodeURIComponent(q));
}

export function enviarSolicitudAmistad(idDestinatario) {
  return pedir("/api/amigos/solicitudes", {
    method: "POST",
    body: JSON.stringify({ idDestinatario }),
  });
}

export function solicitudesRecibidas() {
  return pedir("/api/amigos/solicitudes/recibidas");
}

export function solicitudesEnviadas() {
  return pedir("/api/amigos/solicitudes/enviadas");
}

export function aceptarSolicitud(id) {
  return pedir("/api/amigos/solicitudes/" + id + "/aceptar", { method: "POST" });
}

export function rechazarSolicitud(id) {
  return pedir("/api/amigos/solicitudes/" + id + "/rechazar", { method: "POST" });
}

export function misAmigos() {
  return pedir("/api/amigos");
}

export function eliminarAmigo(idAmigo) {
  return pedir("/api/amigos/" + idAmigo, { method: "DELETE" });
}
