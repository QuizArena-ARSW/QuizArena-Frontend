import { useEffect, useState } from "react";
import Encabezado from "../componentes/Encabezado";
import {
  buscarUsuarios, enviarSolicitudAmistad,
  solicitudesRecibidas, solicitudesEnviadas,
  aceptarSolicitud, rechazarSolicitud,
  misAmigos, eliminarAmigo,
} from "../api";

export default function Amigos() {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => { cargarTodo(); }, []);

  async function cargarTodo() {
    try {
      const [r, e, a] = await Promise.all([solicitudesRecibidas(), solicitudesEnviadas(), misAmigos()]);
      setRecibidas(r);
      setEnviadas(e);
      setAmigos(a);
    } catch (e) {
      setError(e.message);
    }
  }

  async function buscar(e) {
    e.preventDefault();
    setError(""); setAviso("");
    if (!q.trim()) { setResultados([]); return; }
    try {
      setResultados(await buscarUsuarios(q.trim()));
    } catch (e) {
      setError(e.message);
    }
  }

  async function enviar(idDestinatario) {
    setError(""); setAviso("");
    try {
      await enviarSolicitudAmistad(idDestinatario);
      setAviso("Solicitud enviada.");
      await cargarTodo();
    } catch (e) {
      setError(e.message);
    }
  }

  async function responder(id, aceptar) {
    setError(""); setAviso("");
    try {
      await (aceptar ? aceptarSolicitud(id) : rechazarSolicitud(id));
      setAviso(aceptar ? "Ahora son amigos." : "Solicitud rechazada.");
      await cargarTodo();
    } catch (e) {
      setError(e.message);
    }
  }

  async function quitar(idAmigo) {
    setError(""); setAviso("");
    try {
      await eliminarAmigo(idAmigo);
      await cargarTodo();
    } catch (e) {
      setError(e.message);
    }
  }

  function estadoDe(idUsuario) {
    if (amigos.some((a) => a.id === idUsuario)) return "amigo";
    if (enviadas.some((s) => s.otroUsuario.id === idUsuario)) return "pendiente";
    return null;
  }

  return (
    <div className="pantalla">
      <Encabezado />
      <div className="tarjeta ancha">
        <h1 className="titulo" style={{ fontSize: 26 }}>Amigos</h1>
        <p className="subtitulo">Busca a tus compañeros, envía solicitudes e invítalos a jugar.</p>

        {error && <div className="error">{error}</div>}
        {aviso && <div className="aviso">{aviso}</div>}

        {/* ---------- Buscar usuarios ---------- */}
        <form onSubmit={buscar} className="fila">
          <div className="campo" style={{ flex: 3 }}>
            <label>Buscar por nombre o correo</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: Ana o ana@correo.com" />
          </div>
          <button className="btn-accion" style={{ alignSelf: "flex-end", marginBottom: 14 }}>Buscar</button>
        </form>

        {resultados.length > 0 && (
          <ul className="lista-bancos">
            {resultados.map((u) => {
              const estado = estadoDe(u.id);
              return (
                <li key={u.id}>
                  <div>
                    <div className="nombre">{u.nombre}</div>
                    <div className="meta">{u.correo}</div>
                  </div>
                  {estado === "amigo" && <span className="etiqueta-tipo">Ya son amigos</span>}
                  {estado === "pendiente" && <span className="etiqueta-tipo">Pendiente</span>}
                  {!estado && (
                    <button className="btn-fantasma" onClick={() => enviar(u.id)}>Enviar solicitud</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="separador" />

        {/* ---------- Solicitudes recibidas ---------- */}
        <h2 className="titulo" style={{ fontSize: 20 }}>
          Solicitudes recibidas {recibidas.length > 0 && <span className="insignia">{recibidas.length}</span>}
        </h2>
        {recibidas.length === 0 ? (
          <p className="subtitulo">No tienes solicitudes pendientes.</p>
        ) : (
          <ul className="lista-bancos">
            {recibidas.map((s) => (
              <li key={s.id}>
                <div>
                  <div className="nombre">{s.otroUsuario.nombre}</div>
                  <div className="meta">{s.otroUsuario.correo}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-accion" onClick={() => responder(s.id, true)}>Aceptar</button>
                  <button className="btn-fantasma" onClick={() => responder(s.id, false)}>Rechazar</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="separador" />

        {/* ---------- Solicitudes enviadas ---------- */}
        <h2 className="titulo" style={{ fontSize: 20 }}>Solicitudes enviadas</h2>
        {enviadas.length === 0 ? (
          <p className="subtitulo">No tienes solicitudes enviadas pendientes.</p>
        ) : (
          <ul className="lista-bancos">
            {enviadas.map((s) => (
              <li key={s.id}>
                <div>
                  <div className="nombre">{s.otroUsuario.nombre}</div>
                  <div className="meta">{s.otroUsuario.correo}</div>
                </div>
                <span className="etiqueta-tipo">Pendiente</span>
              </li>
            ))}
          </ul>
        )}

        <div className="separador" />

        {/* ---------- Mis amigos ---------- */}
        <h2 className="titulo" style={{ fontSize: 20 }}>Mis amigos</h2>
        {amigos.length === 0 ? (
          <p className="subtitulo">Todavía no tienes amigos agregados.</p>
        ) : (
          <ul className="lista-bancos">
            {amigos.map((a) => (
              <li key={a.id}>
                <div>
                  <div className="nombre">{a.nombre}</div>
                  <div className="meta">{a.correo}</div>
                </div>
                <button className="btn-fantasma" onClick={() => quitar(a.id)}>Quitar</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
