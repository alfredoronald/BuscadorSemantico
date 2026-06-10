// script.js - Buscador Semántico Turismo Cochabamba


const BASE_URL    = "http://localhost:3000/api/search";
const PREFIX_URL  = "http://localhost:3000/api/search-prefix";
const SUGGEST_URL = "http://localhost:3000/api/suggest";

// ============================================================
// IDIOMA
// ============================================================
function detectarIdioma() {
  const idioma = navigator.language || navigator.userLanguage;
  if (idioma.startsWith('it')) return 'it';
  if (idioma.startsWith('en')) return 'en';
  return 'es';
}

const i18n = {
  es: {
    search:"Buscar", placeholder:"Ej: establecimiento, museos, parques, hospedaje, gratuitos…",
    free:"Gratuito", notFree:"Con costo", accessible:"Accesible", discount:"Con descuento",
    reservation:"Requiere reserva", heritage:"Patrimonio Nacional", available:"Disponible",
    noResults:"Sin resultados para", try:"Intenta con otro término.", loading:"Buscando en la ontología…",
    price_night:"Noche", price_day:"Día", entry:"Entrada", approx_cost:"Costo aprox.",
    activities:"Actividades", ingredients:"Ingredientes", route:"Ruta", capacity:"Capacidad",
    frequency:"Frecuencia", dates:"Fechas", origin:"Cultura", conservation:"Conservación",
    includes:"Incluye", services:"Servicios", concurrency:"Concurrencia", schedule:"Horario",
    difficulty:"Dificultad", epoch:"Época", heritage_type:"Tipo patrimonio",
    ecosystem:"Ecosistema", recreation:"Recreación", typical:"Tipo", product:"Producto",
    establishment:"Establecimiento", transport_type:"Tipo transporte", event_type:"Tipo evento",
    nearby:"Cerca de", how_to_get:"Cómo llegar", offers_event:"Ofrece evento",
    held_at:"Se realiza en", offers_food:"Gastronomía", lodging_type:"Tipo hospedaje",
  },
  en: {
    search:"Search", placeholder:"E.g.: restaurants, museums, parks, hotels, free places…",
    free:"Free", notFree:"Paid", accessible:"Accessible", discount:"With discount",
    reservation:"Reservation required", heritage:"National Heritage", available:"Available",
    noResults:"No results for", try:"Try another term.", loading:"Searching ontology…",
    price_night:"Night", price_day:"Day", entry:"Entry", approx_cost:"Approx. cost",
    activities:"Activities", ingredients:"Ingredients", route:"Route", capacity:"Capacity",
    frequency:"Frequency", dates:"Dates", origin:"Culture", conservation:"Conservation",
    includes:"Includes", services:"Services", concurrency:"Attendance", schedule:"Schedule",
    difficulty:"Difficulty", epoch:"Era", heritage_type:"Heritage type",
    ecosystem:"Ecosystem", recreation:"Recreation", typical:"Type", product:"Product",
    establishment:"Establishment", transport_type:"Transport type", event_type:"Event type",
    nearby:"Near", how_to_get:"How to get there", offers_event:"Offers event",
    held_at:"Held at", offers_food:"Gastronomy", lodging_type:"Lodging type",
  },
  it: {
    search:"Cerca", placeholder:"Es: ristoranti, musei, parchi, alloggi, gratuiti…",
    free:"Gratuito", notFree:"A pagamento", accessible:"Accessibile", discount:"Con sconto",
    reservation:"Prenotazione richiesta", heritage:"Patrimonio Nazionale", available:"Disponibile",
    noResults:"Nessun risultato per", try:"Prova con un altro termine.", loading:"Ricerca nell'ontologia…",
    price_night:"Notte", price_day:"Giorno", entry:"Ingresso", approx_cost:"Costo appross.",
    activities:"Attività", ingredients:"Ingredienti", route:"Percorso", capacity:"Capacità",
    frequency:"Frequenza", dates:"Date", origin:"Cultura", conservation:"Conservazione",
    includes:"Include", services:"Servizi", concurrency:"Affluenza", schedule:"Orario",
    difficulty:"Difficoltà", epoch:"Epoca", heritage_type:"Tipo patrimonio",
    ecosystem:"Ecosistema", recreation:"Ricreazione", typical:"Tipo", product:"Prodotto",
    establishment:"Locale", transport_type:"Tipo trasporto", event_type:"Tipo evento",
    nearby:"Vicino a", how_to_get:"Come arrivare", offers_event:"Offre evento",
    held_at:"Si svolge a", offers_food:"Gastronomia", lodging_type:"Tipo alloggio",
  }
};

