import { defineConfig } from "@playwright/test";

// Pruebas de interfaz de QuizArena: corren contra el sistema YA LEVANTADO
// (docker-compose.full.yml en QuizArena-Infra, o "npm run dev" + backends
// sueltos). No arrancan el stack por si mismas: levantarlo implica Postgres,
// Redis y 4 microservicios, y coordinarlo desde aqui seria fragil.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
