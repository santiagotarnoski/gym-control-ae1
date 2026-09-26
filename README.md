# Gym Control — Actividad Evaluativa 1

Frontend estático para consultar y seleccionar visualmente planes de un gimnasio. El proyecto implementa **RF05 - Gestión de planes** y representa parcialmente **RF06 - Gestión de membresías**, sin realizar asignaciones ni guardar datos.

## Tecnologías

- HTML5
- CSS3
- JavaScript



## Páginas

- `index.html`: portada principal.
- `listado_tabla.html`: listado de planes en una tabla HTML.
- `listado_box.html`: listado de planes en cards.
- `js/app.js`: buscador y filtro del catálogo, carga HTTP y preselección del plan elegido.
- `data/planes.json`: catálogo de los cuatro planes de ejemplo del TP1.
- `producto.html`: detalle del Plan Mensual.
- `comprar.html`: formulario visual para seleccionar un plan.
- `js/subtotal.js`: calcula en pantalla el subtotal segun la cantidad elegida.
- `js/cupon.js`: valida el código de descuento `UCP10` en la pantalla de compra.

## Ejecución

La tarjeta 3 requiere un servidor HTTP para cargar el catálogo con `fetch()`. Abrir el HTML con doble clic (`file://`) no permite probar correctamente esa petición.

Con Python instalado, ejecutar `iniciar.bat` en Windows o abrir una terminal en la carpeta del proyecto y ejecutar:

```sh
py -m http.server 8000 --bind 127.0.0.1
```

Si la instalación usa el comando `python`, reemplazar `py` por `python`. Abrir `http://localhost:8000/index.html` y elegir **Planes en cards**. Mantener abierta la terminal; `Ctrl+C` detiene el servidor. También se puede usar **Open with Live Server** desde Visual Studio Code si la extensión está instalada.

## Startup Relámpago y tarjeta 3

Se implementa la **opción 3: Buscador y filtro de catálogo en tiempo real**, manteniendo la temática del gimnasio. La fundamentación utiliza **SOHDM**, con un escenario de exploración y búsqueda y su mapa navegacional.

- Eventos `input`, `change` y `click` mediante `addEventListener()` en `js/app.js`.
- Carga completa de `data/planes.json` con `fetch()` y `async/await`.
- Filtrado en memoria con `.filter()` por nombre, descripción o categoría, combinado con duración.
- Búsqueda sin distinción de mayúsculas, tildes o espacios exteriores.
- Tarjetas, contador y mensajes actualizados en el DOM, sin recargar ni repetir la petición al filtrar.
- Estados de carga, catálogo vacío, búsqueda sin resultados y error con reintento.
- El enlace de cada resultado lleva a `comprar.html?plan=...` y preselecciona el plan.

El trabajo anterior de subtotal y cupón se conserva en `js/subtotal.js` y `js/cupon.js`. La validación del cupón mantiene su comportamiento original: muestra el mensaje del beneficio y no modifica el subtotal. Esta actividad no procesa compras ni guarda membresías.

### Demostración

1. Abrir **Planes en cards**: aparecen cuatro planes cargados del JSON.
2. Buscar `renovacion`: aparece el Plan Mensual aunque su descripción contiene `renovación` con tilde.
3. Buscar `progreso` y elegir `6 meses`: aparece el Plan Semestral.
4. Mantener esa búsqueda y elegir `1 mes`: aparece el mensaje sin resultados.
5. Pulsar **Limpiar filtros**: vuelven los cuatro planes.
6. Elegir el Plan Trimestral: se abre el formulario con el plan marcado y subtotal de $67.500.
7. Para simular un error HTTP, renombrar temporalmente `data/planes.json`, recargar, restaurar el nombre y pulsar **Reintentar carga**.

La búsqueda `mensual` devuelve también el Plan Anual porque su descripción contiene “valor mensual”; el filtro consulta todos los campos indicados.

### Pruebas automáticas

Se realizaron 36 comprobaciones con Google Chrome. Para reproducirlas, con Node.js y Chrome instalados:

```sh
npm install
npm test
```

Las pruebas levantan su propio servidor local, comprueban la interacción y generan el registro y las capturas en `docs/`. Solo son necesarias dependencias de Node para las pruebas; el sitio usa HTML, CSS y JavaScript sin bibliotecas de producción.

## Documentación

El análisis y diseño de la aplicación se encuentra en [`docs/Gym_Control_AE1_Analisis_y_Diseno.pdf`](docs/Gym_Control_AE1_Analisis_y_Diseno.pdf).

Las capturas de las validaciones de la pantalla de compra estan en [`docs/capturas/`](docs/capturas).

La nueva entrega contiene:

- [Informe de tarjeta 3 en PDF](docs/Informe_Gym_Control_Tarjeta_3.pdf).
- [Informe editable en Markdown](docs/Informe_Gym_Control_Tarjeta_3.md).
- [Mapa navegacional editable](docs/mapa-navegacional-tarjeta3.mmd).
- [Capturas de tarjeta 3](docs/capturas-tarjeta3/).
- [Registro de pruebas](docs/pruebas-tarjeta3.json).

## Integrantes

- Martins, Santino
- Olexyn, Franco
- Tarnoski, Santiago

Profesor: Sicardi, Dante.
