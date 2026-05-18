const BASE_URL = "http://localhost:3000/api/search";
    // ── Traducciones ──
const translations = {
  es: { search: "Buscar", placeholder: "Ej: museos gratuitos, hoteles, senderismo…", free: "Gratuito", notFree: "Con costo", accessible: "Accesible", schedule: "Horario", noResults: "Sin resultados para", try: "Intenta con otro término." },
  en: { search: "Search", placeholder: "E.g.: free museums, hotels, hiking…", free: "Free", notFree: "Paid", accessible: "Accessible", schedule: "Schedule", noResults: "No results for", try: "Try another term." },
  qu: { search: "Mask'ay", placeholder: "Ej: wakin museo, hotel, puriy…", free: "Qullqi mana", notFree: "Qullqiwan", accessible: "Yaykuna atikuq", schedule: "Pacha", noResults: "Mana tarikuchu:", try: "Waq simiwan mask'ay." },
};

let currentLang = "es";

const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("resultados");
const emptyState = document.getElementById("emptyState");

// ── Colores por clase (igual que antes) ──
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

// ── Seguridad: escapar HTML ──
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ── Renderizar una tarjeta con datos reales ──
function renderCard(item, t) {
  const color = getColor(item.clase);
  const claseLabel = (item.clase || '').replace(/_/g, ' ');
  return `
    <article class="result-card" style="--accent:${color}">
      <div class="card-clase">${escapeHtml(claseLabel)}</div>
      <h3 class="card-nombre">${escapeHtml(item.nombre)}</h3>
      <p class="card-tipo">${escapeHtml(item.tipo || '')}</p>
      ${item.ubicacion ? `<p class="card-ubicacion"> ${escapeHtml(item.ubicacion)}</p>` : ''}
      ${item.descripcion ? `<p class="card-descripcion">${escapeHtml(item.descripcion)}</p>` : ''}
      <div class="card-meta">
        ${item.gratuito !== undefined && item.gratuito !== null ? 
          `<span class="badge ${item.gratuito ? 'badge--free' : 'badge--paid'}">${item.gratuito ? t.free : t.notFree}</span>` : ''}
        ${item.accesibilidad === true ? `<span class="badge badge--access"> ${t.accessible}</span>` : ''}
        ${item.horario ? `<span class="badge badge--time"> ${escapeHtml(item.horario)}</span>` : ''}
      </div>
    </article>`;
}

// ── Búsqueda real contra el backend ──
async function doSearch() {
  const q = input.value.trim().toLowerCase();
  const t = translations[currentLang];

  // Limpiar resultados anteriores
  resultsContainer.innerHTML = '';

  if (!q) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";
  resultsContainer.innerHTML = '<div class="loading">🔍 Buscando...</div>';

  try {
    const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const resultados = data.resultados || [];

    if (resultados.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <span>${t.noResults} "<strong>${escapeHtml(input.value)}</strong>".</span>
          <span>${t.try}</span>
        </div>`;
      return;
    }

    // Generar HTML de todas las tarjetas
    resultsContainer.innerHTML = resultados.map(item => renderCard(item, t)).join('');

    // Aplicar animación de entrada
    resultsContainer.querySelectorAll('.result-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 60}ms`;
      card.classList.add('card-enter');
    });

  } catch (error) {
    console.error("Error en la búsqueda:", error);
    resultsContainer.innerHTML = `
      <div class="no-results">
        Error de conexión. ¿El servidor backend está corriendo en http://localhost:3000?
      </div>`;
  }
}

// ── Event listeners ──
btn.addEventListener("click", doSearch);
input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });

// Chips de búsqueda rápida
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.query;
    doSearch();
    document.querySelector(".results-section")?.scrollIntoView({ behavior: "smooth" });
  });
});

// Cambio de idioma
document.querySelectorAll(".lang-btn").forEach(lb => {
  lb.addEventListener("click", () => {
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
    lb.classList.add("active");
    currentLang = lb.dataset.lang;
    const t = translations[currentLang];
    input.placeholder = t.placeholder;
    btn.textContent = t.search;
    if (input.value.trim()) doSearch();
  });
});

// Inicializar placeholder y botón con idioma por defecto
const t0 = translations.es;
input.placeholder = t0.placeholder;
btn.textContent = t0.search;