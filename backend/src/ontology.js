// backend/src/ontology.js


const fs   = require("fs");
const path = require("path");
const $rdf = require("rdflib");

const BASE = "http://www.semanticweb.org/sarzuri/ontologies/2026/2/turismo-cochabamba#";
const RDF  = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const OWL  = "http://www.w3.org/2002/07/owl#";

let store  = null;
let loaded = false;

function cargarOntologia() {
  if (loaded) return;
  const owlPath = path.join(__dirname, "../data/TurismoLocal.owl");
  if (!fs.existsSync(owlPath)) {
    console.error(`❌ Archivo OWL no encontrado: ${owlPath}`);
    process.exit(1);
  }
  const owlPathUrl = "file:///" + owlPath.replace(/\\/g, "/").replace(/ /g, "%20");
  const contenido  = fs.readFileSync(owlPath, "utf-8");
  store = $rdf.graph();
  try {
    $rdf.parse(contenido, store, owlPathUrl, "application/rdf+xml");
    console.log(`✅ Grafo cargado: ${store.statements.length} triples`);
  } catch (err) {
    console.error("❌ Error al parsear OWL:", err.message);
    process.exit(1);
  }
  loaded = true;
}

function normalizar(str) {
  if (!str) return "";
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m+1 }, (_, i) =>
    Array.from({ length: n+1 }, (_, j) => i===0 ? j : j===0 ? i : 0));
  for (let i=1; i<=m; i++)
    for (let j=1; j<=n; j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ============================================================
// DICCIONARIO COMPLETO TRILINGÜE
// ============================================================
const DICCIONARIO = {
  // ESPAÑOL
  "gratuito":"gratuito","gratis":"gratuito","sin costo":"gratuito","entrada gratis":"gratuito","entrada libre":"gratuito","lugares gratuitos":"gratuito",
  "museo":"museo","museos":"museos","cultural":"cultural",
  "hotel":"hotel","hoteles":"hoteles","hospedaje":"hospedaje","alojamiento":"hospedaje","hostal":"hostal",
  "restaurante":"restaurante","restaurantes":"restaurantes","comer":"restaurante","comida":"comida",
  "plato tipico":"gastronomia","platos tipicos":"gastronomia","comida tipica":"gastronomia","degustar":"gastronomia",
  "parque":"parque","parques":"parques","jardin":"parque","jardines":"parque","area verde":"parque",
  "natural":"natural","naturaleza":"natural","paisaje":"natural","cerro":"natural","laguna":"natural","lago":"natural","rio":"natural","montaña":"natural","bosque":"natural","atractivos naturales":"natural",
  "senderismo":"senderismo","sendero":"senderismo","caminata":"senderismo","trekking":"senderismo","rutas de senderismo":"senderismo",
  "mirador":"mirador","vista":"panoramico","cerros":"mirador","punto panoramico":"mirador",
  "iglesia":"iglesia","iglesias":"iglesia","catedral":"iglesia","convento":"iglesia","templo":"iglesia",
  "evento":"evento","eventos":"evento","festividad":"evento","festividades":"evento","feria":"evento","festival":"evento","celebracion":"evento",
  "transporte":"transporte","bus":"transporte","taxi":"transporte","micro":"transporte","tren":"transporte","teleferico":"transporte","medios de transporte":"transporte",
  "accesible":"accesible","accesibilidad":"accesible","silla de ruedas":"accesible","discapacidad":"accesible","movilidad reducida":"accesible",
  "arqueologico":"arqueologico","ruinas":"arqueologico","inca":"arqueologico",
  "familia":"familia","familias":"familia","niños":"familia","infantil":"familia","recomendados para familias":"familia",
  "monumento":"cultural","monumentos":"cultural","historico":"cultural","historicos":"cultural","patrimonio":"cultural","puntos de interes":"cultural",
  "feria artesanal":"evento","ferias artesanales":"evento","artesania":"evento",
  // INGLÉS
  "free":"gratuito","free entry":"gratuito","no cost":"gratuito",
  "museum":"museo","museums":"museos",
  "hotel":"hotel","hotels":"hoteles","accommodation":"hospedaje","lodging":"hospedaje",
  "restaurant":"restaurante","restaurants":"restaurantes","eat":"restaurante",
  "typical food":"gastronomia","local dish":"gastronomia","try":"gastronomia",
  "park":"parque","parks":"parques","garden":"parque",
  "nature":"natural","natural":"natural","mountain":"natural","lake":"natural","river":"natural","forest":"natural",
  "hiking":"senderismo","trekking":"senderismo","trail":"senderismo",
  "viewpoint":"mirador","view":"mirador","hill":"mirador","lookout":"mirador",
  "church":"iglesia","churches":"iglesias","cathedral":"iglesia",
  "event":"evento","events":"eventos","festival":"evento","fair":"evento","celebration":"evento",
  "transport":"transporte","transportation":"transporte","bus":"transporte","taxi":"transporte","train":"transporte",
  "accessible":"accesible","wheelchair":"accesible","disability":"accesible",
  "ruins":"arqueologico","archaeological":"arqueologico",
  "family":"familia","kids":"familia","children":"familia","recommended for families":"familia",
  "monument":"cultural","monuments":"cultural","historical":"cultural","heritage":"cultural",
  "craft fair":"evento","craft fairs":"evento",
  // ITALIANO
  "gratuito":"gratuito","ingresso libero":"gratuito","senza costo":"gratuito",
  "museo":"museo","musei":"museos",
  "hotel":"hotel","albergo":"hospedaje","alloggio":"hospedaje","dove dormire":"hospedaje",
  "ristorante":"restaurante","ristoranti":"restaurantes","mangiare":"restaurante",
  "piatto tipico":"gastronomia","piatti tipici":"gastronomia","cucina locale":"gastronomia","assaggiare":"gastronomia",
  "parco":"parque","parchi":"parques","giardino":"parque",
  "natura":"natural","naturale":"natural","paesaggio":"natural","montagna":"natural","lago":"natural","fiume":"natural","bosco":"natural","attrazioni naturali":"natural",
  "sentiero":"senderismo","escursione":"senderismo","camminata":"senderismo","percorsi di trekking":"senderismo",
  "belvedere":"mirador","vista":"mirador","panoramico":"mirador","collina":"mirador","punto panoramico":"mirador",
  "chiesa":"iglesia","chiese":"iglesias","cattedrale":"iglesia",
  "evento":"evento","eventi":"eventos","festa":"evento","fiera":"evento","celebrazione":"evento","festività":"evento",
  "trasporto":"transporte","bus":"transporte","taxi":"transporte","treno":"transporte","mezzi di trasporto":"transporte",
  "accessibile":"accesible","sedia a rotelle":"accesible","disabilità":"accesible",
  "rovine":"arqueologico","archeologico":"arqueologico","scavi":"arqueologico",
  "famiglia":"familia","bambini":"familia","consigliato per famiglie":"familia",
  "monumento":"cultural","monumenti":"cultural","storico":"cultural","patrimonio":"cultural","punti di interesse":"cultural",
  "fiera artigianale":"evento","fiere artigianali":"evento","artigianato":"evento"
};

function traducirConsulta(query) {
  const lower = query.toLowerCase().trim();
  if (DICCIONARIO[lower]) return DICCIONARIO[lower];
  const palabras = lower.split(" ");
  const traducidas = palabras.map(p => DICCIONARIO[p] || p);
  return traducidas.join(" ");
}

// ============================================================
// FUNCIONES ESPECÍFICAS
// ============================================================

function buscarMuseosEspecifico() {
  const resultados = [];
  const excluirPalabras = ["catedral","iglesia","convento","templo","basilica","capilla","parroquia"];
  
  for (const st of todosLosIndividuos()) {
    const props = obtenerPropiedades(st.subject);
    const nombre = getProp(props, "Nombre") || "";
    const tipoPatrimonio = getProp(props, "Tipo_Patrimonio") || "";
    const descripcion = getProp(props, "Descripcion") || "";
    
    const esMuseo = 
      tipoPatrimonio.toLowerCase().includes("museo") ||
      tipoPatrimonio.toLowerCase().includes("museístico") ||
      nombre.toLowerCase().includes("museo") ||
      descripcion.toLowerCase().includes("museo");
    
    let esReligioso = false;
    for (const palabra of excluirPalabras) {
      if (nombre.toLowerCase().includes(palabra) || 
          tipoPatrimonio.toLowerCase().includes(palabra) ||
          descripcion.toLowerCase().includes(palabra)) {
        esReligioso = true;
        break;
      }
    }
    
    if (esMuseo && !esReligioso) {
      resultados.push(normalizarEntidad(st.subject.value, props));
    }
  }
  return resultados;
}

function buscarIglesiasEspecifico() {
  const resultados = [];
  for (const st of todosLosIndividuos()) {
    const props = obtenerPropiedades(st.subject);
    const nombre = getProp(props, "Nombre") || "";
    const tipoPatrimonio = getProp(props, "Tipo_Patrimonio") || "";
    const descripcion = getProp(props, "Descripcion") || "";
    
    const esIglesia = 
      tipoPatrimonio.toLowerCase().includes("religiosa") ||
      nombre.toLowerCase().includes("iglesia") ||
      nombre.toLowerCase().includes("catedral") ||
      nombre.toLowerCase().includes("convento") ||
      nombre.toLowerCase().includes("templo") ||
      descripcion.toLowerCase().includes("iglesia");
    
    if (esIglesia) {
      resultados.push(normalizarEntidad(st.subject.value, props));
    }
  }
  return resultados;
}

function buscarParquesEspecifico() {
  const resultados = [];
  const palabrasParque = ["parque","jardin","jardín","kanata","cretácico","familia","mariscal","educación","skatepark","park","giardino"];
  
  for (const st of todosLosIndividuos()) {
    const props = obtenerPropiedades(st.subject);
    const nombre = getProp(props, "Nombre") || "";
    const tipoRecreacion = getProp(props, "Tipo_Recreacion") || "";
    const descripcion = getProp(props, "Descripcion") || "";
    
    let esParque = false;
    for (const palabra of palabrasParque) {
      if (nombre.toLowerCase().includes(palabra) ||
          tipoRecreacion.toLowerCase().includes(palabra) ||
          descripcion.toLowerCase().includes(palabra)) {
        esParque = true;
        break;
      }
    }
    
    if (!esParque) {
      const clase = props._tipos?.join(" ") || "";
      if (clase.includes("Atractivo_Recreativo") && 
          (nombre.toLowerCase().includes("parque") || nombre.toLowerCase().includes("park"))) {
        esParque = true;
      }
    }
    
    if (esParque) {
      resultados.push(normalizarEntidad(st.subject.value, props));
    }
  }
  return resultados;
}

function buscarTeatrosEspecifico() {
  const resultados = [];
  for (const st of todosLosIndividuos()) {
    const props = obtenerPropiedades(st.subject);
    const nombre = getProp(props, "Nombre") || "";
    const tipoPatrimonio = getProp(props, "Tipo_Patrimonio") || "";
    
    const esTeatro = 
      nombre.toLowerCase().includes("teatro") ||
      tipoPatrimonio.toLowerCase().includes("teatro");
    
    if (esTeatro) {
      resultados.push(normalizarEntidad(st.subject.value, props));
    }
  }
  return resultados;
}

// Busca SOLO monumentos históricos (NO museos, NO iglesias)
function buscarMonumentosEspecifico() {
  const resultados = [];
  const excluirPalabras = ["museo","iglesia","catedral","convento","restaurante","hotel","parque"];
  
  for (const st of todosLosIndividuos()) {
    const props = obtenerPropiedades(st.subject);
    const nombre = getProp(props, "Nombre") || "";
    const tipoPatrimonio = getProp(props, "Tipo_Patrimonio") || "";
    const descripcion = getProp(props, "Descripcion") || "";
    
    let esExcluido = false;
    for (const palabra of excluirPalabras) {
      if (nombre.toLowerCase().includes(palabra)) {
        esExcluido = true;
        break;
      }
    }
    
    if (esExcluido) continue;
    
    const esMonumento = 
      tipoPatrimonio.toLowerCase().includes("monumento") ||
      tipoPatrimonio.toLowerCase().includes("historico") ||
      tipoPatrimonio.toLowerCase().includes("patrimonio") ||
      nombre.toLowerCase().includes("monumento") ||
      nombre.toLowerCase().includes("casona") ||
      nombre.toLowerCase().includes("heroinas") ||
      descripcion.toLowerCase().includes("monumento");
    
    if (esMonumento) {
      resultados.push(normalizarEntidad(st.subject.value, props));
    }
  }
  return resultados;
}

// Busca SOLO atractivos naturales (cerros, lagunas, ríos, bosques)
function buscarAtractivosNaturalesEspecifico() {
  const resultados = [];
  const palabrasNatural = ["cerro","laguna","lago","rio","río","montaña","bosque","cascada","valle","paisaje","naturaleza"];
  
  for (const st of todosLosIndividuos()) {
    const props = obtenerPropiedades(st.subject);
    const nombre = getProp(props, "Nombre") || "";
    const tipoEcosistema = getProp(props, "Tipo_Ecosistema") || "";
    const descripcion = getProp(props, "Descripcion") || "";
    const clase = props._tipos?.join(" ") || "";
    
    // Solo si es Atractivo_Natural
    if (!clase.includes("Atractivo_Natural")) continue;
    
    let esNatural = false;
    for (const palabra of palabrasNatural) {
      if (nombre.toLowerCase().includes(palabra) ||
          tipoEcosistema.toLowerCase().includes(palabra) ||
          descripcion.toLowerCase().includes(palabra)) {
        esNatural = true;
        break;
      }
    }
    
    if (esNatural) {
      resultados.push(normalizarEntidad(st.subject.value, props));
    }
  }
  return resultados;
}

// Busca SOLO miradores (incluye Cristo de la Concordia y otros)
function buscarMiradoresEspecifico() {
  const resultados = [];
  const palabrasMirador = ["mirador","cristo","vista","panoramico","belvedere","punto panoramico","cerro","colina"];
  
  for (const st of todosLosIndividuos()) {
    const props = obtenerPropiedades(st.subject);
    const nombre = getProp(props, "Nombre") || "";
    const tipoRecreacion = getProp(props, "Tipo_Recreacion") || "";
    const descripcion = getProp(props, "Descripcion") || "";
    const clase = props._tipos?.join(" ") || "";
    
    // Buscar en nombre, tipo de recreación y descripción
    let esMirador = false;
    for (const palabra of palabrasMirador) {
      if (nombre.toLowerCase().includes(palabra) ||
          tipoRecreacion.toLowerCase().includes(palabra) ||
          descripcion.toLowerCase().includes(palabra)) {
        esMirador = true;
        break;
      }
    }
    
    // El Cristo de la Concordia tiene Tipo_Recreacion = "Mirador Religioso"
    if (tipoRecreacion.toLowerCase().includes("mirador")) {
      esMirador = true;
    }
    
    if (esMirador) {
      resultados.push(normalizarEntidad(st.subject.value, props));
    }
  }
  return resultados;
}

// ============================================================
// INTENCIONES COMPLETAS
// ============================================================
const INTENCIONES = [
  {
    clave: "gratuito",
    terminos: ["gratuito","gratis","sin costo","entrada gratis","entrada libre","lugares gratuitos","free","free entry","no cost","ingresso libero","senza costo","gratuito","gratuita"],
    fn: () => buscarGratuitos()
  },
  {
    clave: "hospedaje",
    terminos: ["hotel","hoteles","hospedaje","alojamiento","hostal","donde dormir","accommodation","lodging","alloggio","dove dormire","albergo","ostello"],
    fn: () => buscarPorClase("Hospedaje")
  },
  {
    clave: "restaurante",
    terminos: ["restaurante","restaurantes","establecimiento","donde comer","comer","restaurant","restaurants","eatery","ristorante","ristoranti","dove mangiare"],
    fn: () => buscarPorClase("Establecimiento_Gastronomico")
  },
  {
    clave: "comida",
    terminos: ["comida","plato tipico","platos tipicos","gastronomia","degustar","typical food","local dish","food","piatto tipico","piatti tipici","assaggiare","cucina locale"],
    fn: () => buscarPorClase("Producto_Alimenticio")
  },
  {
    clave: "parque",
    terminos: ["parque","parques","jardin","jardines","area verde","park","parks","garden","parco","parchi","giardino"],
    fn: () => buscarParquesEspecifico()
  },
  {
    clave: "natural",
    terminos: ["natural","naturaleza","atractivos naturales","paisaje","cerro","laguna","lago","rio","montaña","bosque","nature","landscape","mountain","lake","river","natura","paesaggio","attrazioni naturali"],
    fn: () => buscarAtractivosNaturalesEspecifico()
  },
  {
    clave: "museo",
    terminos: ["museo","museos","museum","museums","musei"],
    fn: () => buscarMuseosEspecifico()
  },
  {
    clave: "iglesia",
    terminos: ["iglesia","iglesias","catedral","convento","templo","church","churches","cathedral","chiesa","chiese","cattedrale"],
    fn: () => buscarIglesiasEspecifico()
  },
  {
    clave: "senderismo",
    terminos: ["senderismo","sendero","caminata","rutas de senderismo","hiking","trekking","trail","sentiero","escursione","camminata"],
    fn: () => buscarAtractivosNaturalesEspecifico()
  },
  {
    clave: "mirador",
    terminos: ["mirador","miradores","vista","panoramico","cerros","punto panoramico","viewpoint","view","hill","lookout","belvedere","collina","punto panoramico"],
    fn: () => buscarMiradoresEspecifico()
  },
  {
    clave: "evento",
    terminos: ["evento","eventos","festividad","festividades","feria","ferias","festival","celebracion","event","events","festival","fair","celebration","fiera","festa","celebrazione","festività","fiera artigianale","fiere artigianali"],
    fn: () => buscarPorClase("Evento_Turístico")
  },
  {
    clave: "transporte",
    terminos: ["transporte","bus","taxi","micro","tren","teleferico","medios de transporte","transport","transportation","taxi","train","trasporto","mezzi di trasporto"],
    fn: () => buscarPorClase("Transporte")
  },
  {
    clave: "accesible",
    terminos: ["accesible","accesibilidad","silla de ruedas","discapacidad","movilidad reducida","accessible","wheelchair","disability","accessibile","sedia a rotelle"],
    fn: () => buscarAccesibles()
  },
  {
    clave: "arqueologico",
    terminos: ["arqueologico","ruinas","inca","archaeological","ruins","archeologico","rovine","scavi"],
    fn: () => buscarPorClase("Atractivo_Arqueológico")
  },
  {
    clave: "cultural",
    terminos: ["monumento","monumentos","historico","historicos","patrimonio","puntos de interes","cultural","cultura","monument","historical","heritage","monumenti","storico","patrimonio","punti di interesse"],
    fn: () => buscarMonumentosEspecifico()
  },
  {
    clave: "familia",
    terminos: ["familia","familias","niños","infantil","recomendados para familias","family","kids","children","recommended for families","famiglia","bambini","consigliato per famiglie"],
    fn: () => buscarPorClase("Atractivo_Recreativo")
  },
  {
    clave: "teatro",
    terminos: ["teatro","teatros","theater","theatre","teatri"],
    fn: () => buscarTeatrosEspecifico()
  }
];

function detectarIntencion(texto) {
  const norm = normalizar(texto);
  if (!norm || norm.length < 2) return null;
  
  let mejorPuntaje = 0;
  let mejorIntencion = null;
  
  for (const intencion of INTENCIONES) {
    let puntaje = 0;
    
    for (const termino of intencion.terminos) {
      const nt = normalizar(termino);
      
      if (norm === nt) { puntaje = 999; break; }
      if (norm.includes(nt)) { puntaje += 20; }
      if (nt.includes(norm)) { puntaje += 25; }
      
      const palabrasQuery = norm.split(" ");
      for (const palabra of palabrasQuery) {
        if (palabra === nt) puntaje += 15;
        else if (palabra.length > 2 && nt.length > 2 && (palabra.includes(nt) || nt.includes(palabra))) puntaje += 10;
        else if (palabra.length > 3 && levenshtein(palabra, nt) <= 2) puntaje += 5;
      }
    }
    
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorIntencion = intencion;
    }
  }
  
  return mejorPuntaje >= 4 ? mejorIntencion : null;
}