// ============================================================
// CLASE → COLOR E ÍCONO
// ============================================================
const CLASE_CONFIG = {
  "Atractivo Natural":             { color: "#2d6a4f", icon: "🌿" },
  "Atractivo Cultural Histórico":  { color: "#7b3f00", icon: "🏛️" },
  "Atractivo Recreativo":          { color: "#1a4e8c", icon: "🎡" },
  "Atractivo Arqueológico":        { color: "#5a3e1b", icon: "🏺" },
  "Producto Alimenticio":          { color: "#a8440a", icon: "🍲" },
  "Hospedaje":                     { color: "#4a1942", icon: "🛏️" },
  "Evento Turístico":              { color: "#7d0c3c", icon: "🎉" },
  "Establecimiento Gastronomico":  { color: "#1a5c3a", icon: "🍽️" },
  "Transporte":                    { color: "#1c3a5e", icon: "🚌" },
};

function getClaseConfig(clase) {
  const norm = (s) => (s||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[_]/g," ").trim();
  const nc = norm(clase);
  for (const [key, val] of Object.entries(CLASE_CONFIG)) {
    if (nc.includes(norm(key)) || norm(key).includes(nc)) return val;
  }
  return { color: "#555", icon: "📍" };
}

// ============================================================
// ESTADO
// ============================================================
let currentLang     = detectarIdioma();
let suggestTimeout  = null;
let realtimeTimeout = null;
let currentSugIdx   = -1;

const input       = document.getElementById("searchInput");
const btn         = document.getElementById("searchBtn");
const resultsEl   = document.getElementById("resultados");
const emptyState  = document.getElementById("emptyState");
const suggestBox  = document.getElementById("suggestBox");

const t0 = i18n[currentLang];
input.placeholder = t0.placeholder;
btn.textContent   = t0.search;
console.log(`🌐 Idioma: ${currentLang}`);

