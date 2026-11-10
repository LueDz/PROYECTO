// ====== CONFIGURACIÓN: editá solo esta parte para empezar ======
const CONFIG = {
  // Número con código de país, sin + ni espacios. Ej Argentina móvil: 5491123456789
  whatsapp: "5491178142528",
  claveCarrito: "gloves-carrito", // nombre con el que se guarda el pedido en el navegador
  // Frase del cartel verde de arriba. Cambiala según la fecha o el producto. Vacía ("") = sin cartel.
  promo: "Armá tu setup para las fiestas: kits con factura y cambio por falla.",
  // Frases que se alternan en la pestaña del navegador cuando la persona está en otra pestaña.
  // Editalas cuando quieras. Dejá la lista vacía ([]) para desactivar el efecto.
  titulosAusente: ["¡Volvé! Tus productos te esperan", "Pedí tu cotización por WhatsApp"],
  maxPorItem: 99,
  // Fase 2: cuando tengas la función serverless que crea el cobro en Mercado Pago, pegá acá su URL.
  // Mientras esté vacío, el pedido se envía por WhatsApp y vos mandás el link de pago.
  checkoutUrl: "",
};

// Zonas de entrega. costo: número en pesos, 0 = gratis, null = "A confirmar". plazo: texto o null.
const ZONAS = [
  { id: "retiro", nombre: "Retiro / punto de encuentro", costo: 0, plazo: null },
  { id: "caba", nombre: "CABA", costo: null, plazo: null },
  { id: "gba", nombre: "Gran Buenos Aires", costo: null, plazo: null },
  { id: "interior", nombre: "Resto del país (Andreani / OCA)", costo: null, plazo: null },
];

// Opcional: agregá linkMP: "https://mpago.la/..." a un producto para habilitar el botón de pago directo.
// uso: "teletrabajo" | "oficina" | "ambos". precio: número o null (muestra "Consultar precio")
// IMPORTANTE: cada id debe ser único y no cambiarlo una vez publicado.
const PRODUCTS = [
  { id: "kit-teclado-mouse", nombre: "Kit teclado + mouse inalámbrico", uso: "ambos", precio: null, detalle: "Para el escritorio de todos los días." },
  { id: "mouse-inalambrico", nombre: "Mouse inalámbrico", uso: "ambos", precio: null, detalle: "Compacto y silencioso." },
  { id: "webcam-fhd", nombre: "Webcam Full HD con micrófono", uso: "teletrabajo", precio: null, detalle: "Para videollamadas y clases." },
  { id: "auricular-usb", nombre: "Auriculares USB con micrófono", uso: "oficina", precio: null, detalle: "Pensados para jornadas largas." },
  { id: "pendrive", nombre: "Pendrive 64 / 128 GB", uso: "ambos", precio: null, detalle: "Para llevar y respaldar archivos." },
];

const KITS = [
  { id: "kit-teletrabajo", nombre: "Kit Teletrabajo", detalle: "Mouse + webcam + auriculares con micrófono.", precio: null },
  { id: "pack-oficina", nombre: "Pack Oficina por puesto", detalle: "Teclado y mouse inalámbricos + auriculares. Precio por cantidad.", precio: null },
  { id: "kit-estudiante", nombre: "Kit Estudiante", detalle: "Teclado y mouse + webcam + pendrive.", precio: null },
];
// ================================================================

const USOS = { todos: "Todos", teletrabajo: "Teletrabajo y estudio", oficina: "Oficina" };
const CATALOGO = [...PRODUCTS, ...KITS]; // para buscar un ítem por su id
let filtroActual = "todos";
let carrito = {}; // formato: { "id-del-producto": cantidad }. Se carga en DOMContentLoaded

const $ = (sel) => document.querySelector(sel);
const waLink = (texto) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
const formatoPrecio = (p) => (p == null ? "Consultar precio" : `$${p.toLocaleString("es-AR")}`);
const buscar = (id) => CATALOGO.find((x) => x.id === id);
const zonaActual = () => ZONAS.find((z) => z.id === $("#cart-zona").value) || ZONAS[0];
const textoCosto = (z) => (z.costo == null ? "A confirmar" : z.costo === 0 ? "Sin costo" : formatoPrecio(z.costo));

// ---------- Carrito: datos ----------
function cargarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CONFIG.claveCarrito)) || {};
    // descarta ids que ya no existen en el catálogo
    return Object.fromEntries(Object.entries(guardado).filter(([id, q]) => buscar(id) && q > 0));
  } catch (err) {
    console.warn("No se pudo leer el carrito guardado:", err);
    return {}; // si el navegador bloquea el almacenamiento, arranca vacío
  }
}

function guardarCarrito() {
  try {
    localStorage.setItem(CONFIG.claveCarrito, JSON.stringify(carrito));
  } catch (err) {
    console.warn("No se pudo guardar el carrito:", err);
  }
}

function cambiarCantidad(id, delta) {
  const nueva = Math.min(CONFIG.maxPorItem, (carrito[id] || 0) + delta);
  if (nueva <= 0) delete carrito[id];
  else carrito[id] = nueva;
  guardarCarrito();
  renderCarrito();
}

