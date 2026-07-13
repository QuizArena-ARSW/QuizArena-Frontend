import { Routes, Route, Navigate } from "react-router-dom";
import { obtenerSesion } from "./auth";
import Login from "./paginas/Login";
import Lobby from "./paginas/Lobby";
import Juego from "./paginas/Juego";

// Protege rutas: si no hay sesion, manda al login
function Privada({ children }) {
  return obtenerSesion() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/lobby" element={<Privada><Lobby /></Privada>} />
      <Route path="/juego/:codigo" element={<Privada><Juego /></Privada>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
