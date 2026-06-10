# 🔍 Buscador Semántico - Web Semántica

> **Búsqueda inteligente de información turística local** utilizando tecnologías de Web Semántica

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**[Descripción](#-descripción) • [Instalación](#-instalación) • [API](#-api) • [Estructura](#-estructura) • [Contribuir](#-contribuir)**

</div>

---

## 📋 Descripción

Buscador semántico que permite consultar información turística local utilizando tecnologías de la Web Semántica (**RDF**, **OWL**, **SPARQL**). Los datos se alimentan desde **DBpedia** y se presentan en formato **RDF/XML**.

> 🎓 Proyecto académico desarrollado para la materia de **Web Semántica**

### ✨ Características principales

- 🔎 Búsqueda semántica de entidades turísticas
- 📍 Consultas inteligentes (lugares, restaurantes, hoteles, etc.)
- 🌐 Soporte multilingüe (Español, Inglés, Italiano)
- 📊 Resultados en formato RDF/XML
- 🎨 Interfaz web moderna y amigable
- 📦 Datos desde DBpedia integrado

---

## 🛠️ Tecnologías

<table>
<tr>
  <td><b>Frontend</b></td>
  <td>
    <img src="https://img.shields.io/badge/HTML5-E34C26?style=flat&logo=html5&logoColor=white" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white" />
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" />
  </td>
</tr>
<tr>
  <td><b>Backend</b></td>
  <td>
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" />
    <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white" />
  </td>
</tr>
<tr>
  <td><b>Web Semántica</b></td>
  <td>
    <img src="https://img.shields.io/badge/RDF-FF6B35?style=flat&logoColor=white" />
    <img src="https://img.shields.io/badge/OWL-0077B6?style=flat&logoColor=white" />
    <img src="https://img.shields.io/badge/SPARQL-4CAF50?style=flat&logoColor=white" />
  </td>
</tr>
<tr>
  <td><b>Datos</b></td>
  <td>
    <img src="https://img.shields.io/badge/DBpedia-0088CC?style=flat&logoColor=white" />
  </td>
</tr>
</table>

---

## 📁 Estructura del Proyecto

```
BuscadorSemantico/
├── backend/                    # Servidor API
│   ├── data/
│   │   ├── TurismoLocal.owl      # Ontología OWL
│   │   └── TurismoLocal.ttl      # Ontología Turtle
│   ├── src/
│   │   ├── ontology.js           # Lógica de consultas SPARQL
│   │   └── server.js             # Servidor Express
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── node_modules/
│
├── frontend/                   # Interfaz de usuario
│   ├── index.html                # Página principal
│   ├── script.js                 # Lógica del cliente
│   ├── styles.css                # Estilos
│   └── images/
│
├── .vscode/                       # Config del editor
├── .gitignore
└── README.md
```

---

## ⚙️ Requisitos Previos

- ✅ **Node.js** v14 o superior
- ✅ **pnpm** (recomendado) o npm
- ✅ Navegador moderno

---

## 🚀 Instalación y Ejecución

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/alfredoronald/BuscadorSemantico.git
cd BuscadorSemantico
```

### 2️⃣ Instalar dependencias

```bash
cd backend
pnpm install  # o npm install
```

### 3️⃣ Iniciar el servidor

```bash
# Opción A: Con pnpm
pnpm start

# Opción B: Directamente con Node
node src/server.js
```

### 4️⃣ Acceder a la aplicación

Abre tu navegador en:

```
http://localhost:3000
```

---

## 📡 API del Backend

### Endpoint de búsqueda

```http
GET /api/search?q=<query>&lang=<idioma>
```

### Parámetros

| Parámetro | Tipo   | Requerido | Descripción                                  |
| --------- | ------ | --------- | -------------------------------------------- |
| `q`       | string | ✅ Sí     | Término de búsqueda                          |
| `lang`    | string | ❌ No     | Idioma: `es` \| `en` \| `it` (default: `es`) |

### Respuesta

Retorna datos en formato **RDF/XML** con los resultados de la búsqueda semántica.

### Ejemplos de uso

#### Búsqueda en español

```bash
curl "http://localhost:3000/api/search?q=restaurante&lang=es"
```

#### Búsqueda en inglés

```bash
curl "http://localhost:3000/api/search?q=hotel&lang=en"
```

#### Resultado esperado

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:turismo="http://example.org/turismo/">
  <!-- Resultados en RDF/XML -->
</rdf:RDF>
```

---

## 💡 Funcionalidades

| Funcionalidad         | Estado | Descripción                     |
| --------------------- | ------ | ------------------------------- |
| 🔍 Búsqueda semántica | ✅     | Consultas SPARQL contra DBpedia |
| 📊 Formato RDF/XML    | ✅     | Resultados estructurados en RDF |
| 🌍 Multilingüe        | ✅     | Español, inglés, italiano       |
| 📈 Ontología local    | ✅     | TurismoLocal.owl personalizada  |
| 🎨 UI responsiva      | ✅     | Interfaz adaptable              |

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│    Frontend     │ (HTML/CSS/JS)
│  (localhost)    │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│     Backend     │ (Node.js/Express)
│  API /api/search│
└────────┬────────┘
         │ SPARQL
         ▼
┌─────────────────┐
│    DBpedia      │ (Datos semánticos)
│   (Ontologías)  │
└─────────────────┘
```

---

## 📝 Notas Técnicas

- Utiliza **ontologías propias** (`TurismoLocal.owl`) para modelar el dominio turístico
- Realiza **consultas SPARQL** para obtener resultados desde DBpedia
- Soporta consultas multilingües
- Respuestas en formato estándar **RDF/XML**

---

## 👥 Contribuidores

**Repositorio original:** [alfredoronald/BuscadorSemantico](https://github.com/alfredoronald/BuscadorSemantico)

**Total de contribuidores:** 8

---

<div align="center">

**Última actualización:** 10 de junio de 2026

[⬆ Volver al inicio](#-buscador-semántico---web-semántica)

</div>