// ============================================================
// ACCESO AL GRAFO
// ============================================================
function todosLosIndividuos() {
  return store.statementsMatching(null, new $rdf.NamedNode(RDF+"type"), new $rdf.NamedNode(OWL+"NamedIndividual"));
}
function individuosDe(clase) {
  return store.statementsMatching(null, new $rdf.NamedNode(RDF+"type"), new $rdf.NamedNode(BASE+clase));
}
function buscarPorClase(clase) {
  return individuosDe(clase).map(st => normalizarEntidad(st.subject.value, obtenerPropiedades(st.subject)));
}
function buscarGratuitos() {
  const res = [];
  for (const st of todosLosIndividuos()) {
    const p = obtenerPropiedades(st.subject);
    if (getBool(p,"Gratuito")===true || getNum(p,"Costo_Entrada")===0)
      res.push(normalizarEntidad(st.subject.value, p));
  }
  return res;
}
function buscarAccesibles() {
  const res = [];
  for (const st of todosLosIndividuos()) {
    const p = obtenerPropiedades(st.subject);
    if (getBool(p,"Accesibilidad")===true)
      res.push(normalizarEntidad(st.subject.value, p));
  }
  return res;
}

function obtenerPropiedades(uriNode) {
  const statements = store.statementsMatching(uriNode, null, null);
  const props = {};
  statements.forEach(st => {
    const pred     = st.predicate.value;
    const obj      = st.object;
    const predName = pred.split("#").pop();
    if (obj.termType === "Literal") {
      if (!props[predName]) props[predName] = [];
      props[predName].push({ value: obj.value, lang: obj.lang || "" });
    } else if (pred === RDF+"type") {
      if (!props._tipos) props._tipos = [];
      props._tipos.push(obj.value.split("#").pop());
    } else {
      if (!props._objProps) props._objProps = {};
      if (!props._objProps[predName]) props._objProps[predName] = [];
      props._objProps[predName].push(obj.value.split("#").pop().replace(/_/g," "));
    }
  });
  return props;
}