// ============================================================
// PARSEO OWL — lee TODOS los campos incluyendo relaciones
// ============================================================
function parseOWL(owlText) {
  const results = [];
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(owlText, "text/xml");
    if (xmlDoc.querySelector("parsererror")) {
      console.error("Error XML al parsear OWL");
      return results;
    }

    const items = xmlDoc.querySelectorAll("owl\\:NamedIndividual, NamedIndividual");

    for (const item of items) {
      const about = item.getAttribute("rdf:about") || "";
      if (!about.includes("Resultado_")) continue;

      // Helper: primer texto de un tag
      const txt  = (tag) => { const el = item.querySelector(tag); return el ? (el.textContent||"").trim() : ""; };
      // Helper: booleano
      const bool = (tag) => { const el = item.querySelector(tag); if (!el) return null; return el.textContent.trim()==="true"; };
      // Helper: número
      const num  = (tag) => { const el = item.querySelector(tag); if (!el||!el.textContent.trim()) return null; const n=parseFloat(el.textContent); return isNaN(n)?null:n; };
      // Helper: lista de tags (para relaciones múltiples)
      const list = (tag) => { const els = item.querySelectorAll(tag); return [...els].map(el=>(el.textContent||"").trim()).filter(Boolean); };

      const e = {
        // Identificación
        nombre:               txt("nombre"),
        clase:                txt("clase"),
        // Tipos específicos por clase
        tipoAtractivo:        txt("tipoAtractivo"),
        tipoEcosistema:       txt("tipoEcosistema"),
        tipoRecreacion:       txt("tipoRecreacion"),
        tipoPatrimonio:       txt("tipoPatrimonio"),
        tipoEvento:           txt("tipoEvento"),
        tipoHospedaje:        txt("tipoHospedaje"),
        tipoTransporte:       txt("tipoTransporte"),
        tipoEstablecimiento:  txt("tipoEstablecimiento"),
        tipoProducto:         txt("tipoProducto"),
        esTipico:             txt("esTipico"),
        // Generales
        descripcion:          txt("descripcion"),
        ubicacion:            txt("ubicacion"),
        horario:              txt("horario"),
        nivelConcurrencia:    txt("nivelConcurrencia"),
        // Booleanos
        gratuito:             bool("gratuito"),
        accesibilidad:        bool("accesibilidad"),
        tieneDescuento:       bool("tieneDescuento"),
        requiereReserva:      bool("requiereReserva"),
        patrimonioNacional:   bool("patrimonioNacional"),
        disponible:           bool("disponible"),
        // Numéricos
        costoEntrada:         num("costoEntrada"),
        precioNoche:          num("precioNoche"),
        precioDia:            num("precioDia"),
        costoAprox:           num("costoAprox"),
        gradoDificultad:      num("gradoDificultad"),
        capacidad:            num("capacidad"),
        // Detalles por clase
        actividades:          txt("actividades"),
        ingredientes:         txt("ingredientes"),
        ruta:                 txt("ruta"),
        epoch:                txt("epoch"),
        culturaOrigen:        txt("culturaOrigen"),
        estadoConservacion:   txt("estadoConservacion"),
        fechaInicio:          txt("fechaInicio"),
        fechaFin:             txt("fechaFin"),
        frecuencia:           txt("frecuencia"),
        incluye:              txt("incluye"),
        servicios:            txt("servicios"),
        // Relaciones (pueden ser múltiples)
        seLlegaPor:           list("seLlegaPor"),
        estaCercaDe:          list("estaCercaDe"),
        ofreceEvento:         list("ofreceEvento"),
        seRealizaEn:          list("seRealizaEn"),
        tieneAtractivo:       list("tieneAtractivo"),
        ofreceGastronomia:    list("ofreceGastronomia"),
        ofreceHospedaje:      list("ofreceHospedaje"),
        ubicadoEn:            list("ubicadoEn"),
      };

      if (e.nombre && e.nombre !== "No se encontraron resultados") results.push(e);
    }
  } catch (err) {
    console.error("Error parseando OWL:", err);
  }
  return results;
}

