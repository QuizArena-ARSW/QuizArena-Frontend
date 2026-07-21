import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JuegoSocket } from "../juegoSocket";
import { obtenerSesion } from "../auth";

export default function Juego() {
  const { codigo } = useParams();
  const navegar = useNavigate();
  const sesion = obtenerSesion();

  const socketRef = useRef(null);
  const miIdRef = useRef(null);
  const inicioPreguntaRef = useRef(0);
  const timeoutSalaRef = useRef(null);

  const [conectado, setConectado] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [pregunta, setPregunta] = useState(null);
  const [marcador, setMarcador] = useState([]);
  const [elegida, setElegida] = useState(null);
  const [termino, setTermino] = useState(false);
  const [salaInexistente, setSalaInexistente] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [textoChat, setTextoChat] = useState("");
  const chatFinRef = useRef(null);
  const [resumenPreguntas, setResumenPreguntas] = useState([]);

  useEffect(() => {
    const socket = new JuegoSocket();
    socketRef.current = socket;

    socket.conectar(() => {
      setConectado(true);

      socket.suscribir("/topic/sala/" + codigo, (ev) => manejarEvento(ev));

      socket.suscribirTexto(
        "/topic/sala/" + codigo + "/jugador/" + sesion.nombre,
        (id) => { miIdRef.current = id; }
      );

      socket.suscribir(
        "/topic/sala/" + codigo + "/chat",
        (msg) => setMensajesChat((prev) => [...prev, msg])
      );

      // Historial: se entrega una sola vez, justo al unirse.
      socket.suscribir(
        "/topic/sala/" + codigo + "/jugador/" + sesion.nombre + "/chat-historial",
        (historial) => setMensajesChat(historial)
      );

      socket.enviar("/app/sala/" + codigo + "/unirse", {
        apodo: sesion.nombre,
        idUsuario: sesion.idUsuario,
      });

      // Si la sala no existe (p.ej. una invitación vieja), el servidor no
      // responde con nada: sin este aviso, la pantalla se queda "conectando..."
      // para siempre.
      timeoutSalaRef.current = setTimeout(() => setSalaInexistente(true), 5000);
    });

    return () => {
      socket.desconectar();
      clearTimeout(timeoutSalaRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  function manejarEvento(ev) {
    switch (ev.tipo) {
      case "JUGADORES":
        clearTimeout(timeoutSalaRef.current);
        setJugadores(ev.jugadores);
        break;
      case "PREGUNTA":
        setPregunta(ev);
        setElegida(null);
        inicioPreguntaRef.current = Date.now();
        break;
      case "MARCADOR":
        setMarcador(ev.ranking);
        break;
      case "FIN":
        setMarcador(ev.rankingFinal);
        setResumenPreguntas(ev.resumenPorJugador?.[miIdRef.current] || []);
        setPregunta(null);
        setTermino(true);
        break;
      default:
        break;
    }
  }

  // Cuenta regresiva visual: se calcula contra inicioPreguntaRef (no un
  // decremento local) para que no se desfase si un render se retrasa.
  // Al llegar a 0 pide la siguiente pregunta automaticamente; el backend
  // ignora pedidos duplicados de otros jugadores para la misma ronda.
  useEffect(() => {
    if (!pregunta) return;
    const limite = pregunta.tiempoLimiteSegundos;
    let avanzoAuto = false;
    const actualizar = () => {
      const transcurridoSeg = (Date.now() - inicioPreguntaRef.current) / 1000;
      const restante = Math.max(0, Math.ceil(limite - transcurridoSeg));
      setSegundosRestantes(restante);
      if (restante === 0 && !avanzoAuto) {
        avanzoAuto = true;
        siguiente();
      }
    };
    actualizar();
    const intervalo = setInterval(actualizar, 250);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pregunta?.idPregunta]);

  function iniciar() {
    socketRef.current.enviar("/app/sala/" + codigo + "/iniciar");
  }

  function siguiente() {
    socketRef.current.enviar("/app/sala/" + codigo + "/siguiente", { ronda: pregunta?.ronda });
  }

  function responder(idOpcion) {
    if (elegida) return;
    setElegida(idOpcion);
    socketRef.current.enviar("/app/sala/" + codigo + "/responder", {
      idJugador: miIdRef.current,
      idOpcion: idOpcion,
      tiempoRespuestaMs: Date.now() - inicioPreguntaRef.current,
    });
  }

  function enviarChat(e) {
    e.preventDefault();
    const texto = textoChat.trim();
    if (!texto) return;
    socketRef.current.enviar("/app/sala/" + codigo + "/chat", {
      idJugador: miIdRef.current,
      texto,
    });
    setTextoChat("");
  }

  useEffect(() => {
    chatFinRef.current?.scrollIntoView({ block: "nearest" });
  }, [mensajesChat]);

  function salir() {
    navegar("/lobby");
  }

  return (
    <div className="pantalla">
      <div className="barra" style={{ maxWidth: 1040 }}>
        <span className="sala-cod">Sala {codigo}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="usuario">{sesion?.nombre} · {conectado ? "en línea" : "conectando..."}</span>
          <button className="btn-fantasma btn-claro" onClick={salir}>Salir</button>
        </div>
      </div>

      <div className="juego-layout">
      <div className="tarjeta ancha juego-principal">
        {salaInexistente && (
          <>
            <div className="error">Esta sala ya no existe. Puede que haya expirado o que el código sea incorrecto.</div>
            <button className="btn-primario" onClick={() => navegar("/lobby")}>Volver al lobby</button>
          </>
        )}

        {!salaInexistente && !pregunta && !termino && (
          <>
            <div className="codigo-sala">
              <div className="etiqueta">Código de la sala</div>
              <div className="valor">{codigo}</div>
            </div>
            <p className="subtitulo" style={{ marginTop: 16 }}>
              Comparte el código. Cuando estén todos, inicia la partida.
            </p>
            <div className="jugadores">
              {jugadores.map((j) => (
                <span className="chip" key={j.id}>{j.apodo}</span>
              ))}
            </div>
            <button className="btn-accion" style={{ width: "100%" }} onClick={iniciar}>
              Iniciar partida
            </button>
          </>
        )}

        {pregunta && (
          <>
            <div className="ronda-info">
              <span>Ronda {pregunta.ronda} / {pregunta.totalRondas}</span>
              <span className="temporizador">{segundosRestantes}s</span>
            </div>
            <p className="enunciado">{pregunta.enunciado}</p>
            <div className="opciones">
              {pregunta.opciones.map((o) => (
                <button
                  key={o.id}
                  className={"opcion" + (elegida === o.id ? " elegida" : "")}
                  onClick={() => responder(o.id)}
                  disabled={!!elegida}
                >
                  {o.texto}
                </button>
              ))}
            </div>
            {elegida
              ? <p className="centro">Respuesta enviada. Espera la siguiente ronda.</p>
              : <p className="centro">Responde para poder avanzar.</p>}
            <div style={{ height: 16 }} />
            <button className="btn-fantasma" onClick={siguiente} disabled={!elegida}>
              Siguiente pregunta ▶
            </button>
          </>
        )}

        {marcador.length > 0 && (
          <>
            {termino && (
              <div className="fin">
                <div className="display">¡Fin de la partida!</div>
              </div>
            )}
            <h3 style={{ color: "var(--texto-claro)", margin: "20px 0 12px" }}>Marcador</h3>
            <ol className="marcador">
              {marcador.map((j, i) => (
                <li key={j.id}>
                  <span className="pos">{i + 1}</span>
                  <span className="nombre">{j.apodo}</span>
                  <span className="pts">{j.puntaje} pts</span>
                </li>
              ))}
            </ol>

            {termino && resumenPreguntas.length > 0 && (
              <>
                <div className="separador" />
                <h3 style={{ color: "var(--texto-claro)", margin: "0 0 12px" }}>Resumen de la partida</h3>
                <ol className="resumen-preguntas">
                  {resumenPreguntas.map((r, i) => (
                    <li
                      key={r.idPregunta}
                      className={!r.idOpcionElegida ? "sin-responder" : r.correcta ? "correcta" : "incorrecta"}
                    >
                      <span className="resumen-numero">{i + 1}</span>
                      <div className="resumen-cuerpo">
                        <p className="resumen-enunciado">{r.enunciado}</p>
                        {r.idOpcionElegida ? (
                          <p className="resumen-tu-respuesta">
                            Tu respuesta: <strong>{r.textoElegida}</strong> {r.correcta ? "✓" : "✗"}
                          </p>
                        ) : (
                          <p className="resumen-tu-respuesta">No respondiste esta pregunta</p>
                        )}
                        {!r.correcta && (
                          <p className="resumen-correcta">Respuesta correcta: <strong>{r.textoCorrecta}</strong></p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {termino && (
              <button className="btn-primario" onClick={() => navegar("/lobby")}>
                Volver al inicio
              </button>
            )}
          </>
        )}
      </div>

      {!salaInexistente && (
        <div className="tarjeta chat-panel">
          <h3 style={{ color: "var(--texto-claro)", marginBottom: 10 }}>Chat</h3>
          <div className="chat-mensajes">
            {mensajesChat.length === 0 && <p className="centro">Todavía no hay mensajes.</p>}
            {mensajesChat.map((m, i) => (
              <div className="chat-mensaje" key={i}>
                <span className="chat-mensaje-apodo">{m.apodo}</span>
                <span className="chat-mensaje-texto">{m.texto}</span>
              </div>
            ))}
            <div ref={chatFinRef} />
          </div>
          <form className="chat-form" onSubmit={enviarChat}>
            <input
              placeholder="Escribe un mensaje..."
              maxLength={300}
              value={textoChat}
              onChange={(e) => setTextoChat(e.target.value)}
            />
            <button className="btn-fantasma" disabled={!textoChat.trim()}>Enviar</button>
          </form>
        </div>
      )}
      </div>
    </div>
  );
}
