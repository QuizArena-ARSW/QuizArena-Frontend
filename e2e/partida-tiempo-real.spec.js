import { test, expect, request } from "@playwright/test";
import { execFileSync } from "node:child_process";

// Caso de uso en TIEMPO REAL de QuizArena: dos jugadores en sesiones de
// navegador independientes deben ver la misma pregunta al mismo tiempo y
// ver el marcador de ambos actualizarse en vivo. Esta es la evidencia
// funcional que pide la sustentacion para el flujo en tiempo real.
//
// El registro/verificacion de cuenta se hace por API (ya esta cubierto por
// las pruebas de integracion de Identidad); esta suite se enfoca en la
// experiencia de UI del juego en si.
//
// Requiere el sistema levantado localmente (docker-compose.full.yml) y el
// contenedor de Postgres de Identidad accesible via `docker exec` para leer
// el codigo de verificacion (no se expone por la API, a proposito).

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8080";
const CONTENEDOR_DB_IDENTIDAD = process.env.CONTENEDOR_DB_IDENTIDAD || "quizarena-infra-postgres-identidad-1";

function obtenerCodigoVerificacion(correo) {
  const salida = execFileSync("docker", [
    "exec", CONTENEDOR_DB_IDENTIDAD,
    "psql", "-U", "quizarena", "-d", "identidad_db", "-t", "-A",
    "-c", `SELECT codigo_verificacion FROM usuario WHERE correo='${correo}'`,
  ]);
  return salida.toString().trim();
}

async function crearUsuarioVerificado(nombre) {
  const correo = `e2e.${nombre.toLowerCase()}.${Date.now()}@quizarena.test`;
  const contrasena = "Contrasena123!";
  const api = await request.newContext({ baseURL: GATEWAY_URL });

  const registro = await api.post("/api/auth/registro", {
    data: { correo, contrasena, nombre },
  });
  expect(registro.ok(), `registro de ${nombre} debe responder 200`).toBeTruthy();

  const codigo = obtenerCodigoVerificacion(correo);
  const verificar = await api.post("/api/auth/verificar", {
    data: { correo, codigo },
  });
  expect(verificar.ok(), `verificacion de ${nombre} debe responder 200`).toBeTruthy();

  await api.dispose();
  return { correo, contrasena, nombre };
}

async function loguear(page, usuario) {
  await page.goto("/login");
  const inputs = page.locator("input");
  await inputs.nth(0).fill(usuario.correo);
  await inputs.nth(1).fill(usuario.contrasena);
  await page.click("button.btn-primario");
  await page.waitForURL("**/lobby");
}

test("dos jugadores ven la misma pregunta y el marcador se sincroniza en tiempo real", async ({ browser }) => {
  const anfitrion = await crearUsuarioVerificado("Anfitrion");
  const invitado = await crearUsuarioVerificado("Invitado");

  const contextoA = await browser.newContext();
  const contextoB = await browser.newContext();
  const paginaAnfitrion = await contextoA.newPage();
  const paginaInvitado = await contextoB.newPage();

  await loguear(paginaAnfitrion, anfitrion);
  await loguear(paginaInvitado, invitado);

  // --- El anfitrion crea la sala (el lobby preselecciona un banco oficial) ---
  await paginaAnfitrion.click('button.btn-accion:has-text("Crear sala")');
  await expect(paginaAnfitrion.locator(".codigo-sala .valor")).toBeVisible();
  const codigo = (await paginaAnfitrion.locator(".codigo-sala .valor").textContent()).trim();
  expect(codigo).toMatch(/^[A-Z0-9]{6}$/);

  await paginaAnfitrion.click('button.btn-accion:has-text("Entrar a la partida")');
  await paginaAnfitrion.waitForURL(`**/juego/${codigo}`);

  // --- El invitado se une con el codigo ---
  await paginaInvitado.fill('input[placeholder="EJ: ABC123"]', codigo);
  await paginaInvitado.click('button.btn-primario:has-text("Unirme")');
  await paginaInvitado.waitForURL(`**/juego/${codigo}`);

  // --- Ambos deben verse en la lista de jugadores antes de iniciar ---
  await expect(paginaAnfitrion.locator(".jugadores .chip")).toHaveCount(2, { timeout: 10_000 });
  await expect(paginaInvitado.locator(".jugadores .chip")).toHaveCount(2, { timeout: 10_000 });

  // --- El anfitrion inicia la partida ---
  await paginaAnfitrion.click('button.btn-accion:has-text("Iniciar partida")');

  for (let ronda = 1; ronda <= 2; ronda++) {
    // La MISMA pregunta debe llegar a ambos jugadores. Se espera (con poll)
    // a que CADA pagina muestre el numero de ronda correcto antes de leer
    // el enunciado: una lectura de una sola vez, en cualquiera de los dos
    // lados, puede atrapar el DOM a mitad de pintar la actualizacion que
    // acaba de llegar por WebSocket y dar un falso mismatch.
    const marcaRonda = new RegExp(`Ronda ${ronda}\\s*/`);
    await expect(paginaAnfitrion.locator(".ronda-info")).toHaveText(marcaRonda, { timeout: 10_000 });
    await expect(paginaInvitado.locator(".ronda-info")).toHaveText(marcaRonda, { timeout: 10_000 });

    const enunciadoAnfitrion = await paginaAnfitrion.locator(".enunciado").textContent();
    const enunciadoInvitado = await paginaInvitado.locator(".enunciado").textContent();
    expect(enunciadoInvitado).toBe(enunciadoAnfitrion);

    // Cada jugador responde (la opcion elegida no importa para esta prueba)
    await paginaAnfitrion.locator(".opciones button").first().click();
    await paginaInvitado.locator(".opciones button").first().click();

    // Con que UNO pida avanzar alcanza: el backend ignora pedidos
    // duplicados de otros jugadores para la misma ronda (round-guard), y
    // difunde el avance a ambos por WebSocket.
    await paginaAnfitrion.click('button:has-text("Siguiente pregunta")');
  }

  // --- El marcador debe reflejar a los 2 jugadores para ambos, en vivo ---
  await expect(paginaAnfitrion.locator(".marcador li")).toHaveCount(2, { timeout: 10_000 });
  await expect(paginaInvitado.locator(".marcador li")).toHaveCount(2, { timeout: 10_000 });

  await contextoA.close();
  await contextoB.close();
});
