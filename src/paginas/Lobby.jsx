import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Encabezado from "../componentes/Encabezado";
import { crearSala, misBancos, bancosOficiales, misAmigos, invitarASala, misInvitacionesSala } from "../api";
import { obtenerSesion } from "../auth";

export default function Lobby() {
  const navegar = useNavigate();
  const sesion = obtenerSesion();

  const [bancos, setBancos] = useState([]);
  const [oficiales, setOficiales] = useState([]);
  const [idBanco, setIdBanco] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Sala recien creada: mientras no se navega a jugar, se puede invitar amigos.
  const [salaCreada, setSalaCreada] = useState(null);
  const [amigos, setAmigos] = useState([]);
  const [invitados, setInvitados] = useState([]);

  const [invitacionesRecibidas, setInvitacionesRecibidas] = useState([]);

  useEffect(() => {
    Promise.all([misBancos(), bancosOficiales()])
      .then(([mios, oficiales]) => {
        setBancos(mios);
        setOficiales(oficiales);
        // Preselecciona el primer banco usable (primero los propios, luego los oficiales)
        const usable = [...mios, ...oficiales].find((b) => b.cantidadPreguntas > 0);
        if (usable) setIdBanco(usable.id);
      })
      .catch((e) => setError(e.message));

    misInvitacionesSala().then(setInvitacionesRecibidas).catch(() => {});
  }, []);

  async function crear() {
    setError("");
    if (!idBanco) { setError("Elige un banco de preguntas."); return; }

    const banco = [...bancos, ...oficiales].find((b) => b.id === idBanco);
    if (banco && banco.cantidadPreguntas === 0) {
      setError("Ese banco no tiene preguntas todavía. Agrégale al menos una.");
      return;
    }

    setCargando(true);
    try {
      const sala = await crearSala(idBanco);
      setSalaCreada(sala);
      misAmigos().then(setAmigos).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function invitar(idAmigo) {
    try {
      await invitarASala(salaCreada.codigo, idAmigo, sesion.nombre);
      setInvitados((prev) => [...prev, idAmigo]);
    } catch (err) {
      setError(err.message);
    }
  }

  function entrarAPartida() {
    navegar("/juego/" + salaCreada.codigo);
  }

  function unirse() {
    setError("");
    if (!codigo.trim()) { setError("Escribe un código de sala."); return; }
    navegar("/juego/" + codigo.trim().toUpperCase());
  }

  return (
    <div className="pantalla">
      <Encabezado />
      <div className="tarjeta">
        <h1 className="titulo">Hola, {sesion?.nombre} 👋</h1>
        <p className="subtitulo">Crea una sala con uno de tus bancos, o únete con un código.</p>

        {error && <div className="error">{error}</div>}

        {salaCreada ? (
          <>
            {/* ---- Sala creada: invitar amigos antes de entrar ---- */}
            <div className="codigo-sala">
              <div className="etiqueta">Sala creada</div>
              <div className="valor">{salaCreada.codigo}</div>
            </div>

            <h3 style={{ color: "var(--texto-claro)", margin: "18px 0 10px" }}>Invita a tus amigos</h3>
            {amigos.length === 0 ? (
              <p className="subtitulo">No tienes amigos agregados todavía. Puedes compartir el código igual.</p>
            ) : (
              <ul className="lista-bancos">
                {amigos.map((a) => (
                  <li key={a.id}>
                    <div className="nombre">{a.nombre}</div>
                    {invitados.includes(a.id) ? (
                      <span className="etiqueta-tipo">Invitado</span>
                    ) : (
                      <button className="btn-fantasma" onClick={() => invitar(a.id)}>Invitar</button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button className="btn-accion" style={{ width: "100%", marginTop: 10 }} onClick={entrarAPartida}>
              Entrar a la partida
            </button>
          </>
        ) : (
          <>
            {/* ---- Crear sala: selector de banco ---- */}
            <div className="campo">
              <label>Banco de preguntas</label>
              {bancos.length === 0 && oficiales.length === 0 ? (
                <p className="subtitulo" style={{ marginBottom: 8 }}>
                  Todavía no tienes bancos.
                </p>
              ) : (
                <select value={idBanco} onChange={(e) => setIdBanco(e.target.value)}>
                  <option value="">— Elige un banco —</option>
                  {bancos.length > 0 && (
                    <optgroup label="Mis bancos">
                      {bancos.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.cantidadPreguntas === 0}>
                          {b.nombre} · {b.materia} ({b.cantidadPreguntas} pregunta{b.cantidadPreguntas === 1 ? "" : "s"})
                          {b.cantidadPreguntas === 0 ? " — sin preguntas" : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {oficiales.length > 0 && (
                    <optgroup label="Bancos predeterminados">
                      {oficiales.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.cantidadPreguntas === 0}>
                          {b.nombre} · {b.materia} ({b.cantidadPreguntas} pregunta{b.cantidadPreguntas === 1 ? "" : "s"})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>

            <button className="btn-accion" style={{ width: "100%" }}
                    onClick={crear} disabled={cargando || (bancos.length === 0 && oficiales.length === 0)}>
              {cargando ? "Creando..." : "Crear sala"}
            </button>

            <p className="centro">
              <button className="enlace" onClick={() => navegar("/bancos")}>
                Crear o editar mis bancos de preguntas
              </button>
            </p>

            <div className="separador" />

            {/* ---- Unirse a sala ---- */}
            <div className="campo">
              <label>Unirse a una sala — código</label>
              <input
                placeholder="EJ: ABC123"
                style={{ textTransform: "uppercase" }}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <button className="btn-primario" onClick={unirse}>Unirme</button>
          </>
        )}

        {invitacionesRecibidas.length > 0 && (
          <>
            <div className="separador" />
            <h3 style={{ color: "var(--texto-claro)", margin: "0 0 10px" }}>Invitaciones recibidas</h3>
            <ul className="lista-bancos">
              {invitacionesRecibidas.map((inv) => (
                <li key={inv.codigo}>
                  <div>
                    <div className="nombre">{inv.nombreInvitador}</div>
                    <div className="meta">{inv.materia} · código {inv.codigo}</div>
                  </div>
                  <button className="btn-accion" onClick={() => navegar("/juego/" + inv.codigo)}>Unirse</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
