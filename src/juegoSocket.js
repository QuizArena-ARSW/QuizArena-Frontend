import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "./config";

/** Encapsula la conexion en tiempo real (WebSocket + STOMP). */
export class JuegoSocket {
  constructor() {
    this.client = null;
  }

  conectar(onConectado) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 2000,
      onConnect: () => onConectado(),
    });
    this.client.activate();
  }

  suscribir(destino, onMensaje) {
    return this.client.subscribe(destino, (msg) => onMensaje(JSON.parse(msg.body)));
  }

  suscribirTexto(destino, onTexto) {
    return this.client.subscribe(destino, (msg) => onTexto(msg.body));
  }

  enviar(destino, cuerpo = {}) {
    this.client.publish({ destination: destino, body: JSON.stringify(cuerpo) });
  }

  desconectar() {
    if (this.client) this.client.deactivate();
  }
}
