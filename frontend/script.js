
// ── Configuración del Servidor Backend ──────────────────────
const BASE_URL = "http://localhost:3000/api/search";

// ── Diccionario de Traducciones (Multilingualidad) ──────────
const translations = {
  es: { search: "Buscar", placeholder: "Ej: museos gratuitos, hoteles, senderismo…", free: "Gratuito", notFree: "Con costo", accessible: "Accesible", schedule: "Horario", noResults: "Sin resultados para", try: "Intenta con otro término.", loading: "Buscando en la ontología..." },
  en: { search: "Search", placeholder: "E.g.: free museums, hotels, hiking…", free: "Free", notFree: "Paid", accessible: "Accessible", schedule: "Schedule", noResults: "No results for", try: "Try another term.", loading: "Searching ontology..." },
  qu: { search: "Mask'ay", placeholder: "Ej: wakin museo, hotel, puriy…", free: "Qullqi mana", notFree: "Qullqiwan", accessible: "Yaykuna atikuq", schedule: "Pacha", noResults: "Mana tarikuchu:", try: "Waq simiwan mask'ay.", loading: "Ontologíapi mask'ashan..." },
};

let currentLang = "es";

// ── Selección de Elementos del DOM ──────────────────────────
const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("resultados");
const emptyState = document.getElementById("emptyState");

// ── Configuración Visual: Colores por Clase Ontológica ──────
const claseColors = {
  Atractivo_Natural: "#2d6a4f",
  Atractivo_Cultural_Histórico: "#7b3f00",
  Atractivo_Recreativo: "#1a4e8c",
  Atractivo_Arqueológico: "#5a3e1b",
  Producto_Alimenticio: "#a8440a",
  Hospedaje: "#4a1942",
  Evento_Turístico: "#7d0c3c",
  Establecimiento_Gastronomico: "#1a5c3a",
  Transporte: "#1c3a5e",
};

function getColor(clase) {
  return claseColors[clase] || "#333";
}

// ── Renderizado de Tarjetas de Resultados ───────────────────
function renderCard(item, t) {
  const color = getColor(item.clase);
  const claseLabel = item.clase ? item.clase.replace(/_/g, " ") : "Turismo";
  
  return `
    <article class="result-card" style="--accent:${color}">
      <div class="card-clase">${claseLabel}</div>
      <h3 class="card-nombre">${item.nombre}</h3>
      <p class="card-tipo">${item.tipo || ''}</p>
      <div class="card-meta">
        ${item.gratuito !== undefined && item.gratuito !== null ? `<span class="badge ${item.gratuito ? 'badge--free' : 'badge--paid'}">${item.gratuito ? t.free : t.notFree}</span>` : ''}
        ${item.accesibilidad ? `<span class="badge badge--access">♿ ${t.accessible}</span>` : ''}
        ${item.horario ? `<span class="badge badge--time">⏰ ${item.horario}</span>` : ''}
      </div>
    </article>`;
}

// ── FUNCIÓN PRINCIPAL: Búsqueda Asíncrona al Backend ────────
async function doSearch() {
  const q = input.value.trim().toLowerCase();
  const t = translations[currentLang];
  
  // Si el input está vacío, limpiamos contenedor y mostramos estado inicial
  if (!q) { 
    resultsContainer.innerHTML = ""; 
    if (emptyState) emptyState.style.display = "flex"; 
    return; 
  }

  if (emptyState) emptyState.style.display = "none";
  
  // Feedback visual de carga momentáneo
  resultsContainer.innerHTML = `<div class="loading-state">${t.loading}</div>`;

  try {
    // Petición HTTP GET asíncrona a nuestro servidor Express con el parámetro 'q'
    const urlCompleta = `${BASE_URL}?q=${encodeURIComponent(q)}`;
    const response = await fetch(urlCompleta);

    if (!response.ok) {
      throw new Error(`Error en la respuesta del servidor: ${response.status}`);
    }

    // Parseamos la respuesta JSON estructurada por el backend
    const data = await response.json();
    const matches = data.resultados || [];

    // Si el backend no encontró coincidencias en la ontología
    if (!matches.length) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <span>${t.noResults} "<strong>${input.value}</strong>".</span>
          <span>${t.try}</span>
        </div>`;
      return;
    }

    // Inyectamos las tarjetas construidas dinámicamente con los datos de la ontología real
    resultsContainer.innerHTML = matches.map(m => renderCard(m, t)).join('');
    
    // Ejecución de la animación de entrada para cada tarjeta (Card Enter)
    resultsContainer.querySelectorAll('.result-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 60}ms`;
      card.classList.add('card-enter');
    });

  } catch (error) {
    console.error("Error en la conexión semántica:", error);
    resultsContainer.innerHTML = `
      <div class="error-state">
        ⚠️ No se pudo conectar con el motor semántico. Asegúrate de que el servidor esté corriendo.
      </div>`;
  }
}

// ── Captura de Eventos de Usuario ───────────────────────────

// Clic en el botón de búsqueda
if (btn) btn.addEventListener("click", doSearch);

// Presionar Enter en el campo de texto
if (input) input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });

// Configuración de los Chips de Búsqueda Rápida
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.query;
    doSearch();
    const resultsSection = document.querySelector(".results-section");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Selector e Intercambiador de Idiomas (Multilingualidad)
document.querySelectorAll(".lang-btn").forEach(lb => {
  lb.addEventListener("click", () => {
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
    lb.classList.add("active");
    
    currentLang = lb.dataset.lang;
    const t = translations[currentLang];
    
    // Actualizamos los textos de la interfaz dinámicamente
    if (input) input.placeholder = t.placeholder;
    if (btn) btn.textContent = t.search;
    
    // Si ya había un texto escrito, relanza la búsqueda inmediatamente con las etiquetas del nuevo idioma
    if (input && input.value.trim()) doSearch();
  });
});