function totalUnidades() {
  return Object.values(carrito).reduce((a, b) => a + b, 0);
}

// Devuelve el total solo si TODOS los ítems tienen precio; si no, null
function calcularTotal() {
  let total = 0;
  for (const [id, q] of Object.entries(carrito)) {
    const { precio } = buscar(id);
    if (precio == null) return null;
    total += precio * q;
  }
  return total;
}

// ---------- Tarjetas de productos y kits ----------
function crearCard(item) {
  const card = document.createElement("article");
  card.className = "card";

  const ph = document.createElement("div");
  ph.className = "ph";
  ph.textContent = "Foto"; // Reemplazá por <img src="..." alt="...">
  const h3 = document.createElement("h3");
  h3.textContent = item.nombre;
  const p = document.createElement("p");
  p.textContent = item.detalle;
  const pr = document.createElement("p");
  pr.className = "price";
  pr.textContent = formatoPrecio(item.precio);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.textContent = "Agregar al pedido";
  btn.addEventListener("click", () => {
    cambiarCantidad(item.id, 1);
    btn.textContent = "Agregado";
    setTimeout(() => (btn.textContent = "Agregar al pedido"), 1200);
  });

  card.append(ph, h3, p, pr, btn);
  return card;
}

function renderProductos() {
  const grid = $("#product-grid");
  grid.replaceChildren();
  PRODUCTS
    .filter((x) => filtroActual === "todos" || x.uso === filtroActual || x.uso === "ambos")
    .forEach((x) => grid.append(crearCard(x)));
}

function renderFiltros() {
  const cont = $("#filters");
  Object.entries(USOS).forEach(([clave, texto]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "filter";
    b.textContent = texto;
    b.setAttribute("aria-pressed", clave === filtroActual);
    b.addEventListener("click", () => {
      filtroActual = clave;
      cont.querySelectorAll(".filter").forEach((el) => el.setAttribute("aria-pressed", el === b));
      renderProductos();
    });
    cont.append(b);
  });
}

function renderKits() {
  const grid = $("#kit-grid");
  KITS.forEach((k) => grid.append(crearCard(k)));
}

// ---------- Carrito: pantalla ----------
function renderCarrito() {
  const lista = $("#cart-items");
  lista.replaceChildren();

  Object.entries(carrito).forEach(([id, q]) => {
    const item = buscar(id);
    const li = document.createElement("li");
    li.className = "cart-item";

    const info = document.createElement("div");
    const nombre = document.createElement("strong");
    nombre.textContent = item.nombre;
    const sub = document.createElement("small");
    sub.textContent = item.precio == null ? "Precio a confirmar" : formatoPrecio(item.precio * q);
    info.append(nombre, sub);

    const qty = document.createElement("div");
    qty.className = "qty";
    const menos = document.createElement("button");
    menos.type = "button";
    menos.textContent = "−";
    menos.setAttribute("aria-label", `Quitar una unidad de ${item.nombre}`);
    menos.addEventListener("click", () => cambiarCantidad(id, -1));
    const cant = document.createElement("span");
    cant.textContent = q;
    const mas = document.createElement("button");
    mas.type = "button";
    mas.textContent = "+";
    mas.setAttribute("aria-label", `Agregar una unidad de ${item.nombre}`);
    mas.addEventListener("click", () => cambiarCantidad(id, 1));
    qty.append(menos, cant, mas);

    li.append(info, qty);
    lista.append(li);
  });

  const vacio = totalUnidades() === 0;
  $("#cart-empty").hidden = !vacio;
  $("#cart-count").textContent = totalUnidades();
  const total = calcularTotal();
  const z = zonaActual();
  $("#cart-envio").textContent = vacio ? "" : `Envío (${z.nombre}): ${textoCosto(z)}`;
  const totalFinal = total == null || z.costo == null ? null : total + z.costo;
  $("#cart-total").textContent = vacio ? "" : totalFinal == null ? "Total: a confirmar por WhatsApp" : `Total: ${formatoPrecio(totalFinal)}`;

  // Botón de pago directo: solo si hay un único producto, 1 unidad, con linkMP y precio final conocido
  const ids = Object.keys(carrito);
  const unico = ids.length === 1 && carrito[ids[0]] === 1 ? buscar(ids[0]) : null;
  $("#cart-mp").hidden = !(unico && unico.linkMP && z.costo != null);
}

// ---------- Zonas de entrega ----------
function renderZonas() {
  const cuerpo = $("#zonas-body");
  const select = $("#cart-zona");
  ZONAS.forEach((z) => {
    const tr = document.createElement("tr");
    [z.nombre, z.plazo || "A confirmar", textoCosto(z)].forEach((t) => {
      const td = document.createElement("td");
      td.textContent = t;
      tr.append(td);
    });
    cuerpo.append(tr);
    const op = document.createElement("option");
    op.value = z.id;
    op.textContent = z.nombre;
    select.append(op);
  });
  select.addEventListener("change", renderCarrito);
}

