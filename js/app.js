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

/* Tarjeta 4: registro y acceso de socios con vistas por tipo de usuario (VSDM). */
(() => {
  "use strict";

  const CLAVE_SESION = "gymcontrol.sesion";
  const LARGO_MINIMO = 8;
  const DIAS_AVISO = 7;
  const fechaLarga = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" });
  const emailValido = texto => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
  let sesionEnMemoria = null;

  // sessionStorage puede estar bloqueado; en ese caso la sesión dura mientras la página siga abierta.
  function leerSesion() {
    try {
      const sesion = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
      return sesion && typeof sesion.nombre === "string" && typeof sesion.email === "string"
        ? sesion : null;
    } catch {
      return sesionEnMemoria;
    }
  }

  function guardarSesion(sesion) {
    sesionEnMemoria = sesion;
    try {
      if (sesion) sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
      else sessionStorage.removeItem(CLAVE_SESION);
    } catch {
      // Se conserva la copia en memoria.
    }
  }

  // El mismo enlace del encabezado se presenta distinto al visitante y al socio.
  function actualizarEncabezado(sesion) {
    document.querySelectorAll("[data-enlace-acceso]").forEach(enlace => {
      enlace.textContent = sesion ? "Mi cuenta" : "Ingresar";
    });
  }

  const sesionInicial = leerSesion();
  actualizarEncabezado(sesionInicial);

  // En comprar.html el socio autenticado encuentra sus datos precargados.
  const compraNombre = document.getElementById("nombre");
  const compraEmail = document.getElementById("email");
  if (sesionInicial && compraNombre && compraEmail) {
    if (!compraNombre.value) compraNombre.value = sesionInicial.nombre;
    if (!compraEmail.value) compraEmail.value = sesionInicial.email;
  }

  const formIngreso = document.getElementById("form-ingreso");
  if (!formIngreso) return;

  const formRegistro = document.getElementById("form-registro");
  const ingresoEmail = document.getElementById("ingreso-email");
  const ingresoClave = document.getElementById("ingreso-clave");
  const mensajeIngreso = document.getElementById("mensaje-ingreso");
  const registroNombre = document.getElementById("registro-nombre");
  const registroEmail = document.getElementById("registro-email");
  const registroClave = document.getElementById("registro-clave");
  const registroRepetir = document.getElementById("registro-repetir");
  const mensajeRegistro = document.getElementById("mensaje-registro");
  const vistaVisitante = document.getElementById("vista-visitante");
  const vistaSocio = document.getElementById("vista-socio");
  const saludo = document.getElementById("saludo-socio");
  const etiqueta = document.getElementById("socio-etiqueta");
  const salidaPlan = document.getElementById("socio-plan");
  const salidaEstado = document.getElementById("socio-estado");
  const salidaVencimiento = document.getElementById("socio-vencimiento");
  const salidaDias = document.getElementById("socio-dias");
  const aviso = document.getElementById("socio-aviso");
  const renovar = document.getElementById("socio-renovar");
  const cerrarSesion = document.getElementById("cerrar-sesion");

  // ---- Servidor simulado: los datos llegan por HTTP y la clave se compara por su resumen.
  async function consultarSocios() {
    const respuesta = await fetch("data/usuarios.json", { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    const socios = await respuesta.json();
    if (!Array.isArray(socios)) throw new Error("El archivo de socios debe ser un array.");
    return socios;
  }

  async function resumenSHA256(texto) {
    const bytes = new TextEncoder().encode(texto);
    const resumen = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(resumen)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function verificarCredenciales(email, clave) {
    const socio = (await consultarSocios()).find(s => s.email.toLowerCase() === email);
    if (!socio) return null;
    return await resumenSHA256(socio.sal + clave) === socio.claveHash ? socio : null;
  }

  async function nombreDelPlan(planId) {
    try {
      const respuesta = await fetch("data/planes.json");
      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
      const plan = (await respuesta.json()).find(p => p.id === planId);
      return plan ? plan.nombre : planId;
    } catch {
      return planId;
    }
  }

  // ---- Estado de la membresía (RF07) a partir de la fecha de vencimiento.
  function fechaLocal(iso) {
    const [anio, mes, dia] = iso.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
  }

  function estadoMembresia(membresia) {
    if (!membresia) return { texto: "Sin membresía", clase: "estado-sin", dias: null };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias = Math.round((fechaLocal(membresia.vencimiento) - hoy) / 86400000);
    if (dias < 0) return { texto: "Vencida", clase: "estado-vencida", dias };
    if (dias <= DIAS_AVISO) return { texto: "Por vencer", clase: "estado-por-vencer", dias };
    return { texto: "Activa", clase: "estado-activa", dias };
  }

  const cantidadDias = n => `${n} ${n === 1 ? "día" : "días"}`;

  const avisos = {
    "estado-activa": "Tu membresía está al día.",
    "estado-por-vencer": "Tu membresía vence pronto. Podés renovarla desde acá.",
    "estado-vencida": "Tu membresía está vencida. Renovala para volver a entrenar.",
    "estado-sin": "Todavía no tenés un plan activo. Elegí uno para empezar."
  };

  // ---- Vistas: el visitante ve los formularios; el socio, los datos de su membresía.
  function mostrarVista(mensaje) {
    const sesion = leerSesion();
    actualizarEncabezado(sesion);
    vistaVisitante.hidden = Boolean(sesion);
    vistaSocio.hidden = !sesion;
    if (!sesion) return;

    const membresia = sesion.membresia;
    const estado = estadoMembresia(membresia);
    saludo.textContent = `Hola, ${sesion.nombre.split(" ")[0]}`;
    etiqueta.textContent = sesion.id ? `Socio ${sesion.id}` : "Cuenta nueva";
    salidaEstado.textContent = estado.texto;
    salidaEstado.className = `estado-badge ${estado.clase}`;
    salidaVencimiento.textContent = membresia ? fechaLarga.format(fechaLocal(membresia.vencimiento)) : "—";
    salidaDias.textContent = estado.dias === null ? "—"
      : estado.dias < 0 ? `Venció hace ${cantidadDias(-estado.dias)}` : cantidadDias(estado.dias);
    aviso.textContent = mensaje ? `${mensaje} ${avisos[estado.clase]}` : avisos[estado.clase];
    if (membresia) {
      renovar.textContent = "Renovar plan";
      renovar.href = `comprar.html?plan=${encodeURIComponent(membresia.planId)}`;
      salidaPlan.textContent = "Cargando…";
      nombreDelPlan(membresia.planId).then(nombre => { salidaPlan.textContent = nombre; });
    } else {
      renovar.textContent = "Elegir un plan";
      renovar.href = "listado_box.html";
      salidaPlan.textContent = "Sin plan";
    }
  }

  function iniciarSesion(socio, mensaje) {
    // La sesión nunca guarda la sal ni el resumen de la clave.
    const { id = null, nombre, email, membresia = null } = socio;
    guardarSesion({ id, nombre, email, membresia });
    mostrarVista(mensaje);
    saludo.focus();
  }

  // ---- Mensajes y validación.
  function mostrarMensaje(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.classList.toggle("mensaje-error", tipo === "error");
    elemento.classList.toggle("mensaje-exito", tipo === "exito");
  }

  function marcarError(campo, mensaje, texto) {
    campo.setAttribute("aria-invalid", "true");
    campo.focus();
    mostrarMensaje(mensaje, texto, "error");
  }

  // Cada regla es [campo, esInvalido, texto]; se informa la primera que falla.
  function validar(reglas, mensaje) {
    const falla = reglas.find(([, esInvalido]) => esInvalido);
    if (falla) marcarError(falla[0], mensaje, falla[2]);
    return !falla;
  }

  function ocupado(form, activo) {
    const boton = form.querySelector('button[type="submit"]');
    if (activo) boton.dataset.texto = boton.textContent;
    boton.textContent = activo ? "Verificando…" : boton.dataset.texto;
    boton.disabled = activo;
    form.setAttribute("aria-busy", String(activo));
  }

  const errorConexion = "No se pudo verificar la cuenta. Revisá que el sitio se abra desde el servidor local y reintentá.";

  // ---- Eventos desacoplados del HTML.
  formIngreso.addEventListener("submit", async evento => {
    evento.preventDefault();
    const email = ingresoEmail.value.trim().toLowerCase();
    const clave = ingresoClave.value;
    const valido = validar([
      [ingresoEmail, email === "", "Ingresá tu e-mail."],
      [ingresoEmail, !emailValido(email), "Revisá el formato del e-mail."],
      [ingresoClave, clave.trim() === "", "Ingresá tu clave."],
      [ingresoClave, clave.length < LARGO_MINIMO, `La clave tiene al menos ${LARGO_MINIMO} caracteres.`]
    ], mensajeIngreso);
    if (!valido) return;

    ocupado(formIngreso, true);
    mostrarMensaje(mensajeIngreso, "Verificando credenciales…");
    try {
      const socio = await verificarCredenciales(email, clave);
      if (!socio) {
        ingresoClave.value = "";
        // Mensaje genérico: no revela si el e-mail existe.
        marcarError(ingresoClave, mensajeIngreso, "E-mail o clave incorrectos.");
        return;
      }
      formIngreso.reset();
      mostrarMensaje(mensajeIngreso, "");
      iniciarSesion(socio);
    } catch (error) {
      console.error("No se pudo verificar la cuenta:", error);
      mostrarMensaje(mensajeIngreso, errorConexion, "error");
    } finally {
      ocupado(formIngreso, false);
    }
  });

  formRegistro.addEventListener("submit", async evento => {
    evento.preventDefault();
    const nombre = registroNombre.value.trim().replace(/\s+/g, " ");
    const email = registroEmail.value.trim().toLowerCase();
    const clave = registroClave.value;
    const valido = validar([
      [registroNombre, nombre === "", "Ingresá tu nombre y apellido."],
      [registroEmail, email === "", "Ingresá tu e-mail."],
      [registroEmail, !emailValido(email), "Revisá el formato del e-mail."],
      [registroClave, clave.trim() === "", "Ingresá una clave."],
      [registroClave, clave.length < LARGO_MINIMO, `La clave debe tener al menos ${LARGO_MINIMO} caracteres.`],
      [registroRepetir, registroRepetir.value !== clave, "Las claves no coinciden."]
    ], mensajeRegistro);
    if (!valido) return;

    ocupado(formRegistro, true);
    mostrarMensaje(mensajeRegistro, "Verificando datos…");
    try {
      const socios = await consultarSocios();
      if (socios.some(s => s.email.toLowerCase() === email)) {
        marcarError(registroEmail, mensajeRegistro, "Ya existe una cuenta con ese e-mail. Ingresá desde el formulario 01.");
        return;
      }
      // Simulación: el alta no se envía a un servidor real ni se agrega al JSON.
      formRegistro.reset();
      mostrarMensaje(mensajeRegistro, "");
      iniciarSesion({ nombre, email }, "Cuenta creada.");
    } catch (error) {
      console.error("No se pudo registrar la cuenta:", error);
      mostrarMensaje(mensajeRegistro, errorConexion, "error");
    } finally {
      ocupado(formRegistro, false);
    }
  });

  // Al corregir un campo se quita su marca de error.
  [formIngreso, formRegistro].forEach(form => form.addEventListener("input", evento => {
    evento.target.removeAttribute("aria-invalid");
  }));

  cerrarSesion.addEventListener("click", () => {
    guardarSesion(null);
    mostrarVista();
    mostrarMensaje(mensajeIngreso, "Cerraste sesión.", "exito");
    ingresoEmail.focus();
  });

  mostrarVista();
})();

/* Tarjeta 11: formulario de reclamos y consultas. */
(() => {
  "use strict";

  const formulario = document.getElementById("form-reclamo");
  if (!formulario) return;

  const comentario = document.getElementById("comentario-reclamo");
  const contador = document.getElementById("contador-reclamo");
  const mensaje = document.getElementById("mensaje-reclamo");
  const boton = document.getElementById("enviar-reclamo");
  const LIMITE = 500;
  const MINIMO = 10;

  // El contador y la validación reaccionan a cada tecla, sin esperar el envío.
  function actualizarContador() {
    const longitud = comentario.value.length;
    contador.textContent = `${longitud} / ${LIMITE} caracteres`;
    contador.classList.toggle("field-hint-alerta", longitud > LIMITE);
  }

  function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.classList.remove("mensaje-error", "mensaje-exito");
  }

  async function enviarReclamo(evento) {
    evento.preventDefault();
    limpiarMensaje();

    // .trim() evita que espacios en blanco cuenten como un reclamo válido.
    const texto = comentario.value.trim();
    if (texto.length < MINIMO) {
      mensaje.textContent = `Escribí al menos ${MINIMO} caracteres para enviar tu reclamo.`;
      mensaje.classList.add("mensaje-error");
      comentario.focus();
      return;
    }
    if (texto.length > LIMITE) {
      mensaje.textContent = `Tu reclamo supera los ${LIMITE} caracteres permitidos.`;
      mensaje.classList.add("mensaje-error");
      comentario.focus();
      return;
    }

    boton.disabled = true;
    mensaje.classList.remove("mensaje-error", "mensaje-exito");
    mensaje.textContent = "Enviando tu reclamo…";

    try {
      // Llamada HTTP asíncrona a un archivo local que simula la respuesta del servidor.
      const respuesta = await fetch("data/confirmacion-reclamo.json", { cache: "no-store" });
      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      mensaje.textContent = datos.mensaje ?? "¡Gracias! Recibimos tu reclamo.";
      mensaje.classList.add("mensaje-exito");
      formulario.reset();
      actualizarContador();
    } catch (error) {
      console.error("No se pudo enviar el reclamo:", error);
      mensaje.textContent = "No pudimos enviar tu reclamo. Revisá el servidor HTTP e intentá de nuevo.";
      mensaje.classList.add("mensaje-error");
    } finally {
      boton.disabled = false;
    }
  }

  comentario.addEventListener("input", actualizarContador);
  formulario.addEventListener("submit", enviarReclamo);
  actualizarContador();
})();
