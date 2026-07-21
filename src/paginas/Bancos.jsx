import { useEffect, useState } from "react";
import Encabezado from "../componentes/Encabezado";
import { misBancos, crearBanco, obtenerBanco, agregarPregunta, generarPreguntasIA } from "../api";

const OPCION_VACIA = { texto: "", esCorrecta: false };

export default function Bancos() {
  const [bancos, setBancos] = useState([]);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // --- Crear banco ---
  const [nombre, setNombre] = useState("");
  const [materia, setMateria] = useState("");

  // --- Banco seleccionado y su editor de preguntas ---
  const [bancoAbierto, setBancoAbierto] = useState(null); // banco completo con preguntas

  // --- Formulario de pregunta nueva ---
  const [tipo, setTipo] = useState("OPCION_MULTIPLE");
  const [enunciado, setEnunciado] = useState("");
  const [segundos, setSegundos] = useState(20);
  const [opciones, setOpciones] = useState([
    { ...OPCION_VACIA }, { ...OPCION_VACIA }, { ...OPCION_VACIA }, { ...OPCION_VACIA },
  ]);
  const [vfCorrecta, setVfCorrecta] = useState("V"); // para verdadero/falso

  // --- Generación de preguntas con IA (bono) ---
  const [mostrarIA, setMostrarIA] = useState(false);
  const [temaIA, setTemaIA] = useState("");
  const [cantidadIA, setCantidadIA] = useState(5);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [agregandoIA, setAgregandoIA] = useState(false);
  const [borradores, setBorradores] = useState([]); // [{ enunciado, opciones, seleccionada }]

  useEffect(() => { cargarBancos(); }, []);

  async function cargarBancos() {
    try {
      setBancos(await misBancos());
    } catch (e) {
      setError(e.message);
    }
  }

  async function onCrearBanco(e) {
    e.preventDefault();
    setError(""); setAviso("");
    try {
      await crearBanco(nombre, materia);
      setNombre(""); setMateria("");
      setAviso("Banco creado.");
      cargarBancos();
    } catch (e) {
      setError(e.message);
    }
  }

  async function abrirBanco(id) {
    setError(""); setAviso("");
    try {
      setBancoAbierto(await obtenerBanco(id));
      limpiarFormulario();
      setMostrarIA(false);
      setBorradores([]);
    } catch (e) {
      setError(e.message);
    }
  }

  function limpiarFormulario() {
    setEnunciado("");
    setSegundos(20);
    setOpciones([{ ...OPCION_VACIA }, { ...OPCION_VACIA }, { ...OPCION_VACIA }, { ...OPCION_VACIA }]);
    setVfCorrecta("V");
  }

  function cambiarOpcion(i, campo, valor) {
    const copia = opciones.map((o, idx) => {
      if (campo === "esCorrecta") {
        // Solo una correcta: marcar esta y desmarcar las demas
        return { ...o, esCorrecta: idx === i };
      }
      return idx === i ? { ...o, [campo]: valor } : o;
    });
    setOpciones(copia);
  }

  async function onAgregarPregunta(e) {
    e.preventDefault();
    setError(""); setAviso("");

    let opcionesFinales;
    if (tipo === "VERDADERO_FALSO") {
      opcionesFinales = [
        { texto: "Verdadero", esCorrecta: vfCorrecta === "V" },
        { texto: "Falso", esCorrecta: vfCorrecta === "F" },
      ];
    } else {
      opcionesFinales = opciones
        .filter((o) => o.texto.trim() !== "")
        .map((o) => ({ texto: o.texto.trim(), esCorrecta: o.esCorrecta }));

      if (opcionesFinales.length < 2) {
        setError("Escribe al menos 2 opciones.");
        return;
      }
      if (!opcionesFinales.some((o) => o.esCorrecta)) {
        setError("Marca cuál es la opción correcta.");
        return;
      }
    }

    try {
      await agregarPregunta(bancoAbierto.id, {
        enunciado: enunciado.trim(),
        tipo,
        tiempoLimiteSegundos: Number(segundos),
        opciones: opcionesFinales,
      });
      setAviso("Pregunta agregada.");
      limpiarFormulario();
      await abrirBanco(bancoAbierto.id); // recarga con la pregunta nueva
      cargarBancos();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onGenerarIA(e) {
    e.preventDefault();
    setError(""); setAviso("");
    setCargandoIA(true);
    setBorradores([]);
    try {
      const generadas = await generarPreguntasIA(bancoAbierto.materia, temaIA.trim(), Number(cantidadIA));
      setBorradores(generadas.map((p) => ({ ...p, seleccionada: true })));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargandoIA(false);
    }
  }

  function alternarBorrador(i) {
    setBorradores((prev) => prev.map((b, idx) => idx === i ? { ...b, seleccionada: !b.seleccionada } : b));
  }

  async function onAgregarSeleccionadas() {
    setError(""); setAviso("");
    const elegidas = borradores.filter((b) => b.seleccionada);
    if (elegidas.length === 0) {
      setError("Selecciona al menos una pregunta para agregar.");
      return;
    }
    setAgregandoIA(true);
    try {
      for (const b of elegidas) {
        await agregarPregunta(bancoAbierto.id, {
          enunciado: b.enunciado,
          tipo: "OPCION_MULTIPLE",
          tiempoLimiteSegundos: 25,
          opciones: b.opciones,
        });
      }
      setAviso(`${elegidas.length} pregunta(s) agregada(s) con IA.`);
      setBorradores([]);
      setTemaIA("");
      setMostrarIA(false);
      await abrirBanco(bancoAbierto.id);
      cargarBancos();
    } catch (e) {
      setError(e.message);
    } finally {
      setAgregandoIA(false);
    }
  }

  return (
    <div className="pantalla">
      <Encabezado />

      <div className="tarjeta ancha">
        {error && <div className="error">{error}</div>}
        {aviso && <div className="aviso">{aviso}</div>}

        {/* ---------- Crear banco ---------- */}
        <h2 className="titulo" style={{ fontSize: 22 }}>Crear un banco</h2>
        <p className="subtitulo">Un banco agrupa las preguntas de una materia.</p>
        <form onSubmit={onCrearBanco}>
          <div className="fila">
            <div className="campo">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                     placeholder="Ej: Parcial 2" required />
            </div>
            <div className="campo">
              <label>Materia</label>
              <input value={materia} onChange={(e) => setMateria(e.target.value)}
                     placeholder="Ej: Arquitectura" required />
            </div>
          </div>
          <button className="btn-accion">Crear banco</button>
        </form>

        <div className="separador" />

        {/* ---------- Lista de bancos ---------- */}
        <h2 className="titulo" style={{ fontSize: 22 }}>Tus bancos</h2>
        {bancos.length === 0 && <p className="subtitulo">Todavía no tienes bancos. Crea uno arriba.</p>}
        <ul className="lista-bancos">
          {bancos.map((b) => (
            <li key={b.id} className={bancoAbierto?.id === b.id ? "activo" : ""}>
              <div>
                <div className="nombre">{b.nombre}</div>
                <div className="meta">{b.materia} · {b.cantidadPreguntas} pregunta(s)</div>
              </div>
              <button className="btn-fantasma" onClick={() => abrirBanco(b.id)}>
                {bancoAbierto?.id === b.id ? "Editando" : "Agregar preguntas"}
              </button>
            </li>
          ))}
        </ul>

        {/* ---------- Editor de preguntas ---------- */}
        {bancoAbierto && (
          <>
            <div className="separador" />
            <h2 className="titulo" style={{ fontSize: 22 }}>
              Preguntas de “{bancoAbierto.nombre}”
            </h2>

            {bancoAbierto.preguntas?.length > 0 && (
              <ol className="lista-preguntas">
                {bancoAbierto.preguntas.map((p) => (
                  <li key={p.id}>
                    <span className="enunciado-mini">{p.enunciado}</span>
                    <span className="etiqueta-tipo">
                      {p.tipo === "VERDADERO_FALSO" ? "V/F" : "Opción múltiple"} · {p.tiempoLimiteSegundos}s
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {/* ---------- Generar preguntas con IA (bono) ---------- */}
            <div className="separador" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ color: "var(--texto-claro)", margin: 0 }}>Generar preguntas con IA</h3>
              <button type="button" className="btn-fantasma" onClick={() => setMostrarIA((v) => !v)}>
                {mostrarIA ? "Ocultar" : "Abrir"}
              </button>
            </div>

            {mostrarIA && (
              <>
                <form onSubmit={onGenerarIA} style={{ marginTop: 12 }}>
                  <div className="fila">
                    <div className="campo">
                      <label>Tema (dentro de "{bancoAbierto.materia}")</label>
                      <input value={temaIA} onChange={(e) => setTemaIA(e.target.value)}
                             placeholder="Ej: Normalización de bases de datos" required />
                    </div>
                    <div className="campo">
                      <label>Cantidad</label>
                      <input type="number" min="1" max="15" value={cantidadIA}
                             onChange={(e) => setCantidadIA(e.target.value)} required />
                    </div>
                  </div>
                  <button className="btn-accion" disabled={cargandoIA}>
                    {cargandoIA ? "Generando..." : "Generar"}
                  </button>
                </form>

                {borradores.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p className="subtitulo" style={{ marginBottom: 10 }}>
                      Revisa y elige cuáles agregar al banco:
                    </p>
                    <ul className="lista-preguntas">
                      {borradores.map((b, i) => (
                        <li key={i} style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                          <div className="fila-opcion" style={{ marginBottom: 0 }}>
                            <input type="checkbox" checked={b.seleccionada} onChange={() => alternarBorrador(i)} />
                            <span className="enunciado-mini">{b.enunciado}</span>
                          </div>
                          <div style={{ paddingLeft: 30, fontSize: 13, color: "var(--texto-tenue)" }}>
                            {b.opciones.map((o, j) => (
                              <div key={j} style={{ color: o.esCorrecta ? "var(--violeta-300)" : undefined }}>
                                {o.esCorrecta ? "✓ " : "— "}{o.texto}
                              </div>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button className="btn-primario" onClick={onAgregarSeleccionadas} disabled={agregandoIA}>
                      {agregandoIA ? "Agregando..." : `Agregar seleccionadas (${borradores.filter((b) => b.seleccionada).length})`}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="separador" />
            <h3 style={{ color: "var(--texto-claro)", margin: "18px 0 10px" }}>Nueva pregunta</h3>
            <form onSubmit={onAgregarPregunta}>
              <div className="fila">
                <div className="campo">
                  <label>Tipo de pregunta</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="OPCION_MULTIPLE">Opción múltiple</option>
                    <option value="VERDADERO_FALSO">Verdadero / Falso</option>
                  </select>
                </div>
                <div className="campo">
                  <label>Tiempo límite (segundos)</label>
                  <input type="number" min="5" max="120" value={segundos}
                         onChange={(e) => setSegundos(e.target.value)} required />
                </div>
              </div>

              <div className="campo">
                <label>Enunciado</label>
                <input value={enunciado} onChange={(e) => setEnunciado(e.target.value)}
                       placeholder="Escribe la pregunta" required />
              </div>

              {tipo === "OPCION_MULTIPLE" ? (
                <div className="campo">
                  <label>Opciones — marca la correcta</label>
                  {opciones.map((o, i) => (
                    <div className="fila-opcion" key={i}>
                      <input
                        type="radio"
                        name="correcta"
                        checked={o.esCorrecta}
                        onChange={() => cambiarOpcion(i, "esCorrecta", true)}
                        title="Marcar como correcta"
                      />
                      <input
                        value={o.texto}
                        onChange={(e) => cambiarOpcion(i, "texto", e.target.value)}
                        placeholder={"Opción " + (i + 1) + (i > 1 ? " (opcional)" : "")}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="campo">
                  <label>¿Cuál es la respuesta correcta?</label>
                  <select value={vfCorrecta} onChange={(e) => setVfCorrecta(e.target.value)}>
                    <option value="V">Verdadero</option>
                    <option value="F">Falso</option>
                  </select>
                </div>
              )}

              <button className="btn-primario">Agregar pregunta</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