// ---------- Carrito: abrir, cerrar y enviar ----------
function abrirCarrito() {
  $("#cart").hidden = false;
  $("#overlay").hidden = false;
  $("#cart-btn").setAttribute("aria-expanded", "true");
  $("#cart-close").focus();
}

function cerrarCarrito() {
  $("#cart").hidden = true;
  $("#overlay").hidden = true;
  $("#cart-btn").setAttribute("aria-expanded", "false");
  $("#cart-btn").focus();
}

function armarMensaje() {
  const nombre = $("#cart-nombre").value.trim();
  const nota = $("#cart-nota").value.trim();
  const lineas = Object.entries(carrito).map(([id, q]) => {
    const item = buscar(id);
    const precio = item.precio == null ? "" : ` (${formatoPrecio(item.precio)} c/u)`;
    return `- ${q} x ${item.nombre}${precio}`;
  });
  const total = calcularTotal();
  return [
    `Hola, soy ${nombre}. Quiero hacer este pedido:`,
    ...lineas,
    `Entrega: ${zonaActual().nombre} (envío: ${textoCosto(zonaActual())}).`,
    `Medio de pago: ${$("#cart-pago").value}.`,
    total == null ? "Total: a confirmar." : `Total de productos: ${formatoPrecio(total)}.`,
    nota ? `Notas: ${nota}` : "",
  ].filter(Boolean).join("\n");
}

function enviarPedido() {
  const error = $("#cart-error");
  if (totalUnidades() === 0) {
    error.textContent = "Agregá al menos un producto.";
    return;
  }
  if (!$("#cart-nombre").value.trim()) {
    error.textContent = "Ingresá tu nombre.";
    $("#cart-nombre").focus();
    return;
  }
  error.textContent = "";
  if (CONFIG.checkoutUrl && $("#cart-pago").value === "Mercado Pago") return pagarOnline(error);
  window.open(waLink(armarMensaje()), "_blank", "noopener");
}

// Fase 2: tu función serverless recibe el pedido, crea la preferencia de Mercado Pago y devuelve { url }.
async function pagarOnline(error) {
  try {
    const items = Object.entries(carrito).map(([id, q]) => ({ id, cantidad: q }));
    const r = await fetch(CONFIG.checkoutUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, zona: zonaActual().id, nombre: $("#cart-nombre").value.trim(), nota: $("#cart-nota").value.trim() }),
    });
    const datos = await r.json();
    if (!r.ok || !datos.url) throw new Error("Respuesta inválida");
    window.location.href = datos.url;
  } catch (err) {
    console.warn("Falló el pago online:", err);
    error.textContent = "No pudimos iniciar el pago. Enviá el pedido por WhatsApp.";
    window.open(waLink(armarMensaje()), "_blank", "noopener");
  }
}

function iniciarCarrito() {
  $("#cart-btn").addEventListener("click", abrirCarrito);
  $("#cart-close").addEventListener("click", cerrarCarrito);
  $("#overlay").addEventListener("click", cerrarCarrito);
  $("#cart-send").addEventListener("click", enviarPedido);
  $("#cart-mp").addEventListener("click", () => {
    const id = Object.keys(carrito)[0];
    window.open(buscar(id).linkMP, "_blank", "noopener");
  });
  $("#cart-clear").addEventListener("click", () => {
    carrito = {};
    guardarCarrito();
    renderCarrito();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#cart").hidden) cerrarCarrito();
  });
  renderCarrito();
}

// ---------- Menú móvil y formulario de contacto ----------
function iniciarMenu() {
  const btn = $("#menu-btn");
  const nav = $("#nav");
  btn.addEventListener("click", () => {
    const abierto = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", abierto);
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    })
  );
}

function iniciarFormulario() {
  const form = $("#contact-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    const mensaje = form.mensaje.value.trim();
    $("#err-nombre").textContent = nombre ? "" : "Ingresá tu nombre.";
    $("#err-mensaje").textContent = mensaje ? "" : "Contanos qué necesitás.";
    if (!nombre || !mensaje) return;

    const texto = `Hola, soy ${nombre} (${form.tipo.value}). ${mensaje}`;
    window.open(waLink(texto), "_blank", "noopener");
  });
}

// ---------- Título de la pestaña cuando la persona se va ----------
function iniciarTituloAusente() {
  if (!CONFIG.titulosAusente.length) return;
  const original = document.title;
  let reloj = null;
  let i = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      reloj = setInterval(() => {
        const frases = totalUnidades() > 0 ? ["Dejaste productos en tu pedido", ...CONFIG.titulosAusente] : CONFIG.titulosAusente;
        document.title = i % 2 === 0 ? frases[(i / 2) % frases.length] : original;
        i++;
      }, 2000);
    } else {
      clearInterval(reloj);
      document.title = original;
      i = 0;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carrito = cargarCarrito();
  const promo = $("#promo");
  promo.textContent = CONFIG.promo;
  promo.hidden = !CONFIG.promo;
  $("#year").textContent = new Date().getFullYear();
  renderFiltros();
  renderProductos();
  renderKits();
  renderZonas();
  iniciarTituloAusente();
  iniciarMenu();
  iniciarFormulario();
  iniciarCarrito();
});