// ==========================================================
// URLs del backend.
//
// CAMBIO DE LA FASE 6: se leen de variables de entorno de Vite
// (VITE_API_URL / VITE_WS_URL), con valores por defecto para desarrollo.
//
// Ojo: Vite las incrusta en el bundle al COMPILAR, no en tiempo de ejecucion.
// Por eso al construir la imagen Docker hay que pasarlas como argumentos.
// ==========================================================

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8081/ws-juego";
