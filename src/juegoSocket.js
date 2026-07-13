import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "./config";

/**
 * Encapsula la conexion en tiempo real (WebSocket + STOMP) con el Servicio
 * de Juego. Expone metodos simples para conectar, suscribirse y enviar.
 */
export class JuegoSocket {
  constructor() {
    this.client = null;
  }

  // Conecta y ejecuta onConectado() cuando la conexion esta lista
  conectar(onConectado) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 2000, // reintenta si se cae (base para la reconexion)
      onConnect: () => onConectado(),
    });
    this.client.activate();
  }

  // Se suscribe a un canal; llama a onMensaje(objeto) por cada evento
  suscribir(destino, onMensaje) {
    return this.client.subscribe(destino, (msg) => {
      onMensaje(JSON.parse(msg.body));
    });
  }

  // Suscripcion a un canal cuyo cuerpo es texto plano (no JSON)
  suscribirTexto(destino, onTexto) {
    return this.client.subscribe(destino, (msg) => onTexto(msg.body));
  }

  // Envia un mensaje a un destino /app/...
  enviar(destino, cuerpo = {}) {
    this.client.publish({ destination: destino, body: JSON.stringify(cuerpo) });
  }

  desconectar() {
    if (this.client) this.client.deactivate();
  }
}
