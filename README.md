# QuizArena · Frontend (React + Vite)

Interfaz web de QuizArena. React 18 + Vite 5 + `react-router-dom` +
`@stomp/stompjs` + `sockjs-client`.

## Cómo se conecta al backend

- **REST** (login, registro, bancos, amigos, IA) → API Gateway
  (`http://localhost:8080`).
- **WebSocket / STOMP** (la partida en tiempo real, incluido el chat) →
  directo al Servicio de Juego (`http://localhost:8081/ws-juego`).

Ambas URLs se leen de variables de entorno de Vite (`VITE_API_URL`,
`VITE_WS_URL`), centralizadas en `src/config.js`. Se inyectan al
**construir** la imagen Docker (Vite las incrusta en el build, no en
runtime), así que cambiarlas requiere reconstruir.

## Requisitos

- Node.js 18+ y npm
- El backend corriendo: Gateway (8080), Juego (8081), Identidad (8082),
  Servicio de IA (8083), con sus bases de datos y Redis.

## Cómo arrancarlo

```bash
npm install       # solo la primera vez
npm run dev
```

Abre lo que indique la consola (por defecto `http://localhost:5173`).

## Flujo de uso

1. **Regístrate** (contraseña con carácter especial) y **verifica tu
   correo** con el código que te llega.
2. En el **lobby**: crea una sala eligiendo uno de tus bancos (o uno
   oficial), o únete a una con su código. Si tienes amigos, puedes
   invitarlos directo a una sala activa; también ves ahí las invitaciones
   que te llegan.
3. En **Bancos**: crea bancos y agrega preguntas a mano, o genera
   borradores con IA (indicando materia, tema y cantidad) y elige cuáles
   agregar — la IA nunca guarda nada sin tu revisión.
4. En **Amigos**: busca usuarios por nombre o correo, envía/acepta/rechaza
   solicitudes, gestiona tu lista.
5. En la **partida**: responde las preguntas contrarreloj (cuenta
   regresiva real), chatea con los demás jugadores en el panel lateral, y
   ve el marcador en vivo.
6. Al terminar: **resumen de la partida** pregunta por pregunta — cuáles
   acertaste, cuáles fallaste y cuál era la respuesta correcta en esas —
   además del ranking final. El resultado también queda en tu historial.

## Estructura

```
src/
├── main.jsx                arranque + router
├── App.jsx                 definicion de rutas
├── config.js                URLs del backend (Gateway / WebSocket)
├── auth.js                  sesion (token, idUsuario) en localStorage
├── api.js                   llamadas REST al Gateway (auth, bancos, amigos, salas, IA)
├── juegoSocket.js            cliente WebSocket/STOMP
├── estilos.css               identidad visual de QuizArena (tema oscuro "arena")
├── componentes/
│   ├── Encabezado.jsx        barra de navegacion, consistente entre paginas
│   └── Logo.jsx
└── paginas/
    ├── Landing.jsx            pagina publica de bienvenida
    ├── Login.jsx               login / registro
    ├── VerificarCorreo.jsx     confirmar el codigo enviado al correo
    ├── Lobby.jsx               crear/unirse a sala, invitar amigos, ver invitaciones
    ├── Bancos.jsx              crear bancos, agregar preguntas (manual o con IA)
    ├── Amigos.jsx              buscar, solicitar, aceptar/rechazar, listar amigos
    └── Juego.jsx               la partida en tiempo real: preguntas, chat, resumen final
```

## Notas de diseño

- **Chat de sala**: panel lateral derecho dentro de `Juego.jsx`, efímero
  (vive en Redis del lado del Servicio de Juego, no se persiste). Se
  suscribe a `/topic/sala/{codigo}/chat` y recibe el historial una sola vez
  al unirse.
- **Temporizador**: la cuenta regresiva se calcula contra un timestamp
  (`Date.now()`), no con un decremento local, para no desfasarse si un
  render se retrasa; al llegar a 0 pide la siguiente pregunta sola.
- **Caché del navegador**: el `nginx.conf` de producción sirve los assets
  con hash (`/assets/*`) como inmutables por un año, e `index.html` como
  `no-cache`, para que un redeploy se vea de inmediato sin depender de que
  el usuario haga un hard-refresh.
