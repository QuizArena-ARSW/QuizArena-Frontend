import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, registro } from "../api";
import { guardarSesion } from "../auth";
import Logo from "../componentes/Logo";

export default function Login() {
  const navegar = useNavigate();
  const location = useLocation();
  const [modo, setModo] = useState(location.state?.modo === "registro" ? "registro" : "login");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      if (modo === "registro") {
        await registro(correo, contrasena, nombre);
        navegar("/verificar", { state: { correo } });
        return;
      }
      const resp = await login(correo, contrasena);
      guardarSesion(resp.token, resp.nombre, resp.correo);
      navegar("/lobby");
    } catch (err) {
      setError(err.message);
      if (err.message.includes("verificar tu correo")) {
        navegar("/verificar", { state: { correo } });
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pantalla">
      <Link to="/" className="marca-logo">
        <Logo size={130} />
      </Link>
      <div className="tarjeta">
        <h1 className="titulo">{modo === "login" ? "Entrar" : "Crear cuenta"}</h1>
        <p className="subtitulo">
          {modo === "login"
            ? "Ingresa para crear salas y jugar."
            : "Regístrate para guardar tus partidas."}
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={enviar}>
          {modo === "registro" && (
            <div className="campo">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
          )}
          <div className="campo">
            <label>Correo</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              minLength={modo === "registro" ? 6 : undefined}
              pattern={modo === "registro" ? ".*[^a-zA-Z0-9].*" : undefined}
              title={modo === "registro" ? "Debe tener al menos 6 caracteres e incluir un caracter especial" : undefined}
            />
            {modo === "registro" && (
              <p className="ayuda">Mínimo 6 caracteres, incluyendo al menos un carácter especial (ej. ! @ # $ %).</p>
            )}
          </div>
          <button className="btn-primario" disabled={cargando}>
            {cargando ? "Un momento..." : modo === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p className="centro">
          {modo === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button className="enlace" onClick={() => { setModo(modo === "login" ? "registro" : "login"); setError(""); }}>
            {modo === "login" ? "Regístrate" : "Entra"}
          </button>
        </p>
      </div>
    </div>
  );
}
