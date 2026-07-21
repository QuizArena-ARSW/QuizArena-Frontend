import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { bancosOficiales } from "../api";
import { obtenerSesion } from "../auth";
import Logo from "../componentes/Logo";

const CARACTERISTICAS = [
  {
    titulo: "Salas con código",
    texto: "Crea una sala y comparte el código para que se unan al instante, sin configuración.",
  },
  {
    titulo: "Amigos e invitaciones",
    texto: "Agrega amigos por nombre o correo y mándales invitación directa a tu partida activa.",
  },
  {
    titulo: "Bancos personalizados",
    texto: "Crea tus propios bancos de preguntas por materia, o juega con los bancos oficiales.",
  },
  {
    titulo: "Preguntas generadas con IA",
    texto: "Pide preguntas nuevas sobre cualquier tema y la IA las redacta por ti — tú revisas y eliges cuáles agregar.",
  },
  {
    titulo: "Cuentas verificadas",
    texto: "El registro exige confirmar el correo con un código antes de poder iniciar sesión.",
  },
  {
    titulo: "Marcador en vivo",
    texto: "El ranking se actualiza en tiempo real después de cada ronda respondida.",
  },
  {
    titulo: "Preguntas cronometradas",
    texto: "Cada pregunta tiene un tiempo límite visible y avanza sola cuando se acaba.",
  },
];

export default function Landing() {
  const navegar = useNavigate();
  const sesion = obtenerSesion();
  const [materias, setMaterias] = useState(null);

  useEffect(() => {
    bancosOficiales().then(setMaterias).catch(() => setMaterias([]));
  }, []);

  const totalPreguntas = materias?.reduce((acc, b) => acc + b.cantidadPreguntas, 0) ?? null;

  return (
    <div className="landing">
      <nav className="landing-nav">
        <Logo size={68} />
        <div className="landing-nav-enlaces">
          <a href="#caracteristicas">Características</a>
          <a href="#materias">Materias</a>
        </div>
        <div className="landing-nav-cta">
          {sesion ? (
            <button className="btn-fantasma btn-claro" onClick={() => navegar("/lobby")}>Ir al Lobby</button>
          ) : (
            <>
              <button className="btn-fantasma btn-claro" onClick={() => navegar("/login")}>Entrar</button>
              <button className="btn-accion" onClick={() => navegar("/login", { state: { modo: "registro" } })}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </nav>

      <header className="landing-hero">
        <h1 className="landing-titulo">
          DEMUESTRA
          <br />
          <span className="landing-titulo-trazo">TUS</span>
          <br />
          <span className="landing-titulo-degradado">HABILIDADES</span>
        </h1>
        <p className="landing-subtitulo">
          Compite en tiempo real contra tus compañeros. Preguntas de opción múltiple,
          salas por código y un marcador que se actualiza al instante.
        </p>
        <div className="landing-cta">
          <button className="btn-accion" onClick={() => navegar(sesion ? "/lobby" : "/login", sesion ? undefined : { state: { modo: "registro" } })}>
            {sesion ? "Ir al Lobby" : "Crear cuenta gratis"}
          </button>
          {!sesion && (
            <button className="btn-fantasma btn-claro" onClick={() => navegar("/login")}>Ya tengo cuenta</button>
          )}
        </div>

        <div className="landing-stats">
          <div className="landing-stat">
            <div className="landing-stat-valor">{materias === null ? "…" : materias.length}</div>
            <div className="landing-stat-label">Materias oficiales</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-valor">{totalPreguntas === null ? "…" : totalPreguntas}</div>
            <div className="landing-stat-label">Preguntas oficiales</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-valor">∞</div>
            <div className="landing-stat-label">Bancos propios</div>
          </div>
        </div>
      </header>

      <section id="caracteristicas" className="landing-seccion">
        <h2 className="landing-seccion-titulo">Qué puedes hacer</h2>
        <div className="landing-features">
          {CARACTERISTICAS.map((c) => (
            <div className="landing-feature" key={c.titulo}>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {materias && materias.length > 0 && (
        <section id="materias" className="landing-seccion">
          <h2 className="landing-seccion-titulo">Materias disponibles</h2>
          <p className="landing-seccion-subtitulo">
            Bancos oficiales de ingeniería de sistemas, listos para jugar.
          </p>
          <div className="landing-materias">
            {materias.map((m) => (
              <div className="landing-materia" key={m.id}>
                <span className="landing-materia-nombre">{m.materia}</span>
                <span className="landing-materia-cantidad">{m.cantidadPreguntas} preguntas</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="landing-footer">
        <Logo size={30} />
        <span>Proyecto académico de ingeniería de sistemas.</span>
      </footer>
    </div>
  );
}
