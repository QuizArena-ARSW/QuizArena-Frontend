import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, registro } from "../api";
import { guardarSesion } from "../auth";

export default function Login() {
  const navegar = useNavigate();
  const [modo, setModo] = useState("login"); // "login" | "registro"
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
      const resp = modo === "login"
        ? await login(correo, contrasena)
        : await registro(correo, contrasena, nombre);
      guardarSesion(resp.token, resp.nombre, resp.correo);
      navegar("/lobby");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pantalla">
      <div className="marca">Quiz<b>Arena</b></div>
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
            <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
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
