// backend/src/server.js
const express  = require("express");
const cors     = require("cors");
const ontology = require("./ontology"); // ← lee TurismoLocal.owx al arrancar

const app  = express();
const PORT = 3000;

// ── Middlewares ──────────────────────────────────────────
app.use(cors());         // Evita bloqueos CORS desde el navegador
app.use(express.json()); // Parsea body JSON (útil más adelante)

// ── GET /api/search?q=<término> ──────────────────────────
app.get("/api/search", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();

  // ✅ Criterio #2: imprimir el término recibido en consola
  console.log(`🔍 Término de búsqueda recibido: "${req.query.q}"`);

  if (!q) {
    return res.status(400).json({ error: "El parámetro 'q' es requerido." });
  }

  // ✅ Criterio #1: consulta sobre la ontología real
  const resultados = ontology.buscar(q);

  // ✅ Criterio #2: devolver código 200 con respuesta JSON
  res.status(200).json({
    query:      req.query.q,
    total:      resultados.length,
    resultados,
  });
});

// ── Arrancar servidor ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});