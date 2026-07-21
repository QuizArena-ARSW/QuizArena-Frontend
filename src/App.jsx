import { Routes, Route, Navigate } from "react-router-dom";
import { obtenerSesion } from "./auth";
import Landing from "./paginas/Landing";
import Login from "./paginas/Login";
import VerificarCorreo from "./paginas/VerificarCorreo";
import Lobby from "./paginas/Lobby";
import Bancos from "./paginas/Bancos";
import Amigos from "./paginas/Amigos";
import Juego from "./paginas/Juego";

function Privada({ children }) {
  return obtenerSesion() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verificar" element={<VerificarCorreo />} />
      <Route path="/lobby" element={<Privada><Lobby /></Privada>} />
      <Route path="/bancos" element={<Privada><Bancos /></Privada>} />
      <Route path="/amigos" element={<Privada><Amigos /></Privada>} />
      <Route path="/juego/:codigo" element={<Privada><Juego /></Privada>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
