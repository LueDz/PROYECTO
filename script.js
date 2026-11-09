// ====== CONFIGURACIÓN: editá solo esta parte para empezar ======
const CONFIG = {
  // Número con código de país, sin + ni espacios. Ej Argentina móvil: 5491123456789
  whatsapp: "5491178142528",
  claveCarrito: "gloves-carrito", // nombre con el que se guarda el pedido en el navegador
  maxPorItem: 99,
};

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
  $("#cart-total").textContent = vacio ? "" : total == null ? "Total: a confirmar por WhatsApp" : `Total: ${formatoPrecio(total)}`;
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
    total == null ? "Total: a confirmar." : `Total estimado: ${formatoPrecio(total)}.`,
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
  window.open(waLink(armarMensaje()), "_blank", "noopener");
}

function iniciarCarrito() {
  $("#cart-btn").addEventListener("click", abrirCarrito);
  $("#cart-close").addEventListener("click", cerrarCarrito);
  $("#overlay").addEventListener("click", cerrarCarrito);
  $("#cart-send").addEventListener("click", enviarPedido);
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

document.addEventListener("DOMContentLoaded", () => {
  carrito = cargarCarrito();
  $("#year").textContent = new Date().getFullYear();
  renderFiltros();
  renderProductos();
  renderKits();
  iniciarMenu();
  iniciarFormulario();
  iniciarCarrito();
});
