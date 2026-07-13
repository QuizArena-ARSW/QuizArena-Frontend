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

// --- Salas ---
export function crearSala(idBanco) {
  return pedir("/api/salas", {
    method: "POST",
    body: JSON.stringify({ idBanco }),
  });
}
