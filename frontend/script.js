// script.js - Buscador Semántico Turismo Cochabamba
// CONECTADO A DBPEDIA Y WIKIPEDIA - VERSIÓN CORREGIDA

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
    dbpedia_info:"Información de DBpedia", wikipedia_link:"Ver en Wikipedia", coordinates:"Coordenadas",
    dbpedia_link:"Ver en DBpedia",
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
    dbpedia_info:"DBpedia information", wikipedia_link:"View on Wikipedia", coordinates:"Coordinates",
    dbpedia_link:"View on DBpedia",
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
    dbpedia_info:"Informazioni DBpedia", wikipedia_link:"Vedi su Wikipedia", coordinates:"Coordinate",
    dbpedia_link:"Vedi su DBpedia",
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
// FUNCIÓN PARA OBTENER EL NOMBRE CORRECTO DE DBPEDIA DESDE WIKIPEDIA
// ============================================================
function obtenerNombreDBpediaDesdeWikipedia(wikiPageUrl) {
  if (!wikiPageUrl) return null;
  // Extraer el título de la URL de Wikipedia
  // Ejemplo: https://en.wikipedia.org/wiki/Pique_macho -> Pique_macho
  const match = wikiPageUrl.match(/\/wiki\/([^#?]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

// ============================================================
// FUNCIÓN PARA GENERAR ENLACE DBPEDIA (SIN ALTERNATIVAS)
// ============================================================
function generarEnlaceDBpedia(entidad) {
  // 1. Prioridad: Desde la URL de Wikipedia (la fuente más confiable)
  if (entidad.dbpedia?.wikiPage) {
    const nombreCorrecto = obtenerNombreDBpediaDesdeWikipedia(entidad.dbpedia.wikiPage);
    if (nombreCorrecto) {
      return `https://dbpedia.org/resource/${nombreCorrecto}`;
    }
  }
  
  // 2. Desde el campo sameAs (viene de la ontología)
  if (entidad.sameAs && entidad.sameAs.length) {
    const dbpediaLink = entidad.sameAs.find(link => link.includes("dbpedia.org/resource/"));
    if (dbpediaLink) return dbpediaLink;
  }
  
  // 3. Fallback: desde el nombre normalizado (por si no hay Wikipedia)
  if (entidad.nombre) {
    const nombreNormalizado = entidad.nombre
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    
    if (nombreNormalizado) {
      // Para "Parque Nacional Tunari" -> "Tunari_National_Park"
      if (entidad.nombre.toLowerCase().includes("parque nacional")) {
        const resto = entidad.nombre.replace(/Parque Nacional/i, '').trim();
        if (resto) {
          const nombreIngles = resto.replace(/\s+/g, '_') + "_National_Park";
          return `https://dbpedia.org/resource/${nombreIngles}`;
        }
      }
      return `https://dbpedia.org/resource/${nombreNormalizado}`;
    }
  }
  
  return null;
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

if (input) {
  const t0 = i18n[currentLang];
  input.placeholder = t0.placeholder;
  if (btn) btn.textContent = t0.search;
}
console.log(`🌐 Idioma: ${currentLang}`);

// ============================================================
// PARSEO OWL — VERSIÓN CORREGIDA CON getElementsByTagName
// ============================================================
function parseOWL(owlText) {
  const results = [];
  
  // LOG DE DEPURACIÓN: Ver primeros 500 caracteres del XML
  console.log("📄 XML recibido (primeros 500 caracteres):");
  console.log(owlText.substring(0, 500));
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(owlText, "text/xml");
    
    // Verificar error de parsing
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error("Error XML al parsear OWL:", parserError.textContent);
      return results;
    }

    // Buscar TODOS los elementos NamedIndividual (cualquier prefijo)
    const items = xmlDoc.getElementsByTagNameNS("*", "NamedIndividual");
    
    // Si no encuentra con namespace, buscar por nombre local
    let allItems = [];
    if (items.length === 0) {
      const allElements = xmlDoc.getElementsByTagName("*");
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        const localName = el.localName || el.tagName;
        if (localName && localName.toLowerCase() === "namedindividual") {
          allItems.push(el);
        }
      }
    } else {
      allItems = Array.from(items);
    }
    
    // También buscar elementos con rdf:about que contengan "Resultado_"
    const resultadoItems = xmlDoc.querySelectorAll("[rdf\\:about*='Resultado_'], [about*='Resultado_']");
    for (let i = 0; i < resultadoItems.length; i++) {
      if (!allItems.includes(resultadoItems[i])) {
        allItems.push(resultadoItems[i]);
      }
    }
    
    console.log(`📄 Encontrados ${allItems.length} individuos en el XML`);

    for (const item of allItems) {
      const about = item.getAttribute("rdf:about") || item.getAttribute("about") || "";
      if (!about.includes("Resultado_") && !about.includes("Resultado")) continue;

      // Función para obtener texto de un tag por nombre (usando getElementsByTagName)
      const getText = (tagName) => {
        // Buscar por getElementsByTagName (más tolerante con namespaces)
        const elements = item.getElementsByTagName(tagName);
        if (elements.length > 0) {
          return (elements[0].textContent || "").trim();
        }
        // Buscar por getElementsByTagNameNS (con cualquier namespace)
        const elementsNS = item.getElementsByTagNameNS("*", tagName);
        if (elementsNS.length > 0) {
          return (elementsNS[0].textContent || "").trim();
        }
        return "";
      };
      
      // Función para obtener booleanos
      const getBool = (tagName) => {
        const val = getText(tagName);
        return val === "true";
      };
      
      // Función para obtener números
      const getNum = (tagName) => {
        const val = getText(tagName);
        if (!val) return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
      };
      
      // Función para obtener lista de relaciones
      const getList = (tagName) => {
        const list = [];
        const elements = item.getElementsByTagName(tagName);
        for (let i = 0; i < elements.length; i++) {
          const text = (elements[i].textContent || "").trim();
          if (text) list.push(text);
        }
        return list;
      };
      
      // Función para obtener owl:sameAs links
      const getSameAsLinks = () => {
        const links = [];
        const elements = item.getElementsByTagName("sameAs");
        for (let i = 0; i < elements.length; i++) {
          const resource = elements[i].getAttribute("rdf:resource") || elements[i].getAttribute("resource");
          if (resource) links.push(resource);
        }
        return links;
      };

      const nombre = getText("nombre");
      console.log(`📝 Procesando individuo, nombre encontrado: "${nombre}"`);
      
      if (!nombre || nombre === "") continue;

      // Leer dbpedia
      const dbpedia = {
        label:      getText("dbpediaLabel"),
        abstract:   getText("dbpediaAbstract"),
        thumbnail:  getText("dbpediaThumbnail"),
        lat:        getNum("dbpediaLat"),
        long:       getNum("dbpediaLong"),
        wikiPage:   getText("dbpediaWikiPage")
      };
      const hasDbpedia = dbpedia.label || dbpedia.abstract || dbpedia.thumbnail || dbpedia.lat || dbpedia.long || dbpedia.wikiPage;

      const entidad = {
        nombre:               nombre,
        clase:                getText("clase"),
        tipoAtractivo:        getText("tipoAtractivo"),
        tipoEcosistema:       getText("tipoEcosistema"),
        tipoRecreacion:       getText("tipoRecreacion"),
        tipoPatrimonio:       getText("tipoPatrimonio"),
        tipoEvento:           getText("tipoEvento"),
        tipoHospedaje:        getText("tipoHospedaje"),
        tipoTransporte:       getText("tipoTransporte"),
        tipoEstablecimiento:  getText("tipoEstablecimiento"),
        tipoProducto:         getText("tipoProducto"),
        esTipico:             getText("esTipico"),
        descripcion:          getText("descripcion"),
        ubicacion:            getText("ubicacion"),
        horario:              getText("horario"),
        nivelConcurrencia:    getText("nivelConcurrencia"),
        gratuito:             getBool("gratuito"),
        accesibilidad:        getBool("accesibilidad"),
        tieneDescuento:       getBool("tieneDescuento"),
        requiereReserva:      getBool("requiereReserva"),
        patrimonioNacional:   getBool("patrimonioNacional"),
        disponible:           getBool("disponible"),
        costoEntrada:         getNum("costoEntrada"),
        precioNoche:          getNum("precioNoche"),
        precioDia:            getNum("precioDia"),
        costoAprox:           getNum("costoAprox"),
        gradoDificultad:      getNum("gradoDificultad"),
        capacidad:            getNum("capacidad"),
        actividades:          getText("actividades"),
        ingredientes:         getText("ingredientes"),
        ruta:                 getText("ruta"),
        epoch:                getText("epoch"),
        culturaOrigen:        getText("culturaOrigen"),
        estadoConservacion:   getText("estadoConservacion"),
        fechaInicio:          getText("fechaInicio"),
        fechaFin:             getText("fechaFin"),
        frecuencia:           getText("frecuencia"),
        incluye:              getText("incluye"),
        servicios:            getText("servicios"),
        sameAs:               getSameAsLinks(),
        dbpedia:              hasDbpedia ? dbpedia : null,
        seLlegaPor:           getList("seLlegaPor"),
        estaCercaDe:          getList("estaCercaDe"),
        ofreceEvento:         getList("ofreceEvento"),
        seRealizaEn:          getList("seRealizaEn"),
        tieneAtractivo:       getList("tieneAtractivo"),
        ofreceGastronomia:    getList("ofreceGastronomia"),
        ofreceHospedaje:      getList("ofreceHospedaje"),
        ubicadoEn:            getList("ubicadoEn"),
      };

      if (entidad.nombre && entidad.nombre !== "" && entidad.nombre !== "No se encontraron resultados") {
        results.push(entidad);
      }
    }
  } catch (err) {
    console.error("Error parseando OWL:", err);
  }
  
  console.log(`✅ Parseados ${results.length} resultados`);
  if (results.length > 0) {
    console.log(`📋 Primer resultado: ${results[0].nombre} (${results[0].clase})`);
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
// RENDER CARD - VERSIÓN CON ENLACE DBPEDIA CORRECTO (SIN ALTERNATIVAS)
// ============================================================
function renderCard(e, t) {
  const cfg   = getClaseConfig(e.clase);
  const color = cfg.color;
  const icon  = cfg.icon;
  const claseLabel = (e.clase||"").replace(/_/g," ");

  // Imagen desde DBpedia
  let imageHtml = "";
  if (e.dbpedia?.thumbnail && e.dbpedia.thumbnail !== "") {
    imageHtml = `<div class="card-image">
      <img src="${esc(e.dbpedia.thumbnail)}" alt="${esc(e.nombre)}" loading="lazy" onerror="this.style.display='none'">
    </div>`;
  }

  // Badges
  const badges = [];
  if (e.gratuito === true)            badges.push(`<span class="badge badge--free">🆓 ${t.free}</span>`);
  else if (e.gratuito === false)      badges.push(`<span class="badge badge--paid">💰 ${t.notFree}</span>`);
  if (e.accesibilidad === true)       badges.push(`<span class="badge badge--access">♿ ${t.accessible}</span>`);
  if (e.tieneDescuento === true)      badges.push(`<span class="badge badge--discount">🏷️ ${t.discount}</span>`);
  if (e.requiereReserva === true)     badges.push(`<span class="badge badge--reserve">📅 ${t.reservation}</span>`);
  if (e.patrimonioNacional === true)  badges.push(`<span class="badge badge--heritage">🏛️ ${t.heritage}</span>`);
  if (e.disponible === true)          badges.push(`<span class="badge badge--avail">✅ ${t.available}</span>`);
  if (e.horario)                      badges.push(`<span class="badge badge--time">⏰ ${esc(e.horario)}</span>`);

  // Extras
  const extras = [];
  const tipoLabel = e.tipoEstablecimiento || e.tipoHospedaje || e.tipoTransporte ||
                    e.tipoEvento || e.tipoRecreacion || e.tipoEcosistema ||
                    e.tipoPatrimonio || e.tipoProducto || e.tipoAtractivo || "";
  if (tipoLabel) extras.push(`<p class="card-extra">🏷️ ${t.typical}: <strong>${esc(tipoLabel)}</strong></p>`);
  if (e.esTipico)     extras.push(`<p class="card-extra">🍽️ ${t.typical}: ${esc(e.esTipico)}</p>`);
  if (e.ingredientes) extras.push(`<p class="card-extra">🍳 ${t.ingredients}: ${esc(e.ingredientes)}</p>`);
  if (e.servicios)    extras.push(`<p class="card-extra">🛎️ ${t.services}: ${esc(e.servicios)}</p>`);
  if (e.precioNoche !== null && e.precioNoche !== undefined)
    extras.push(`<p class="card-extra">💤 ${t.price_night}: <strong>Bs. ${e.precioNoche}</strong></p>`);
  if (e.precioDia !== null && e.precioDia !== undefined)
    extras.push(`<p class="card-extra">☀️ ${t.price_day}: <strong>Bs. ${e.precioDia}</strong></p>`);
  if (e.costoEntrada !== null && e.costoEntrada !== undefined)
    extras.push(`<p class="card-extra">🎫 ${t.entry}: <strong>Bs. ${e.costoEntrada}</strong></p>`);
  if (e.costoAprox !== null && e.costoAprox !== undefined)
    extras.push(`<p class="card-extra">💵 ${t.approx_cost}: <strong>Bs. ${e.costoAprox}</strong></p>`);
  if (e.incluye)    extras.push(`<p class="card-extra">✨ ${t.includes}: ${esc(e.incluye)}</p>`);
  if (e.actividades) extras.push(`<p class="card-extra">🎯 ${t.activities}: ${esc(e.actividades)}</p>`);
  if (e.gradoDificultad !== null && e.gradoDificultad !== undefined)
    extras.push(`<p class="card-extra">💪 ${t.difficulty}: <strong>${e.gradoDificultad}/5</strong></p>`);
  if (e.tipoEcosistema) extras.push(`<p class="card-extra">🌍 ${t.ecosystem}: ${esc(e.tipoEcosistema)}</p>`);
  if (e.ruta)       extras.push(`<p class="card-extra">🗺️ ${t.route}: ${esc(e.ruta)}</p>`);
  if (e.capacidad)  extras.push(`<p class="card-extra">👥 ${t.capacity}: ${e.capacidad} pers.</p>`);
  if (e.tipoEvento)  extras.push(`<p class="card-extra">🎊 ${t.event_type}: ${esc(e.tipoEvento)}</p>`);
  if (e.frecuencia)  extras.push(`<p class="card-extra">🔁 ${t.frequency}: ${esc(e.frecuencia)}</p>`);
  if (e.fechaInicio || e.fechaFin)
    extras.push(`<p class="card-extra">📅 ${t.dates}: ${esc(e.fechaInicio||"")}${e.fechaFin ? " → "+esc(e.fechaFin) : ""}</p>`);
  if (e.epoch)              extras.push(`<p class="card-extra">🕰️ ${t.epoch}: ${esc(e.epoch)}</p>`);
  if (e.tipoPatrimonio)     extras.push(`<p class="card-extra">🏛️ ${t.heritage_type}: ${esc(e.tipoPatrimonio)}</p>`);
  if (e.culturaOrigen)      extras.push(`<p class="card-extra">🏺 ${t.origin}: ${esc(e.culturaOrigen)}</p>`);
  if (e.estadoConservacion) extras.push(`<p class="card-extra">🔍 ${t.conservation}: ${esc(e.estadoConservacion)}</p>`);
  if (e.nivelConcurrencia)  extras.push(`<p class="card-extra">👁️ ${t.concurrency}: ${esc(e.nivelConcurrencia)}</p>`);

  // ============================================================
  // DBPEDIA - ENLACE CORRECTO (SIN ALTERNATIVAS)
  // ============================================================
  let dbpediaHtml = "";
  
  // Generar el enlace correcto de DBpedia
  const dbpediaLink = generarEnlaceDBpedia(e);
  
  // Construir la sección DBpedia
  const dbpediaItems = [];
  
  // Abstract de DBpedia
  if (e.dbpedia?.abstract && e.dbpedia.abstract !== "") {
    let abstractText = e.dbpedia.abstract;
    if (abstractText.length > 300) abstractText = abstractText.substring(0, 300) + "...";
    dbpediaItems.push(`<p class="card-dbpedia-abstract"><span class="dbpedia-icon">📖</span> ${esc(abstractText)}</p>`);
  }
  
  // Coordenadas
  if (e.dbpedia?.lat !== null && e.dbpedia?.lat !== undefined && e.dbpedia?.long !== null && e.dbpedia?.long !== undefined) {
    const mapUrl = `https://www.openstreetmap.org/?mlat=${e.dbpedia.lat}&mlon=${e.dbpedia.long}&zoom=15`;
    dbpediaItems.push(`<p class="card-dbpedia-coords">🗺️ ${t.coordinates}: <a href="${mapUrl}" target="_blank" rel="noopener noreferrer">${e.dbpedia.lat.toFixed(4)}, ${e.dbpedia.long.toFixed(4)}</a></p>`);
  }
  
  // Enlace a Wikipedia
  if (e.dbpedia?.wikiPage && e.dbpedia.wikiPage !== "") {
    dbpediaItems.push(`<p class="card-dbpedia-wiki">📚 <a href="${esc(e.dbpedia.wikiPage)}" target="_blank" rel="noopener noreferrer">${t.wikipedia_link}</a></p>`);
  }
  
  // Enlace directo a DBpedia (UN SOLO ENLACE, el correcto)
  if (dbpediaLink) {
    dbpediaItems.push(`<p class="card-dbpedia-link">🌐 <a href="${esc(dbpediaLink)}" target="_blank" rel="noopener noreferrer">${t.dbpedia_link}</a></p>`);
  }
  
  // Si hay items de DBpedia, crear la sección
  if (dbpediaItems.length > 0) {
    dbpediaHtml = `<div class="card-dbpedia">
      <div class="card-dbpedia-header">🌐 ${t.dbpedia_info}</div>
      <div class="card-dbpedia-content">${dbpediaItems.join("")}</div>
    </div>`;
  }

  // Relaciones
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

  return `
    <article class="result-card" style="--accent:${color}">
      <div class="card-header">
        <span class="card-icon">${icon}</span>
        <div class="card-clase">${esc(claseLabel)}</div>
      </div>
      ${imageHtml}
      <h3 class="card-nombre">${esc(e.nombre || "Sin nombre")}</h3>
      ${e.ubicacion   ? `<p class="card-ubicacion">📍 ${esc(e.ubicacion)}</p>` : ""}
      ${e.descripcion ? `<p class="card-descripcion">${esc(e.descripcion)}</p>` : ""}
      ${badges.length ? `<div class="card-badges">${badges.join("")}</div>` : ""}
      ${extras.length ? `<div class="card-extras">${extras.join("")}</div>` : ""}
      ${rels.length   ? `<div class="card-extras card-rels">${rels.join("")}</div>` : ""}
      ${dbpediaHtml}
    </article>`;
}

// ============================================================
// BÚSQUEDA PRINCIPAL
// ============================================================
async function doSearch(q) {
  const query = (typeof q==="string" && q.trim()) ? q.trim() : (input ? input.value.trim() : "");
  const t = i18n[currentLang];
  if (!query) { 
    if (resultsEl) resultsEl.innerHTML=""; 
    if (emptyState) emptyState.style.display="flex"; 
    return; 
  }

  if (suggestBox) hideSuggestions();
  if (emptyState) emptyState.style.display = "none";
  if (resultsEl) resultsEl.innerHTML = `<div class="loading"><div class="loading-spinner"></div><span>${t.loading}</span></div>`;

  try {
    const resp = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/rdf+xml" }
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const owlText    = await resp.text();
    
    // LOG DE DEPURACIÓN
    console.log(`📄 XML recibido para "${query}" (${owlText.length} bytes)`);
    
    const resultados = parseOWL(owlText);

    if (resultados.length === 0) {
      if (resultsEl) {
        resultsEl.innerHTML = `
          <div class="no-results">
            <span class="no-results-icon">🔭</span>
            <p>${t.noResults} <strong>"${esc(query)}"</strong></p>
            <p class="no-results-sub">${t.try}</p>
          </div>`;
      }
      return;
    }

    if (resultsEl) {
      resultsEl.innerHTML = resultados.map(e => renderCard(e, t)).join("");
      resultsEl.querySelectorAll(".result-card").forEach((card, i) => {
        card.style.animationDelay = `${i * 50}ms`;
        card.classList.add("card-enter");
      });
    }
    document.querySelector(".results-section")?.scrollIntoView({ behavior:"smooth", block:"start" });
  } catch (err) {
    console.error("Error:", err);
    if (resultsEl) {
      resultsEl.innerHTML = `
        <div class="no-results">
          <span class="no-results-icon">❌</span>
          <p>Error de conexión. ¿El servidor está corriendo en localhost:3000?</p>
          <p class="no-results-sub">${err.message}</p>
        </div>`;
    }
  }
}

// ============================================================
// BÚSQUEDA EN TIEMPO REAL
// ============================================================
async function doRealtimeSearch(prefijo) {
  const query = prefijo.trim();
  const t = i18n[currentLang];
  if (!query || query.length < 2) {
    if (!query && emptyState) { emptyState.style.display="flex"; if(resultsEl) resultsEl.innerHTML=""; }
    return;
  }
  try {
    const resp = await fetch(`${PREFIX_URL}?q=${encodeURIComponent(query)}`, {
      headers: { Accept:"application/rdf+xml" }
    });
    if (!resp.ok) return;
    const owlText = await resp.text();
    const resultados = parseOWL(owlText);
    if (!resultados.length) return;
    if (emptyState) emptyState.style.display = "none";
    if (resultsEl) {
      resultsEl.innerHTML = resultados.map(e => renderCard(e, t)).join("");
      resultsEl.querySelectorAll(".result-card").forEach((card, i) => {
        card.style.animationDelay = `${i * 50}ms`;
        card.classList.add("card-enter");
      });
    }
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
    "museos","hospedaje","parques","restaurantes","gastronomia","transporte","eventos",
    "gratuitos","accesibles","arqueologico","cultural","museums","hotels","parks",
    "Cristo de la Concordia","Laguna Alalay","Parque Nacional Tunari","Palacio Portales",
    "Catedral Metropolitana","Silpancho","Pique Macho"
  ];
  return local.filter(s => norm(s).includes(np)).slice(0, 6);
}

function showSuggestions(sugs) {
  if (!suggestBox) return;
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
      if (input) input.value = val;
      hideSuggestions();
      clearTimeout(realtimeTimeout);
      clearTimeout(suggestTimeout);
      doSearch(val);
    });
  });
}

