const WHATSAPP_NUMBER = "50588888888";
const DB_KEY = "vipphone_products";
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80";

const DEFAULT_PRODUCTS = [
  {
    id: "p-iphone-12",
    name: "iPhone 12 128GB",
    category: "Telefonos",
    price: 329,
    stock: 4,
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?auto=format&fit=crop&w=900&q=80",
    description: "Equipo desbloqueado, Face ID, pantalla Super Retina y excelente rendimiento."
  },
  {
    id: "p-samsung-a55",
    name: "Samsung Galaxy A55",
    category: "Telefonos",
    price: 299,
    stock: 6,
    featured: true,
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80",
    description: "Pantalla AMOLED, buena bateria y camara nitida para fotos y videos."
  },
  {
    id: "p-airpods",
    name: "AirPods Pro",
    category: "Audio",
    price: 119,
    stock: 8,
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80",
    description: "Audifonos inalambricos con cancelacion de ruido y estuche de carga."
  },
  {
    id: "p-cargador",
    name: "Cargador Rapido USB-C 25W",
    category: "Accesorios",
    price: 18,
    stock: 20,
    featured: false,
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80",
    description: "Adaptador de carga rapida compatible con Samsung, Xiaomi, iPhone USB-C y mas."
  }
];

const state = {
  products: [],
  cart: [],
  filters: {
    search: "",
    category: "all",
    sort: "featured"
  }
};

