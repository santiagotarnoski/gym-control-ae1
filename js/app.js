/* Tarjeta 3: catálogo asíncrono y filtros desacoplados del HTML. */
(() => {
  "use strict";

  const contenedor = document.getElementById("catalogo-planes");
  if (!contenedor) {
    // Conserva el plan del resultado al pasar al formulario del TP1.
    // subtotal.js y cupon.js siguen gestionando sus funciones originales.
    const planId = new URLSearchParams(window.location.search).get("plan");
    const radio = [...document.querySelectorAll('input[name="plan"]')]
      .find(control => control.value === planId);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return;
  }

  const busqueda = document.getElementById("buscar-plan");
  const duracion = document.getElementById("filtrar-duracion");
  const limpiar = document.getElementById("limpiar-filtros");
  const reintentar = document.getElementById("reintentar-catalogo");
  const estado = document.getElementById("estado-catalogo");
  const vacio = document.getElementById("sin-resultados");
  const moneda = new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0
  });
  let catalogo = [];
  let disponible = false;

  // Una búsqueda sin distinción de mayúsculas ni tildes.
  function normalizar(texto) {
    return texto.trim().toLocaleLowerCase("es")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function validarCatalogo(datos) {
    if (!Array.isArray(datos)) throw new Error("El catálogo debe ser un array.");
    const ids = new Set();
    const planesDelTP1 = ["mensual", "trimestral", "semestral", "anual"];
    for (const plan of datos) {
      if (!plan || !planesDelTP1.includes(plan.id) || ids.has(plan.id) ||
          !["nombre", "descripcion", "categoria"].every(campo =>
            typeof plan[campo] === "string" && plan[campo].trim() !== "") ||
          ![1, 3, 6, 12].includes(plan.duracionMeses) ||
          !Number.isFinite(plan.precio) || plan.precio <= 0 ||
          typeof plan.destacado !== "boolean") {
        throw new Error("Un plan contiene datos inválidos.");
      }
      ids.add(plan.id);
    }
    return datos;
  }

  function textoElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    elemento.className = clase;
    elemento.textContent = texto;
    return elemento;
  }

  function crearTarjeta(plan) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "plan-card";
    if (plan.destacado) {
      tarjeta.classList.add("plan-featured");
      tarjeta.append(textoElemento("span", "featured-label", "Recomendado"));
    }
    const cabecera = document.createElement("div");
    cabecera.className = "plan-card-head";
    cabecera.append(
      textoElemento("span", "plan-tag", plan.categoria),
      textoElemento("h2", "", plan.nombre),
      textoElemento("p", "plan-duration", `${plan.duracionMeses} ${plan.duracionMeses === 1 ? "mes" : "meses"}`)
    );
    const precio = document.createElement("p");
    precio.className = "plan-price";
    precio.append(textoElemento("strong", "", moneda.format(plan.precio)),
      textoElemento("span", "", " / total"));
    const enlace = textoElemento("a",
      `button ${plan.destacado ? "button-primary" : "button-outline"} button-full`, "Elegir plan");
    enlace.href = `comprar.html?plan=${encodeURIComponent(plan.id)}`;
    enlace.setAttribute("aria-label", `Elegir ${plan.nombre}`);
    tarjeta.append(cabecera, precio,
      textoElemento("p", "plan-description", plan.descripcion), enlace);
    // El TP1 tiene una ficha de detalle específica del Plan Mensual.
    if (plan.id === "mensual") {
      const detalle = textoElemento("a", "text-link", "Ver detalle del Plan Mensual");
      detalle.href = "producto.html";
      tarjeta.append(detalle);
    }
    return tarjeta;
  }

  function filtrarPlanes() {
    if (!disponible) return;
    const termino = normalizar(busqueda.value);
    const meses = Number(duracion.value);
    // Ambos criterios deben cumplirse. Se filtra en memoria, sin otro fetch.
    const resultados = catalogo.filter(plan => {
      const contenido = normalizar(`${plan.nombre} ${plan.descripcion} ${plan.categoria}`);
      return contenido.includes(termino) &&
        (duracion.value === "" || plan.duracionMeses === meses);
    });
    const fragmento = document.createDocumentFragment();
    resultados.forEach(plan => fragmento.append(crearTarjeta(plan)));
    contenedor.replaceChildren(fragmento);
    vacio.hidden = resultados.length !== 0;
    estado.classList.remove("mensaje-error");
    estado.textContent = catalogo.length === 0
      ? "No hay planes disponibles en el catálogo."
      : `${resultados.length} de ${catalogo.length} planes encontrados.`;
    if (catalogo.length === 0) {
      vacio.textContent = "El catálogo está vacío. Podés consultar más tarde o revisar el listado en tabla.";
    } else {
      vacio.textContent = "No encontramos planes con esos filtros. Probá otra búsqueda o limpiá los filtros.";
    }
  }

  async function cargarCatalogo() {
    disponible = false;
    catalogo = [];
    contenedor.replaceChildren();
    contenedor.setAttribute("aria-busy", "true");
    vacio.hidden = true;
    reintentar.hidden = true;
    [busqueda, duracion, limpiar].forEach(control => { control.disabled = true; });
    estado.classList.remove("mensaje-error");
    estado.textContent = "Cargando planes…";
    try {
      const respuesta = await fetch("data/planes.json", { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
      catalogo = validarCatalogo(await respuesta.json());
      disponible = true;
      [busqueda, duracion, limpiar].forEach(control => { control.disabled = false; });
      filtrarPlanes();
    } catch (error) {
      console.error("No se pudo cargar el catálogo:", error);
      estado.textContent = "No se pudieron cargar los planes. Revisá el servidor HTTP y reintentá.";
      estado.classList.add("mensaje-error");
      reintentar.hidden = false;
    } finally {
      contenedor.setAttribute("aria-busy", "false");
    }
  }

  busqueda.addEventListener("input", filtrarPlanes);
  duracion.addEventListener("change", filtrarPlanes);
  limpiar.addEventListener("click", () => {
    busqueda.value = "";
    duracion.value = "";
    filtrarPlanes();
    busqueda.focus();
  });
  reintentar.addEventListener("click", cargarCatalogo);
  cargarCatalogo();
})();