function hideSuggestions() {
  if (suggestBox) suggestBox.style.display = "none";
  currentSugIdx = -1;
}

// ============================================================
// CHIPS DE BÚSQUEDA RÁPIDA
// ============================================================
function initChips() {
  const chips = document.querySelectorAll(".chip");
  chips.forEach(chip => {
    if (chip._handler) chip.removeEventListener("click", chip._handler);
    const handler = () => {
      let query = chip.dataset.query;
      if (!query) {
        const textSpan = chip.querySelector('.chip-text');
        if (textSpan) query = textSpan.textContent.trim().toLowerCase();
      }
      if (query && input) {
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
if (input) {
  input.addEventListener("input", () => {
    clearTimeout(suggestTimeout);
    clearTimeout(realtimeTimeout);
    const q = input.value.trim();
    if (q.length < 2) {
      hideSuggestions();
      if (!q && emptyState) { emptyState.style.display="flex"; if(resultsEl) resultsEl.innerHTML=""; }
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
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });

  input.addEventListener("blur", () => setTimeout(hideSuggestions, 150));
}

if (btn) {
  btn.addEventListener("click", () => {
    clearTimeout(realtimeTimeout); clearTimeout(suggestTimeout); doSearch();
  });
}

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
    if (dotsEl) {
      const dots = dotsEl.querySelectorAll(".dot");
      dots.forEach((d,i) => d.classList.toggle("active", i===cur));
    }
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

  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  if (prevBtn) prevBtn.addEventListener("click", () => go(cur-1));
  if (nextBtn) nextBtn.addEventListener("click", () => go(cur+1));

  if (n > 0) resetTimer();
})();

console.log("✅ Buscador Semántico listo - Conectado a DBpedia y Wikipedia");
console.log("🌐 Trilingüe Español/Inglés/Italiano");