const els = {
  productGrid: document.getElementById("productGrid"),
  emptyState: document.getElementById("emptyState"),
  dbStatus: document.getElementById("firebaseStatus"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortProducts: document.getElementById("sortProducts"),
  adminToggleBtn: document.getElementById("adminToggleBtn"),
  heroAdminBtn: document.getElementById("heroAdminBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  adminLogin: document.getElementById("adminLogin"),
  adminSection: document.getElementById("admin"),
  productForm: document.getElementById("productForm"),
  productId: document.getElementById("productId"),
  currentImageUrl: document.getElementById("currentImageUrl"),
  productName: document.getElementById("productName"),
  productCategory: document.getElementById("productCategory"),
  productPrice: document.getElementById("productPrice"),
  productStock: document.getElementById("productStock"),
  productFeatured: document.getElementById("productFeatured"),
  productImageFile: document.getElementById("productImageFile"),
  imagePreview: document.getElementById("imagePreview"),
  productDescription: document.getElementById("productDescription"),
  saveProductBtn: document.getElementById("saveProductBtn"),
  resetFormBtn: document.getElementById("resetFormBtn"),
  formMessage: document.getElementById("formMessage"),
  productTable: document.getElementById("productTable"),
  managerCount: document.getElementById("managerCount"),
  seedProductsBtn: document.getElementById("seedProductsBtn"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  emptyCart: document.getElementById("emptyCart"),
  cartTotal: document.getElementById("cartTotal"),
  cartCount: document.querySelectorAll("[data-cart-count]"),
  sendQuoteBtn: document.getElementById("sendQuoteBtn"),
  clearCartBtn: document.getElementById("clearCartBtn"),
  menuToggleBtn: document.getElementById("menuToggleBtn"),
  mainNav: document.getElementById("mainNav"),
  floatWa: document.getElementById("floatWa"),
  specialOrderForm: document.getElementById("specialOrderForm"),
  specialItem: document.getElementById("specialItem"),
  specialDetails: document.getElementById("specialDetails")
};

function loadProducts() {
  const saved = localStorage.getItem(DB_KEY);
  if (!saved) {
    state.products = DEFAULT_PRODUCTS.slice();
    saveProducts();
    setDbStatus("Base de datos local creada. Tus productos se guardan en este navegador.", "success");
    return;
  }

  try {
    state.products = JSON.parse(saved);
    setDbStatus("Base de datos local activa. Puedes agregar, editar y eliminar productos.", "success");
  } catch {
    state.products = DEFAULT_PRODUCTS.slice();
    saveProducts();
    setDbStatus("La base local estaba danada y fue reiniciada con productos base.", "warning");
  }
}

function saveProducts() {
  localStorage.setItem(DB_KEY, JSON.stringify(state.products));
}

function setDbStatus(text, type) {
  els.dbStatus.textContent = text;
  els.dbStatus.className = `firebase-status ${type || ""}`;
}

function formatPrice(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function imageStyle(url) {
  const safeUrl = String(url || PLACEHOLDER_IMAGE).replace(/'/g, "%27");
  return `background-image:url('${safeUrl}')`;
}

function getCategories() {
  return Array.from(new Set(state.products.map((product) => product.category).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));
}

function populateCategoryFilter() {
  const current = els.categoryFilter.value || "all";
  els.categoryFilter.innerHTML = '<option value="all">Todas las categorias</option>';

  getCategories().forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.appendChild(option);
  });

  const exists = Array.from(els.categoryFilter.options).some((option) => option.value === current);
  els.categoryFilter.value = exists ? current : "all";
  state.filters.category = els.categoryFilter.value;
}

function getFilteredProducts() {
  const search = state.filters.search.trim().toLowerCase();
  let list = state.products.slice();

  if (search) {
    list = list.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  if (state.filters.category !== "all") {
    list = list.filter((product) => product.category === state.filters.category);
  }

  switch (state.filters.sort) {
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "price-low":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      list.sort((a, b) => b.price - a.price);
      break;
    default:
      list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  return list;
}

function renderProductGrid() {
  const list = getFilteredProducts();
  els.productGrid.innerHTML = "";
  els.emptyState.classList.toggle("is-hidden", list.length > 0);

  list.forEach((product) => {
    const outOfStock = Number(product.stock) <= 0;
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="thumb" style="${imageStyle(product.imageUrl)}">
        ${product.featured ? '<span class="badge">Destacado</span>' : ""}
        ${outOfStock ? '<span class="badge out">Agotado</span>' : ""}
      </div>
      <div class="body">
        <span class="cat">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="meta">
          <span class="price">${formatPrice(product.price)}</span>
          <span class="stock">${outOfStock ? "Sin stock" : `${product.stock} disp.`}</span>
        </div>
        <button class="add-btn" type="button" data-add="${product.id}" ${outOfStock ? "disabled" : ""}>
          ${outOfStock ? "No disponible" : "Agregar a cotizacion"}
        </button>
      </div>
    `;
    els.productGrid.appendChild(card);
  });
}

function renderManagerTable() {
  els.productTable.innerHTML = "";
  els.managerCount.textContent = `${state.products.length} producto${state.products.length === 1 ? "" : "s"}`;

  if (state.products.length === 0) {
    els.productTable.innerHTML = '<p class="mini-empty">Todavia no hay productos guardados.</p>';
    return;
  }

  state.products.forEach((product) => {
    const row = document.createElement("div");
    row.className = "mini-row";
    row.innerHTML = `
      <div class="mini-thumb" style="${imageStyle(product.imageUrl)}"></div>
      <div class="mini-info">
        <strong>${escapeHtml(product.name)}</strong>
        <span>${escapeHtml(product.category)} | ${formatPrice(product.price)} | stock ${product.stock}</span>
      </div>
      <div class="mini-actions">
        <button type="button" data-edit="${product.id}" aria-label="Editar ${escapeHtml(product.name)}">E</button>
        <button type="button" class="delete" data-delete="${product.id}" aria-label="Eliminar ${escapeHtml(product.name)}">X</button>
      </div>
    `;
    els.productTable.appendChild(row);
  });
}

function refresh() {
  cleanCart();
  populateCategoryFilter();
  renderProductGrid();
  renderManagerTable();
  renderCart();
}

function toggleAdminArea(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : els.adminSection.classList.contains("is-hidden");

  els.adminLogin.classList.add("is-hidden");
  els.logoutBtn.classList.add("is-hidden");
  els.adminSection.classList.toggle("is-hidden", !shouldOpen);
  els.adminToggleBtn.setAttribute("aria-expanded", String(shouldOpen));
  els.adminToggleBtn.textContent = shouldOpen ? "Ocultar panel" : "Administrar";

  if (shouldOpen) {
    renderManagerTable();
    els.adminSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function fillForm(product) {
  els.productId.value = product.id;
  els.currentImageUrl.value = product.imageUrl || "";
  els.productName.value = product.name;
  els.productCategory.value = product.category;
  els.productPrice.value = product.price;
  els.productStock.value = product.stock;
  els.productFeatured.value = String(Boolean(product.featured));
  els.productDescription.value = product.description;
  els.productImageFile.value = "";
  setImagePreview(product.imageUrl);
  setFormMessage(`Editando "${product.name}".`, "");
  els.productName.focus();
}

function resetForm() {
  els.productForm.reset();
  els.productId.value = "";
  els.currentImageUrl.value = "";
  els.productFeatured.value = "true";
  setImagePreview("");
  setFormMessage("", "");
}

function setImagePreview(url) {
  const hasImage = Boolean(url);
  els.imagePreview.classList.toggle("is-hidden", !hasImage);
  els.imagePreview.style.backgroundImage = hasImage ? `url('${String(url).replace(/'/g, "%27")}')` : "";
}

function setFormMessage(text, type) {
  els.formMessage.textContent = text;
  els.formMessage.className = `form-message${type ? ` ${type}` : ""}`;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(els.currentImageUrl.value || "");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      reject(new Error("Formato de imagen no permitido."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const name = els.productName.value.trim();
  const category = els.productCategory.value.trim();
  const price = Number.parseFloat(els.productPrice.value);
  const stock = Number.parseInt(els.productStock.value, 10);
  const description = els.productDescription.value.trim();

  if (!name || !category || !description || Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0) {
    setFormMessage("Revisa los campos requeridos antes de guardar.", "error");
    return;
  }

  try {
    const imageUrl = await readImageFile(els.productImageFile.files[0]);
    const product = {
      id: els.productId.value || `p-${Date.now()}`,
      name,
      category,
      price,
      stock,
      featured: els.productFeatured.value === "true",
      imageUrl,
      description
    };

    if (els.productId.value) {
      state.products = state.products.map((item) => item.id === product.id ? product : item);
      setFormMessage(`"${name}" se actualizo correctamente.`, "success");
    } else {
      state.products.unshift(product);
      setFormMessage(`"${name}" se agrego al catalogo.`, "success");
    }

    saveProducts();
    resetForm();
    refresh();
  } catch (error) {
    setFormMessage(error.message || "No se pudo guardar el producto.", "error");
  }
}

function deleteProduct(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) return;
  if (!window.confirm(`Eliminar "${product.name}" del catalogo?`)) return;

  state.products = state.products.filter((item) => item.id !== id);
  saveProducts();
  setFormMessage(`"${product.name}" se elimino.`, "success");
  refresh();
}

function resetDatabase() {
  if (!window.confirm("Restaurar productos base? Se borraran los productos guardados en esta base local.")) return;
  state.products = DEFAULT_PRODUCTS.slice();
  saveProducts();
  resetForm();
  setDbStatus("Base local restaurada con productos de ejemplo.", "success");
  refresh();
}

function handleImageFileChange() {
  const file = els.productImageFile.files[0];
  if (!file) {
    setImagePreview(els.currentImageUrl.value || "");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => setImagePreview(reader.result);
  reader.readAsDataURL(file);
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || Number(product.stock) <= 0) return;

  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, Number(product.stock));
  } else {
    state.cart.push({ id, qty: 1 });
  }

  renderCart();
  openCart();
}

function updateQty(id, amount) {
  const item = state.cart.find((candidate) => candidate.id === id);
  const product = state.products.find((candidate) => candidate.id === id);
  if (!item || !product) return;

  item.qty = Math.min(Math.max(item.qty + amount, 0), Number(product.stock));
  if (item.qty === 0) {
    state.cart = state.cart.filter((candidate) => candidate.id !== id);
  }

  renderCart();
}

function cleanCart() {
  state.cart = state.cart
    .filter((item) => state.products.some((product) => product.id === item.id))
    .map((item) => {
      const product = state.products.find((candidate) => candidate.id === item.id);
      return { ...item, qty: Math.min(item.qty, Math.max(Number(product.stock), 0)) };
    })
    .filter((item) => item.qty > 0);
}

function renderCart() {
  els.cartItems.innerHTML = "";
  els.emptyCart.classList.toggle("is-hidden", state.cart.length > 0);

  let total = 0;
  let totalQty = 0;

  state.cart.forEach((item) => {
    const product = state.products.find((candidate) => candidate.id === item.id);
    if (!product) return;

    const subtotal = Number(product.price) * item.qty;
    total += subtotal;
    totalQty += item.qty;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-thumb" style="${imageStyle(product.imageUrl)}"></div>
      <div class="cart-info">
        <strong>${escapeHtml(product.name)}</strong>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="qty-controls">
        <button type="button" data-qty-down="${product.id}" aria-label="Restar">-</button>
        <span>${item.qty}</span>
        <button type="button" data-qty-up="${product.id}" aria-label="Sumar">+</button>
      </div>
      <button type="button" class="remove-btn" data-remove="${product.id}" aria-label="Quitar">X</button>
    `;
    els.cartItems.appendChild(row);
  });

  els.cartTotal.textContent = formatPrice(total);
  els.cartCount.forEach((count) => {
    count.textContent = totalQty;
  });
}

function openCart() {
  els.cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  els.cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function sendQuote() {
  if (state.cart.length === 0) {
    els.emptyCart.textContent = "Agrega al menos un producto antes de enviar la cotizacion.";
    els.emptyCart.classList.remove("is-hidden");
    window.setTimeout(() => {
      els.emptyCart.textContent = "Todavia no agregaste productos.";
      renderCart();
    }, 2400);
    return;
  }

  let message = "Hola, quisiera cotizar estos productos:\n\n";
  let total = 0;

  state.cart.forEach((item) => {
    const product = state.products.find((candidate) => candidate.id === item.id);
    if (!product) return;
    const subtotal = Number(product.price) * item.qty;
    total += subtotal;
    message += `- ${product.name} x${item.qty}: ${formatPrice(subtotal)}\n`;
  });

  message += `\nTotal estimado: ${formatPrice(total)}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

function handleSpecialOrder(event) {
  event.preventDefault();
  const item = els.specialItem.value.trim();
  const details = els.specialDetails.value.trim();
  if (!item) return;

  let message = `Hola, busco este producto bajo encargo:\n\n- ${item}`;
  if (details) message += `\nDetalles: ${details}`;
  message += "\n\nMe gustaria saber disponibilidad y precio.";

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  els.specialOrderForm.reset();
}

function bindEvents() {
  els.menuToggleBtn.addEventListener("click", () => {
    const isOpen = els.mainNav.classList.toggle("open");
    els.menuToggleBtn.setAttribute("aria-expanded", String(isOpen));
  });

  els.adminToggleBtn.addEventListener("click", () => toggleAdminArea());
  els.heroAdminBtn.addEventListener("click", () => toggleAdminArea(true));

  els.searchInput.addEventListener("input", () => {
    state.filters.search = els.searchInput.value;
    renderProductGrid();
  });

  els.categoryFilter.addEventListener("change", () => {
    state.filters.category = els.categoryFilter.value;
    renderProductGrid();
  });

  els.sortProducts.addEventListener("change", () => {
    state.filters.sort = els.sortProducts.value;
    renderProductGrid();
  });

  els.productGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.getAttribute("data-add"));
  });

  els.productForm.addEventListener("submit", handleProductSubmit);
  els.resetFormBtn.addEventListener("click", resetForm);
  els.productImageFile.addEventListener("change", handleImageFileChange);
  els.seedProductsBtn.addEventListener("click", resetDatabase);

  els.productTable.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit]");
    const deleteBtn = event.target.closest("[data-delete]");

    if (editBtn) {
      const product = state.products.find((item) => item.id === editBtn.getAttribute("data-edit"));
      if (product) fillForm(product);
    }

    if (deleteBtn) {
      deleteProduct(deleteBtn.getAttribute("data-delete"));
    }
  });

  document.querySelectorAll("[data-open-cart]").forEach((button) => {
    button.addEventListener("click", openCart);
  });

  document.querySelectorAll("[data-close-cart]").forEach((button) => {
    button.addEventListener("click", closeCart);
  });

  els.cartItems.addEventListener("click", (event) => {
    const up = event.target.closest("[data-qty-up]");
    const down = event.target.closest("[data-qty-down]");
    const remove = event.target.closest("[data-remove]");

    if (up) updateQty(up.getAttribute("data-qty-up"), 1);
    if (down) updateQty(down.getAttribute("data-qty-down"), -1);
    if (remove) {
      state.cart = state.cart.filter((item) => item.id !== remove.getAttribute("data-remove"));
      renderCart();
    }
  });

  els.clearCartBtn.addEventListener("click", () => {
    state.cart = [];
    renderCart();
  });

  els.sendQuoteBtn.addEventListener("click", sendQuote);
  els.specialOrderForm.addEventListener("submit", handleSpecialOrder);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
  });
}

function init() {
  els.adminLogin.classList.add("is-hidden");
  els.logoutBtn.classList.add("is-hidden");
  els.seedProductsBtn.textContent = "Restaurar base";
  els.floatWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quisiera mas informacion sobre sus productos.")}`;
  loadProducts();
  bindEvents();
  refresh();
}

init();