function getProp(props, name) { return props[name]?.length ? props[name][0].value : null; }
function getBool(props, name) { const v = getProp(props,name); return v===null ? null : v==="true"; }
function getNum(props, name)  { const v = getProp(props,name); if (v===null) return null; const n=parseFloat(v); return isNaN(n)?null:n; }

function normalizarEntidad(uri, props) {
  const uriLocal = (iri) => {
    const idx = iri.lastIndexOf("#");
    return idx>=0 ? decodeURIComponent(iri.slice(idx+1)).replace(/_/g," ") : iri;
  };
  let clase = "Entidad Turistica";
  if (props._tipos)
    for (const t of props._tipos)
      if (t !== "NamedIndividual" && t !== "Thing") { clase = t.replace(/_/g," "); break; }

  const objProps = props._objProps || {};
  const horarioAp = getProp(props,"Horario_Apertura");
  const horarioCi = getProp(props,"Horario_Cierra");
  const horarioEsp= getProp(props,"Horario_Especial");
  const horarioAt = getProp(props,"Horario_Atencion");
  const horarioSv = getProp(props,"Horario_Servicio");
  let horario = horarioEsp || horarioAt || horarioSv || horarioAp || null;
  if (horarioAp && horarioCi) horario = `${horarioAp} - ${horarioCi}`;

  return {
    nombre:             getProp(props,"Nombre") || getProp(props,"Tipo_Hospedaje") || getProp(props,"Tipo_Transporte") || uriLocal(uri),
    clase,
    descripcion:        getProp(props,"Descripcion"),
    ubicacion:          getProp(props,"Ubicacion"),
    horario,
    nivelConcurrencia:  getProp(props,"Nivel_Concurrencia"),
    gratuito:           getBool(props,"Gratuito"),
    accesibilidad:      getBool(props,"Accesibilidad"),
    tieneDescuento:     getBool(props,"Tiene_Descuento"),
    requiereReserva:    getBool(props,"Requiere_Reserva"),
    patrimonioNacional: getBool(props,"Patrimonio_Nacional"),
    disponible:         getBool(props,"Disponible"),
    costoEntrada:       getNum(props,"Costo_Entrada"),
    precioNoche:        getNum(props,"Precio_Noche"),
    precioDia:          getNum(props,"Precio_Dia"),
    costoAprox:         getNum(props,"Costo_Aproximado"),
    gradoDificultad:    getNum(props,"Grado_Dificultad"),
    capacidad:          getNum(props,"Capacidad"),
    actividades:        getProp(props,"Actividades"),
    tipoEcosistema:     getProp(props,"Tipo_Ecosistema"),
    epoch:              getProp(props,"Epoca"),
    tipoPatrimonio:     getProp(props,"Tipo_Patrimonio"),
    culturaOrigen:      getProp(props,"Cultura_Origen"),
    estadoConservacion: getProp(props,"Estado_Conservacion"),
    tipoRecreacion:     getProp(props,"Tipo_Recreacion"),
    tipoEvento:         getProp(props,"Tipo_Evento"),
    fechaInicio:        getProp(props,"Fecha_Inicio"),
    fechaFin:           getProp(props,"Fecha_Fin"),
    frecuencia:         getProp(props,"Frecuencia"),
    tipoHospedaje:      getProp(props,"Tipo_Hospedaje"),
    incluye:            getProp(props,"Incluye_Servicios"),
    tipoEstablecimiento:getProp(props,"Tipo_Establecimiento"),
    servicios:          getProp(props,"Servicios"),
    tipoProducto:       getProp(props,"Tipo_Producto"),
    esTipico:           getProp(props,"Es_Tipico"),
    ingredientes:       getProp(props,"Ingredientes"),
    tipoTransporte:     getProp(props,"Tipo_Transporte"),
    ruta:               getProp(props,"Ruta"),
    tipoAtractivo:      getProp(props,"Tipo_Atractivo"),
    seLlegaPor:         objProps["seLlegaPor"]         || [],
    estaCercaDe:        objProps["estaCercaDe"]         || [],
    ofreceEvento:       objProps["ofreceEvento"]        || [],
    seRealizaEn:        objProps["seRealizaEn"]         || [],
    tieneAtractivo:     objProps["tieneAtractivo"]      || [],
    tieneEstablecimiento: objProps["tieneEstablecimiento"] || [],
    ofreceGastronomia:  objProps["ofreceGastronomia"]   || [],
    ofreceHospedaje:    objProps["ofreceHospedaje"]     || [],
    ubicadoEn:          objProps["ubicadoEn"]           || []
  };
}

