// backend/src/server.js

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const ontology = require("./ontology");

const app  = express();
const PORT = 3000;

app.use(cors());

// Servir frontend
const frontendPath = path.join(__dirname, "../../frontend");
console.log(`📁 Frontend: ${frontendPath}`);
app.use(express.static(frontendPath));

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ─── API: Búsqueda semántica → OWL/RDF-XML ───────────────────────────────────
// CORREGIDO: Ahora usa ASYNC/AWAIT
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  console.log(`\n📥 /api/search?q="${q}"`);

  if (!q) {
    res.setHeader("Content-Type", "application/rdf+xml; charset=utf-8");
    return res.status(400).send(`<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns="http://www.semanticweb.org/sarzuri/ontologies/2026/2/turismo-cochabamba#">
  <owl:NamedIndividual rdf:about="#Error">
    <mensaje>El parámetro 'q' es requerido.</mensaje>
    <message>The 'q' parameter is required.</message>
    <messaggio>Il parametro 'q' è richiesto.</messaggio>
  </owl:NamedIndividual>
</rdf:RDF>`);
  }

  try {
    // CORREGIDO: Usar AWAIT porque buscar es ASÍNCRONA
    const resultados = await ontology.buscar(q);
    console.log(`✅ Resultados encontrados: ${resultados?.length || 0}`);
    
    const owlResponse = ontology.serializarAOWL(resultados, q);
    res.setHeader("Content-Type", "application/rdf+xml; charset=utf-8");
    res.status(200).send(owlResponse);
  } catch (err) {
    console.error("❌ Error en búsqueda:", err);
    res.setHeader("Content-Type", "application/rdf+xml; charset=utf-8");
    res.status(500).send(`<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns="http://www.semanticweb.org/sarzuri/ontologies/2026/2/turismo-cochabamba#">
  <owl:NamedIndividual rdf:about="#Error">
    <mensaje>Error interno del servidor: ${err.message}</mensaje>
    <message>Internal server error: ${err.message}</message>
    <messaggio>Errore interno del server: ${err.message}</messaggio>
  </owl:NamedIndividual>
</rdf:RDF>`);
  }
});

// ─── API: Búsqueda por prefijo (tiempo real) → OWL/RDF-XML ───────────────────
// CORREGIDO: Ahora usa ASYNC/AWAIT
app.get("/api/search-prefix", async (req, res) => {
  const q = (req.query.q || "").trim();
  console.log(`\n⚡ /api/search-prefix?q="${q}" (búsqueda en tiempo real)`);

  if (!q || q.length < 2) {
    res.setHeader("Content-Type", "application/rdf+xml; charset=utf-8");
    return res.status(200).send(`<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns="http://www.semanticweb.org/sarzuri/ontologies/2026/2/turismo-cochabamba#">
  <owl:NamedIndividual rdf:about="#SinResultados">
    <nombre>No se encontraron resultados</nombre>
    <name>No results found</name>
    <nome>Nessun risultato trovato</nome>
    <totalResultados rdf:datatype="xsd:integer">0</totalResultados>
  </owl:NamedIndividual>
</rdf:RDF>`);
  }

  try {
    // CORREGIDO: Usar AWAIT porque buscarPorPrefijo devuelve Promise
    const resultados = await ontology.buscarPorPrefijo(q);
    console.log(`✅ Resultados encontrados (prefijo): ${resultados?.length || 0}`);
    
    const owlResponse = ontology.serializarAOWL(resultados, q);
    res.setHeader("Content-Type", "application/rdf+xml; charset=utf-8");
    res.status(200).send(owlResponse);
  } catch (err) {
    console.error("❌ Error en búsqueda por prefijo:", err);
    res.setHeader("Content-Type", "application/rdf+xml; charset=utf-8");
    res.status(500).send(`<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns="http://www.semanticweb.org/sarzuri/ontologies/2026/2/turismo-cochabamba#">
  <owl:NamedIndividual rdf:about="#Error">
    <mensaje>Error interno del servidor: ${err.message}</mensaje>
    <message>Internal server error: ${err.message}</message>
    <messaggio>Errore interno del server: ${err.message}</messaggio>
  </owl:NamedIndividual>
</rdf:RDF>`);
  }
});

// ─── API: Sugerencias de autocompletado → JSON ───────────────────────────────
app.get("/api/suggest", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q || q.length < 2) return res.json([]);
  try {
    const sugs = ontology.sugerencias(q);
    res.json(sugs);
  } catch (err) {
    console.error("❌ Error en sugerencias:", err);
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor en http://localhost:${PORT}`);
  console.log(`📡 OWL/RDF-XML activo`);
  console.log(`⚡ Búsqueda en tiempo real: /api/search-prefix?q=...`);
  console.log(`💡 Sugerencias en /api/suggest?q=...`);
  console.log(`🌐 Soporte trilingüe: Español, English, Italiano`);
});