// ============================================================
// ESCAPE HTML
// ============================================================
function esc(str) {
  if (str === null || str === undefined || str === false) return "";
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ============================================================
// RENDER CARD — muestra TODA la información disponible
// ============================================================
function renderCard(e, t) {
  const cfg   = getClaseConfig(e.clase);
  const color = cfg.color;
  const icon  = cfg.icon;
  const claseLabel = (e.clase||"").replace(/_/g," ");

  // ── Badges de estado ──────────────────────────────────────
  const badges = [];
  if (e.gratuito === true)            badges.push(`<span class="badge badge--free">🆓 ${t.free}</span>`);
  else if (e.gratuito === false)      badges.push(`<span class="badge badge--paid">💰 ${t.notFree}</span>`);
  if (e.accesibilidad === true)       badges.push(`<span class="badge badge--access">♿ ${t.accessible}</span>`);
  if (e.tieneDescuento === true)      badges.push(`<span class="badge badge--discount">🏷️ ${t.discount}</span>`);
  if (e.requiereReserva === true)     badges.push(`<span class="badge badge--reserve">📅 ${t.reservation}</span>`);
  if (e.patrimonioNacional === true)  badges.push(`<span class="badge badge--heritage">🏛️ ${t.heritage}</span>`);
  if (e.disponible === true)          badges.push(`<span class="badge badge--avail">✅ ${t.available}</span>`);
  else if (e.disponible === false)    badges.push(`<span class="badge badge--paid">❌ No disponible</span>`);
  if (e.horario)                      badges.push(`<span class="badge badge--time">⏰ ${esc(e.horario)}</span>`);

  // ── Extras por campo ─────────────────────────────────────
  const extras = [];

  // Tipo específico según clase
  const tipoLabel = e.tipoEstablecimiento || e.tipoHospedaje || e.tipoTransporte ||
                    e.tipoEvento || e.tipoRecreacion || e.tipoEcosistema ||
                    e.tipoPatrimonio || e.tipoProducto || e.tipoAtractivo || "";
  if (tipoLabel) extras.push(`<p class="card-extra">🏷️ ${t.typical}: <strong>${esc(tipoLabel)}</strong></p>`);

  // Gastronomía
  if (e.esTipico)     extras.push(`<p class="card-extra">🍽️ ${t.typical}: ${esc(e.esTipico)}</p>`);
  if (e.ingredientes) extras.push(`<p class="card-extra">🍳 ${t.ingredients}: ${esc(e.ingredientes)}</p>`);
  if (e.servicios)    extras.push(`<p class="card-extra">🛎️ ${t.services}: ${esc(e.servicios)}</p>`);

  // Precios
  if (e.precioNoche !== null && e.precioNoche !== undefined)
    extras.push(`<p class="card-extra">💤 ${t.price_night}: <strong>Bs. ${e.precioNoche}</strong></p>`);
  if (e.precioDia !== null && e.precioDia !== undefined)
    extras.push(`<p class="card-extra">☀️ ${t.price_day}: <strong>Bs. ${e.precioDia}</strong></p>`);
  if (e.costoEntrada !== null && e.costoEntrada !== undefined)
    extras.push(`<p class="card-extra">🎫 ${t.entry}: <strong>Bs. ${e.costoEntrada}</strong></p>`);
  if (e.costoAprox !== null && e.costoAprox !== undefined)
    extras.push(`<p class="card-extra">💵 ${t.approx_cost}: <strong>Bs. ${e.costoAprox}</strong></p>`);

  // Hospedaje
  if (e.incluye)    extras.push(`<p class="card-extra">✨ ${t.includes}: ${esc(e.incluye)}</p>`);

  // Natural / Senderismo
  if (e.actividades) extras.push(`<p class="card-extra">🎯 ${t.activities}: ${esc(e.actividades)}</p>`);
  if (e.gradoDificultad !== null && e.gradoDificultad !== undefined)
    extras.push(`<p class="card-extra">💪 ${t.difficulty}: <strong>${e.gradoDificultad}/5</strong></p>`);
  if (e.tipoEcosistema) extras.push(`<p class="card-extra">🌍 ${t.ecosystem}: ${esc(e.tipoEcosistema)}</p>`);

  // Transporte
  if (e.ruta)       extras.push(`<p class="card-extra">🗺️ ${t.route}: ${esc(e.ruta)}</p>`);
  if (e.capacidad)  extras.push(`<p class="card-extra">👥 ${t.capacity}: ${e.capacidad} pers.</p>`);

  // Eventos
  if (e.tipoEvento)  extras.push(`<p class="card-extra">🎊 ${t.event_type}: ${esc(e.tipoEvento)}</p>`);
  if (e.frecuencia)  extras.push(`<p class="card-extra">🔁 ${t.frequency}: ${esc(e.frecuencia)}</p>`);
  if (e.fechaInicio || e.fechaFin)
    extras.push(`<p class="card-extra">📅 ${t.dates}: ${esc(e.fechaInicio||"")}${e.fechaFin ? " → "+esc(e.fechaFin) : ""}</p>`);

  // Cultural / Histórico
  if (e.epoch)              extras.push(`<p class="card-extra">🕰️ ${t.epoch}: ${esc(e.epoch)}</p>`);
  if (e.tipoPatrimonio)     extras.push(`<p class="card-extra">🏛️ ${t.heritage_type}: ${esc(e.tipoPatrimonio)}</p>`);

  // Arqueológico
  if (e.culturaOrigen)      extras.push(`<p class="card-extra">🏺 ${t.origin}: ${esc(e.culturaOrigen)}</p>`);
  if (e.estadoConservacion) extras.push(`<p class="card-extra">🔍 ${t.conservation}: ${esc(e.estadoConservacion)}</p>`);

  // Concurrencia
  if (e.nivelConcurrencia)  extras.push(`<p class="card-extra">👁️ ${t.concurrency}: ${esc(e.nivelConcurrencia)}</p>`);

  // ── Relaciones entre entidades ────────────────────────────
  const rels = [];
  if (e.seLlegaPor?.length)
    rels.push(`<p class="card-extra card-rel">🚌 ${t.how_to_get}: ${e.seLlegaPor.map(esc).join(", ")}</p>`);
  if (e.estaCercaDe?.length)
    rels.push(`<p class="card-extra card-rel">📍 ${t.nearby}: ${e.estaCercaDe.map(esc).join(", ")}</p>`);
  if (e.ofreceEvento?.length)
    rels.push(`<p class="card-extra card-rel">🎉 ${t.offers_event}: ${e.ofreceEvento.map(esc).join(", ")}</p>`);
  if (e.seRealizaEn?.length)
    rels.push(`<p class="card-extra card-rel">📌 ${t.held_at}: ${e.seRealizaEn.map(esc).join(", ")}</p>`);
  if (e.ofreceGastronomia?.length)
    rels.push(`<p class="card-extra card-rel">🍽️ ${t.offers_food}: ${e.ofreceGastronomia.map(esc).join(", ")}</p>`);
  if (e.tieneAtractivo?.length)
    rels.push(`<p class="card-extra card-rel">🌟 Atractivos: ${e.tieneAtractivo.map(esc).join(", ")}</p>`);

  return `
    <article class="result-card" style="--accent:${color}">
      <div class="card-header">
        <span class="card-icon">${icon}</span>
        <div class="card-clase">${esc(claseLabel)}</div>
      </div>
      <h3 class="card-nombre">${esc(e.nombre || "Sin nombre")}</h3>
      ${e.ubicacion   ? `<p class="card-ubicacion">📍 ${esc(e.ubicacion)}</p>` : ""}
      ${e.descripcion ? `<p class="card-descripcion">${esc(e.descripcion)}</p>` : ""}
      ${badges.length ? `<div class="card-badges">${badges.join("")}</div>` : ""}
      ${extras.length || rels.length
          ? `<div class="card-extras">${extras.join("")}${rels.join("")}</div>`
          : ""}
    </article>`;
}

// ============================================================
// BÚSQUEDA PRINCIPAL
// ============================================================
async function doSearch(q) {
  const query = (typeof q==="string" && q.trim()) ? q.trim() : input.value.trim();
  const t = i18n[currentLang];
  if (!query) { resultsEl.innerHTML=""; emptyState.style.display="flex"; return; }

  hideSuggestions();
  emptyState.style.display = "none";
  resultsEl.innerHTML = `<div class="loading"><div class="loading-spinner"></div><span>${t.loading}</span></div>`;

  try {
    const resp = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/rdf+xml" }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const owlText    = await resp.text();
    const resultados = parseOWL(owlText);

    if (resultados.length === 0) {
      resultsEl.innerHTML = `
        <div class="no-results">
          <span class="no-results-icon">🔭</span>
          <p>${t.noResults} <strong>"${esc(query)}"</strong></p>
          <p class="no-results-sub">${t.try}</p>
        </div>`;
      return;
    }

    resultsEl.innerHTML = resultados.map(e => renderCard(e, t)).join("");
    resultsEl.querySelectorAll(".result-card").forEach((card, i) => {
      card.style.animationDelay = `${i * 50}ms`;
      card.classList.add("card-enter");
    });
    document.querySelector(".results-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
  } catch (err) {
    console.error("Error:", err);
    resultsEl.innerHTML = `
      <div class="no-results">
        <span class="no-results-icon">❌</span>
        <p>Error de conexión. ¿El servidor está corriendo en localhost:3000?</p>
      </div>`;
  }
}

// ============================================================
// BÚSQUEDA EN TIEMPO REAL
// ============================================================
async function doRealtimeSearch(prefijo) {
  const query = prefijo.trim();
  const t = i18n[currentLang];
  if (!query || query.length < 2) {
    if (!query) { emptyState.style.display="flex"; resultsEl.innerHTML=""; }
    return;
  }
  try {
    const resp = await fetch(`${PREFIX_URL}?q=${encodeURIComponent(query)}`, {
      headers: { Accept:"application/rdf+xml" }
    });
    if (!resp.ok) return;
    const resultados = parseOWL(await resp.text());
    if (!resultados.length) return;
    emptyState.style.display = "none";
    resultsEl.innerHTML = resultados.map(e => renderCard(e, t)).join("");
    resultsEl.querySelectorAll(".result-card").forEach((card, i) => {
      card.style.animationDelay = `${i * 50}ms`;
      card.classList.add("card-enter");
    });
  } catch (err) {
    console.error("Error tiempo real:", err);
  }
}

// ============================================================
// SUGERENCIAS
// ============================================================
async function fetchSuggestions(prefijo) {
  try {
    const resp = await fetch(`${SUGGEST_URL}?q=${encodeURIComponent(prefijo)}`);
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return getLocalSuggestions(prefijo);
  }
}

function norm(s) {
  return (s||"").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").trim();
}

function getLocalSuggestions(prefijo) {
  const np = norm(prefijo);
  const local = [
    // Categorías español
    "museos","hospedaje","parques","restaurantes","establecimientos","gastronomia",
    "transporte","eventos","ferias","gratuitos","accesibles","arqueologico","cultural",
    // Categorías inglés
    "museums","hotels","parks","restaurants","food","transport","events","free",
    // Categorías italiano
    "musei","alloggi","parchi","ristoranti","trasporto","gratuito",
    // Nombres de instancias comunes
    "Cristo de la Concordia","Laguna Alalay","Parque Nacional Tunari","Parque Kanata",
    "Parque de la Familia","Parque Cretácico de Sacaba","Palacio Portales",
    "Catedral Metropolitana","Museo Arqueológico UMSS","Silpancho","Pique Macho",
    "Chicharrón Cochabambino","Chicha Cochabambina","El Palacio del Silpancho",
    "Globos","Martínez","Don de Fer","Hotel Cochabamba","Gran Hotel Cochabamba",
  ];
  return local.filter(s => norm(s).includes(np)).slice(0, 6);
}

function showSuggestions(sugs) {
  if (!sugs.length) { hideSuggestions(); return; }
  currentSugIdx = -1;
  suggestBox.innerHTML = sugs.map((s, i) =>
    `<li class="suggest-item" data-idx="${i}" data-val="${esc(s)}">
      <span class="suggest-icon">🔍</span> ${esc(s)}
    </li>`
  ).join("");
  suggestBox.style.display = "block";

  suggestBox.querySelectorAll(".suggest-item").forEach(li => {
    li.addEventListener("mousedown", e => {
      e.preventDefault();
      const val = li.dataset.val;
      input.value = val;
      hideSuggestions();
      clearTimeout(realtimeTimeout);
      clearTimeout(suggestTimeout);
      doSearch(val);
    });
  });
}

function hideSuggestions() {
  suggestBox.style.display = "none";
  currentSugIdx = -1;
}

function navigateSuggestions(dir) {
  const items = suggestBox.querySelectorAll(".suggest-item");
  if (!items.length) return;
  items[currentSugIdx]?.classList.remove("suggest-item--active");
  currentSugIdx = (currentSugIdx + dir + items.length + 1) % (items.length + 1) - 1;
  if (currentSugIdx >= 0) {
    items[currentSugIdx].classList.add("suggest-item--active");
    input.value = items[currentSugIdx].dataset.val;
  }
}

// ============================================================
// CHIPS DE BÚSQUEDA RÁPIDA
// ============================================================
function initChips() {
  document.querySelectorAll(".chip").forEach(chip => {
    if (chip._handler) chip.removeEventListener("click", chip._handler);
    const handler = () => {
      let query = chip.dataset.query;
      if (!query) {
        const textSpan = chip.querySelector('.chip-text');
        if (textSpan) query = textSpan.textContent.trim().toLowerCase();
      }
      if (query) {
        input.value = query;
        hideSuggestions();
        clearTimeout(realtimeTimeout);
        doSearch(query);
        document.querySelector(".results-section")?.scrollIntoView({ behavior:"smooth" });
      }
    };
    chip._handler = handler;
    chip.addEventListener("click", handler);
  });
}

// ============================================================
// EVENTOS DE INPUT
// ============================================================
input.addEventListener("input", () => {
  clearTimeout(suggestTimeout);
  clearTimeout(realtimeTimeout);
  const q = input.value.trim();
  if (q.length < 2) {
    hideSuggestions();
    if (!q) { emptyState.style.display="flex"; resultsEl.innerHTML=""; }
    return;
  }
  suggestTimeout = setTimeout(async () => {
    const sugs = await fetchSuggestions(q);
    showSuggestions(sugs);
  }, 200);
  realtimeTimeout = setTimeout(() => {
    if (input.value.trim().length >= 2) doRealtimeSearch(input.value.trim());
  }, 500);
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    clearTimeout(realtimeTimeout); clearTimeout(suggestTimeout);
    hideSuggestions(); doSearch();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    suggestBox.style.display==="none"
      ? fetchSuggestions(input.value).then(showSuggestions)
      : navigateSuggestions(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault(); navigateSuggestions(-1);
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});

input.addEventListener("blur", () => setTimeout(hideSuggestions, 150));

btn.addEventListener("click", () => {
  clearTimeout(realtimeTimeout); clearTimeout(suggestTimeout); doSearch();
});

// ============================================================
// INIT
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChips);
} else {
  initChips();
}

// ============================================================
// CARRUSEL
// ============================================================
(function() {
  const track = document.getElementById("track");
  if (!track) return;
  const slides = track.children;
  const n = slides.length;
  const dotsEl = document.getElementById("dots");
  let cur = 0, timer;

  if (dotsEl && n > 0) {
    for (let i=0; i<n; i++) {
      const d = document.createElement("button");
      d.className = "dot" + (i===0 ? " active" : "");
      d.setAttribute("aria-label", "Ir a slide " + (i+1));
      d.onclick = () => go(i);
      dotsEl.appendChild(d);
    }
  }

  function go(idx) {
    cur = (idx + n) % n;
    track.style.transform = `translateX(-${cur*100}%)`;
    dotsEl?.querySelectorAll(".dot").forEach((d,i) => d.classList.toggle("active", i===cur));
    resetTimer();
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => go(cur+1), 4500);
  }

  let touchStartX = 0;
  track.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive:true });
  track.addEventListener("touchend",   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff>0 ? cur+1 : cur-1);
  }, { passive:true });

  document.getElementById("prev")?.addEventListener("click", () => go(cur-1));
  document.getElementById("next")?.addEventListener("click", () => go(cur+1));

  if (n > 0) resetTimer();
})();

console.log("✅ Buscador Semántico listo - Trilingüe Español/Inglés/Italiano");