function buscarPorNombre(query) {
  const normQuery = normalizar(query);
  if (!normQuery || normQuery.length < 2) return { exactos: [], parciales: [] };

  const exactos   = [];
  const parciales = [];
  const idsExactos = new Set();
  const idsParciales = new Set();

  for (const st of todosLosIndividuos()) {
    const uri = st.subject.value;
    const p   = obtenerPropiedades(st.subject);

    const camposNombre = [
      getProp(p,"Nombre"),
      getProp(p,"Tipo_Hospedaje"),
      getProp(p,"Tipo_Transporte"),
      getProp(p,"Tipo_Establecimiento"),
      getProp(p,"Tipo_Evento"),
      getProp(p,"Tipo_Producto"),
      (() => { const i=uri.lastIndexOf("#"); return i>=0 ? decodeURIComponent(uri.slice(i+1)).replace(/_/g," ") : null; })()
    ].filter(Boolean);

    let esExacto   = false;
    let esParcial  = false;

    for (const nombre of camposNombre) {
      const norm = normalizar(nombre);
      if (norm === normQuery) { esExacto = true; break; }
      if (norm.includes(normQuery) || normQuery.includes(norm)) esParcial = true;
    }

    if (esExacto && !idsExactos.has(uri)) {
      idsExactos.add(uri);
      exactos.push(normalizarEntidad(uri, p));
    } else if (esParcial && !idsExactos.has(uri) && !idsParciales.has(uri)) {
      idsParciales.add(uri);
      parciales.push(normalizarEntidad(uri, p));
    }
  }

  return { exactos, parciales };
}

