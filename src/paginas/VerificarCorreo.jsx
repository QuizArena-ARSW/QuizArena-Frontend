import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verificarCorreo, reenviarCodigo } from "../api";
import { guardarSesion } from "../auth";
import Logo from "../componentes/Logo";

export default function VerificarCorreo() {
  const navegar = useNavigate();
  const location = useLocation();
  const correoInicial = location.state?.correo || "";

  const [correo, setCorreo] = useState(correoInicial);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  async function confirmar(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);
    try {
      const resp = await verificarCorreo(correo, codigo);
      guardarSesion(resp.token, resp.nombre, resp.correo);
      navegar("/lobby");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function reenviar() {
    setError("");
    setMensaje("");
    if (!correo.trim()) { setError("Escribe tu correo primero."); return; }
    setReenviando(true);
    try {
      await reenviarCodigo(correo);
      setMensaje("Te enviamos un nuevo código.");
    } catch (err) {
      setError(err.message);
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="pantalla">
      <div className="marca-logo">
        <Logo size={130} />
      </div>
      <div className="tarjeta">
        <h1 className="titulo">Verifica tu correo</h1>
        <p className="subtitulo">
          Te enviamos un código de 6 dígitos a tu correo. Ingrésalo para activar tu cuenta.
        </p>

        {error && <div className="error">{error}</div>}
        {mensaje && <div className="aviso">{mensaje}</div>}

        <form onSubmit={confirmar}>
          <div className="campo">
            <label>Correo</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </div>
          <div className="campo">
            <label>Código</label>
            <input
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <button className="btn-primario" disabled={cargando}>
            {cargando ? "Verificando..." : "Verificar"}
          </button>
        </form>

        <p className="centro">
          ¿No te llegó? {" "}
          <button className="enlace" onClick={reenviar} disabled={reenviando}>
            {reenviando ? "Enviando..." : "Reenviar código"}
          </button>
        </p>
        <p className="centro">
          <button className="enlace" onClick={() => navegar("/login")}>Volver a iniciar sesión</button>
        </p>
      </div>
    </div>
  );
}
