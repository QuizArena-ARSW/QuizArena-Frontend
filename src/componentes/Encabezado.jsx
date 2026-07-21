import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { obtenerSesion, cerrarSesion } from "../auth";
import { solicitudesRecibidas } from "../api";
import Logo from "./Logo";

/** Barra de navegación consistente entre las pantallas autenticadas. */
export default function Encabezado() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const sesion = obtenerSesion();
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    solicitudesRecibidas()
      .then((lista) => setPendientes(lista.length))
      .catch(() => {});
  }, [ubicacion.pathname]);

  function salir() {
    cerrarSesion();
    navegar("/login");
  }

  function irA(ruta) {
    return () => navegar(ruta);
  }

  return (
    <div className="barra">
      <span className="sala-cod marca-logo">
        <Logo size={68} />
      </span>
      <div className="nav-enlaces">
        <button className={"btn-fantasma btn-claro" + (ubicacion.pathname === "/lobby" ? " activo" : "")}
                onClick={irA("/lobby")}>
          Lobby
        </button>
        <button className={"btn-fantasma btn-claro" + (ubicacion.pathname === "/bancos" ? " activo" : "")}
                onClick={irA("/bancos")}>
          Mis bancos
        </button>
        <button className={"btn-fantasma btn-claro" + (ubicacion.pathname === "/amigos" ? " activo" : "")}
                onClick={irA("/amigos")}>
          Amigos{pendientes > 0 && <span className="insignia">{pendientes}</span>}
        </button>
        <span className="usuario">{sesion?.nombre}</span>
        <button className="btn-fantasma btn-claro" onClick={salir}>Cerrar sesión</button>
      </div>
    </div>
  );
}