function buscarTextoLibre(query) {
  const normQ   = normalizar(query);
  const palabras = normQ.split(" ").filter(p => p.length > 2);
  const ids = new Set();
  const res = [];
  for (const st of todosLosIndividuos()) {
    if (ids.has(st.subject.value)) continue;
    const p = obtenerPropiedades(st.subject);
    const campos = [
      normalizar(getProp(p,"Nombre") || ""),
      normalizar(getProp(p,"Descripcion") || ""),
      normalizar(getProp(p,"Actividades") || ""),
      normalizar(getProp(p,"Ubicacion") || "")
    ].join(" ");
    if (palabras.length > 0 && palabras.every(pal => campos.includes(pal))) {
      ids.add(st.subject.value);
      res.push(normalizarEntidad(st.subject.value, p));
    }
  }
  return res;
}

function buscar(q) {
  if (!loaded) cargarOntologia();
  if (!q || !q.trim()) return [];

  const query = q.trim();
  console.log(`\n🔎 Consulta: "${query}"`);

  const traducida = traducirConsulta(query);
  const queryFinal = traducida !== query ? traducida : query;
  if (traducida !== query) console.log(`🌐 Traducida: "${traducida}"`);

  const { exactos, parciales } = buscarPorNombre(queryFinal);

  let exactosOrig = [], parcialesOrig = [];
  if (traducida !== query) {
    const r = buscarPorNombre(query);
    exactosOrig  = r.exactos;
    parcialesOrig = r.parciales;
  }

  const todosExactos  = [...new Map([...exactos, ...exactosOrig].map(e=>[e.nombre,e])).values()];
  const todosParciales = [...new Map([...parciales, ...parcialesOrig].map(e=>[e.nombre,e])).values()];

  if (todosExactos.length > 0) {
    console.log(`✅ Exactos por nombre: ${todosExactos.length}`);
    return todosExactos;
  }
  if (todosParciales.length > 0) {
    console.log(`✅ Parciales por nombre: ${todosParciales.length}`);
    return todosParciales;
  }

  const intencion = detectarIntencion(queryFinal) || detectarIntencion(query);
  if (intencion) {
    console.log(`🎯 Intención: ${intencion.clave}`);
    const porIntencion = intencion.fn();
    if (porIntencion.length > 0) {
      console.log(`✅ Por intención: ${porIntencion.length}`);
      return porIntencion;
    }
  }

  console.log(`🔤 Texto libre`);
  const porTexto = buscarTextoLibre(queryFinal);
  console.log(`✅ Texto libre: ${porTexto.length}`);
  return porTexto;
}

