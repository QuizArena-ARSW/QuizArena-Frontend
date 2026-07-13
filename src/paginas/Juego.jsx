import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { JuegoSocket } from "../juegoSocket";
import { obtenerSesion } from "../auth";

export default function Juego() {
  const { codigo } = useParams();
  const navegar = useNavigate();
  const sesion = obtenerSesion();

  const socketRef = useRef(null);
  const miIdRef = useRef(null);          // id del jugador dentro de la sala
  const inicioPreguntaRef = useRef(0);   // para medir el tiempo de respuesta

  const [conectado, setConectado] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [pregunta, setPregunta] = useState(null);
  const [marcador, setMarcador] = useState([]);
  const [elegida, setElegida] = useState(null);
  const [termino, setTermino] = useState(false);

  useEffect(() => {
    const socket = new JuegoSocket();
    socketRef.current = socket;

    socket.conectar(() => {
      setConectado(true);

      // Canal de la sala: aqui llega todo (lista, preguntas, marcador, fin)
      socket.suscribir("/topic/sala/" + codigo, (ev) => manejarEvento(ev));

      // Canal personal: aqui me llega MI id de jugador al unirme
      socket.suscribirTexto(
        "/topic/sala/" + codigo + "/jugador/" + sesion.nombre,
        (id) => { miIdRef.current = id; }
      );

      // Me uno con mi apodo (nombre) y mi idUsuario real
      socket.enviar("/app/sala/" + codigo + "/unirse", {
        apodo: sesion.nombre,
        idUsuario: sesion.idUsuario,
      });
    });

    return () => socket.desconectar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo]);

  function manejarEvento(ev) {
    switch (ev.tipo) {
      case "JUGADORES":
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
        setPregunta(null);
        setTermino(true);
        break;
      default:
        break;
    }
  }

  function iniciar() {
    socketRef.current.enviar("/app/sala/" + codigo + "/iniciar");
  }

  function siguiente() {
    socketRef.current.enviar("/app/sala/" + codigo + "/siguiente");
  }

  function responder(idOpcion) {
    if (elegida) return; // ya respondio esta ronda
    setElegida(idOpcion);
    socketRef.current.enviar("/app/sala/" + codigo + "/responder", {
      idJugador: miIdRef.current,
      idOpcion: idOpcion,
      tiempoRespuestaMs: Date.now() - inicioPreguntaRef.current,
    });
  }

  return (
    <div className="pantalla">
      <div className="barra">
        <span className="sala-cod">Sala {codigo}</span>
        <span className="usuario">{sesion?.nombre} · {conectado ? "en línea" : "conectando..."}</span>
      </div>

      <div className="tarjeta ancha">
        {/* Estado: esperando (aun no hay pregunta y no termino) */}
        {!pregunta && !termino && (
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

        {/* Estado: pregunta activa */}
        {pregunta && (
          <>
            <div className="ronda-info">
              <span>Ronda {pregunta.ronda} / {pregunta.totalRondas}</span>
              <span className="temporizador">{pregunta.tiempoLimiteSegundos}s</span>
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
            {elegida && <p className="centro">Respuesta enviada. Espera la siguiente ronda.</p>}
            <div style={{ height: 16 }} />
            <button className="btn-fantasma" onClick={siguiente}>Siguiente pregunta ▶</button>
          </>
        )}

        {/* Marcador (siempre que haya datos) */}
        {marcador.length > 0 && (
          <>
            {termino && (
              <div className="fin">
                <div className="display">¡Fin de la partida!</div>
              </div>
            )}
            <h3 style={{ color: "var(--indigo-800)", margin: "20px 0 12px" }}>Marcador</h3>
            <ol className="marcador">
              {marcador.map((j, i) => (
                <li key={j.id}>
                  <span className="pos">{i + 1}</span>
                  <span className="nombre">{j.apodo}</span>
                  <span className="pts">{j.puntaje} pts</span>
                </li>
              ))}
            </ol>
            {termino && (
              <button className="btn-primario" onClick={() => navegar("/lobby")}>
                Volver al inicio
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
