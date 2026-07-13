// Guarda y recupera la sesion del usuario (token + datos) en localStorage.

const CLAVE = "quizarena_sesion";

export function guardarSesion(token, nombre, correo) {
  const idUsuario = idDesdeToken(token);
  const sesion = { token, nombre, correo, idUsuario };
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
  return sesion;
}

export function obtenerSesion() {
  const raw = localStorage.getItem(CLAVE);
  return raw ? JSON.parse(raw) : null;
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE);
}

// Decodifica el payload del JWT para sacar el idUsuario (claim "sub")
export function idDesdeToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json).sub;
  } catch (e) {
    return null;
  }
}
