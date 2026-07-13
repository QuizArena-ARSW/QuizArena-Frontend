# QuizArena - Frontend (React + Vite)

Interfaz web de QuizArena. Reemplaza al test.html de las fases anteriores.

## Como se conecta al backend

- REST (login, registro, crear sala) -> API Gateway (http://localhost:8080)
- WebSocket / STOMP (la partida en tiempo real) -> directo al Servicio de
  Juego (http://localhost:8081/ws-juego)

Puedes cambiar esas URLs en src/config.js.

## Requisitos

- Node.js 18+ y npm
- El backend corriendo: Gateway (8080), Juego (8081), Identidad (8082),
  con sus bases de datos.

## Como arrancarlo

1. Instala las dependencias (solo la primera vez):

       npm install

2. Arranca el servidor de desarrollo:

       npm run dev

3. Abre lo que indique la consola (por defecto http://localhost:5173).

## Flujo de uso

1. Registrate o inicia sesion.
2. En el lobby: crea una sala pegando el id de un banco de preguntas
   (el que creaste en Identidad), o unete a una con su codigo.
3. En la sala: comparte el codigo, espera jugadores e inicia la partida.
4. Responde las preguntas; el marcador se actualiza en vivo.
5. Al terminar, el resultado se guarda en tu historial.

## Estructura

    src/
    |- main.jsx          arranque + router
    |- App.jsx           rutas (login, lobby, juego)
    |- config.js         URLs del backend
    |- auth.js           sesion (token, idUsuario) en localStorage
    |- api.js            llamadas REST al Gateway
    |- juegoSocket.js    cliente WebSocket/STOMP
    |- estilos.css       identidad visual de QuizArena
    |- paginas/
       |- Login.jsx      login / registro
       |- Lobby.jsx      crear / unirse a sala
       |- Juego.jsx      la partida en tiempo real

## Nota sobre el chat (HU-17)

El chat todavia no esta: requiere primero agregar el endpoint de chat en el
Servicio de Juego. Se implementa en un paso siguiente (backend + frontend).