function buscarPorPrefijo(prefijo) {
  if (!loaded) cargarOntologia();
  if (!prefijo || prefijo.trim().length < 2) return [];
  const resultados = buscar(prefijo.trim());
  return resultados.slice(0, 20);
}

function sugerencias(prefijo) {
  if (!loaded) cargarOntologia();
  if (!prefijo || prefijo.trim().length < 2) return [];

  const normPrefijo = normalizar(prefijo.trim());
  const sugs = new Set();

  for (const st of todosLosIndividuos()) {
    const p    = obtenerPropiedades(st.subject);
    const nombre = getProp(p,"Nombre");
    if (nombre) {
      const n = normalizar(nombre);
      if (n.startsWith(normPrefijo) || n.includes(normPrefijo))
        sugs.add(nombre);
    }
    if (sugs.size >= 8) break;
  }

  const r = [...sugs].slice(0, 8);
  console.log(`💡 Sugerencias "${prefijo}":`, r);
  return r;
}

function escapeXml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;" }[m]));
}

function serializarAOWL(entidades, termino) {
  const ts = Date.now();
  let owl = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
         xmlns="http://www.semanticweb.org/sarzuri/ontologies/2026/2/turismo-cochabamba#">
  <owl:NamedIndividual rdf:about="#Consulta_${ts}">
    <terminoBusqueda>${escapeXml(termino)}</terminoBusqueda>
    <totalResultados rdf:datatype="xsd:integer">${entidades.length}</totalResultados>
  </owl:NamedIndividual>`;

  for (let i=0; i<entidades.length; i++) {
    const e = entidades[i];
    owl += `\n  <owl:NamedIndividual rdf:about="#Resultado_${i}_${ts}">`;

    const a  = (tag, val) => { if (val!==null && val!==undefined && val!=="") owl += `\n    <${tag}>${escapeXml(String(val))}</${tag}>`; };
    const ab = (tag, val) => { if (val!==null && val!==undefined) owl += `\n    <${tag} rdf:datatype="xsd:boolean">${val}</${tag}>`; };
    const an = (tag, val) => { if (val!==null && val!==undefined) owl += `\n    <${tag} rdf:datatype="xsd:float">${val}</${tag}>`; };
    const arr= (tag, list)=> { if (list?.length) list.forEach(v => owl += `\n    <${tag}>${escapeXml(v)}</${tag}>`); };

    a("nombre",              e.nombre);
    a("clase",               e.clase);
    a("tipoAtractivo",       e.tipoAtractivo);
    a("tipoEcosistema",      e.tipoEcosistema);
    a("tipoRecreacion",      e.tipoRecreacion);
    a("tipoPatrimonio",      e.tipoPatrimonio);
    a("tipoEvento",          e.tipoEvento);
    a("tipoHospedaje",       e.tipoHospedaje);
    a("tipoTransporte",      e.tipoTransporte);
    a("tipoEstablecimiento", e.tipoEstablecimiento);
    a("tipoProducto",        e.tipoProducto);
    a("esTipico",            e.esTipico);
    a("descripcion",         e.descripcion);
    a("ubicacion",           e.ubicacion);
    a("horario",             e.horario);
    a("nivelConcurrencia",   e.nivelConcurrencia);
    ab("gratuito",           e.gratuito);
    ab("accesibilidad",      e.accesibilidad);
    ab("tieneDescuento",     e.tieneDescuento);
    ab("requiereReserva",    e.requiereReserva);
    ab("patrimonioNacional", e.patrimonioNacional);
    ab("disponible",         e.disponible);
    an("costoEntrada",       e.costoEntrada);
    an("precioNoche",        e.precioNoche);
    an("precioDia",          e.precioDia);
    an("costoAprox",         e.costoAprox);
    an("gradoDificultad",    e.gradoDificultad);
    an("capacidad",          e.capacidad);
    a("actividades",         e.actividades);
    a("epoch",               e.epoch);
    a("culturaOrigen",       e.culturaOrigen);
    a("estadoConservacion",  e.estadoConservacion);
    a("fechaInicio",         e.fechaInicio);
    a("fechaFin",            e.fechaFin);
    a("frecuencia",          e.frecuencia);
    a("incluye",             e.incluye);
    a("servicios",           e.servicios);
    a("ingredientes",        e.ingredientes);
    a("ruta",                e.ruta);
    arr("seLlegaPor",        e.seLlegaPor);
    arr("estaCercaDe",       e.estaCercaDe);
    arr("ofreceEvento",      e.ofreceEvento);
    arr("seRealizaEn",       e.seRealizaEn);
    arr("tieneAtractivo",    e.tieneAtractivo);
    arr("tieneEstablecimiento", e.tieneEstablecimiento);
    arr("ofreceGastronomia", e.ofreceGastronomia);
    arr("ofreceHospedaje",   e.ofreceHospedaje);
    arr("ubicadoEn",         e.ubicadoEn);

    owl += `\n  </owl:NamedIndividual>`;
  }

  owl += `\n</rdf:RDF>`;
  return owl;
}

cargarOntologia();
module.exports = { buscar, serializarAOWL, sugerencias, buscarPorPrefijo };