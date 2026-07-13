import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearSala } from "../api";
import { obtenerSesion, cerrarSesion } from "../auth";

export default function Lobby() {
  const navegar = useNavigate();
  const sesion = obtenerSesion();
  const [idBanco, setIdBanco] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function crear() {
    setError("");
    if (!idBanco.trim()) { setError("Escribe el id de un banco de preguntas."); return; }
    setCargando(true);
    try {
      const sala = await crearSala(idBanco.trim());
      navegar("/juego/" + sala.codigo);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function unirse() {
    setError("");
    if (!codigo.trim()) { setError("Escribe un código de sala."); return; }
    navegar("/juego/" + codigo.trim().toUpperCase());
  }

  function salir() {
    cerrarSesion();
    navegar("/");
  }

  return (
    <div className="pantalla">
      <div className="marca">Quiz<b>Arena</b></div>
      <div className="tarjeta">
        <h1 className="titulo">Hola, {sesion?.nombre} 👋</h1>
        <p className="subtitulo">Crea una sala nueva o únete con un código.</p>

        {error && <div className="error">{error}</div>}

        <div className="campo">
          <label>Crear sala — id del banco</label>
          <input
            placeholder="pega el id de un banco"
            value={idBanco}
            onChange={(e) => setIdBanco(e.target.value)}
          />
        </div>
        <button className="btn-accion" style={{ width: "100%" }} onClick={crear} disabled={cargando}>
          {cargando ? "Creando..." : "Crear sala"}
        </button>

        <div style={{ height: 1, background: "#E2E8F0", margin: "24px 0" }} />

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

        <p className="centro">
          <button className="enlace" onClick={salir}>Cerrar sesión</button>
        </p>
      </div>
    </div>
  );
}
