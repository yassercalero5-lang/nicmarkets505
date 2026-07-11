import { auth, db, storage, productsCol } from "./firebase-config.js";
import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const WHATSAPP_NUMBER = "50588888888";
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80";

const state = {
  products: [],
  cart: [],
  filters: {
    search: "",
    category: "all",
    sort: "featured"
  },
  currentUser: null,
  adminRequested: false
};

const els = {
  productGrid: document.getElementById("productGrid"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortProducts: document.getElementById("sortProducts"),
  totalProducts: document.querySelector("[data-total-products]"),
  totalCategories: document.querySelector("[data-total-categories]"),
  adminToggleBtn: document.getElementById("adminToggleBtn"),
  heroAdminBtn: document.getElementById("heroAdminBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  adminLogin: document.getElementById("adminLogin"),
  loginForm: document.getElementById("loginForm"),
  adminEmail: document.getElementById("adminEmail"),
  adminPassword: document.getElementById("adminPassword"),
  loginBtn: document.getElementById("loginBtn"),
  loginMessage: document.getElementById("loginMessage"),
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
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  emptyCart: document.getElementById("emptyCart"),
  cartTotal: document.getElementById("cartTotal"),
  cartCount: document.querySelectorAll("[data-cart-count]"),
  sendQuoteBtn: document.getElementById("sendQuoteBtn"),
  clearCartBtn: document.getElementById("clearCartBtn"),
  menuToggleBtn: document.getElementById("menuToggleBtn"),
  mainNav: document.getElementById("mainNav"),
  floatWa: document.getElementById("floatWa")
};

onSnapshot(productsCol, (snapshot) => {
  state.products = snapshot.docs
    .map((item) => normalizeProduct(item.id, item.data()))
    .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  cleanCart();
  populateCategoryFilter();
  renderProductGrid();
  renderManagerTable();
  renderCart();
}, (error) => {
  console.error("Firestore read error:", error);
  setFormMessage("No se pudo leer la base de datos. Revisa Firestore y sus reglas.", "error");
});

onAuthStateChanged(auth, (user) => {
  state.currentUser = user;
  syncAdminVisibility();
});

function normalizeProduct(id, data) {
  return {
    id,
    name: data.name || "",
    category: data.category || "General",
    price: Number(data.price || 0),
    stock: Number(data.stock || 0),
    featured: data.featured === true,
    imageUrl: data.imageUrl || data.image || "",
    description: data.description || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
}

function getMillis(value) {
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
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
    const outOfStock = product.stock <= 0;
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

  els.totalProducts.textContent = state.products.length;
  els.totalCategories.textContent = getCategories().length;
}

function syncAdminVisibility() {
  const isLoggedIn = Boolean(state.currentUser);
  els.logoutBtn.classList.toggle("is-hidden", !isLoggedIn);

  if (!state.adminRequested) {
    els.adminLogin.classList.add("is-hidden");
    els.adminSection.classList.add("is-hidden");
    els.adminToggleBtn.setAttribute("aria-expanded", "false");
    els.adminToggleBtn.textContent = "Administrar";
    return;
  }

  els.adminLogin.classList.toggle("is-hidden", isLoggedIn);
  els.adminSection.classList.toggle("is-hidden", !isLoggedIn);
  els.adminToggleBtn.setAttribute("aria-expanded", "true");
  els.adminToggleBtn.textContent = isLoggedIn ? "Ocultar panel" : "Ocultar acceso";

  if (isLoggedIn) {
    renderManagerTable();
  }
}

function toggleAdminArea(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !state.adminRequested;
  state.adminRequested = shouldOpen;
  syncAdminVisibility();

  if (shouldOpen) {
    const target = state.currentUser ? els.adminSection : els.adminLogin;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderManagerTable() {
  if (!state.currentUser) return;

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

function fillForm(product) {
  els.productId.value = product.id;
  els.currentImageUrl.value = product.imageUrl || "";
  els.productName.value = product.name;
  els.productCategory.value = product.category;
  els.productPrice.value = product.price;
  els.productStock.value = product.stock;
  els.productFeatured.value = String(product.featured);
  els.productDescription.value = product.description;
  els.productImageFile.value = "";
  setImagePreview(product.imageUrl);
  setFormMessage(`Editando "${product.name}". Guarda para publicar los cambios.`, "");
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

function setLoginMessage(text, type) {
  els.loginMessage.textContent = text;
  els.loginMessage.className = `form-message${type ? ` ${type}` : ""}`;
}

async function uploadProductImage(file) {
  if (!file) return els.currentImageUrl.value || "";

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Formato de imagen no permitido.");
  }

  const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const filePath = `products/${Date.now()}-${cleanName}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

async function handleProductSubmit(event) {
  event.preventDefault();

  if (!state.currentUser) {
    setFormMessage("Debes iniciar sesion para guardar productos.", "error");
    return;
  }

  const name = els.productName.value.trim();
  const category = els.productCategory.value.trim();
  const price = Number.parseFloat(els.productPrice.value);
  const stock = Number.parseInt(els.productStock.value, 10);
  const description = els.productDescription.value.trim();

  if (!name || !category || !description || Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0) {
    setFormMessage("Revisa los campos requeridos antes de guardar.", "error");
    return;
  }

  els.saveProductBtn.disabled = true;
  els.saveProductBtn.textContent = "Guardando...";

  try {
    const imageUrl = await uploadProductImage(els.productImageFile.files[0]);
    const data = {
      name,
      category,
      price,
      stock,
      featured: els.productFeatured.value === "true",
      imageUrl,
      description,
      updatedAt: serverTimestamp()
    };

    if (els.productId.value) {
      await updateDoc(doc(db, "products", els.productId.value), data);
      resetForm();
      setFormMessage(`"${name}" se actualizo correctamente.`, "success");
    } else {
      await addDoc(productsCol, {
        ...data,
        createdAt: serverTimestamp()
      });
      resetForm();
      setFormMessage(`"${name}" se agrego al catalogo.`, "success");
    }
  } catch (error) {
    console.error("Save product error:", error);
    setFormMessage(error.message || "No se pudo guardar el producto.", "error");
  } finally {
    els.saveProductBtn.disabled = false;
    els.saveProductBtn.textContent = "Guardar producto";
  }
}

function cleanCart() {
  state.cart = state.cart
    .filter((item) => state.products.some((product) => product.id === item.id))
    .map((item) => {
      const product = state.products.find((candidate) => candidate.id === item.id);
      return { ...item, qty: Math.min(item.qty, Math.max(product.stock, 0)) };
    })
    .filter((item) => item.qty > 0);
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || product.stock <= 0) return;

  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, product.stock);
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

  item.qty = Math.min(Math.max(item.qty + amount, 0), product.stock);
  if (item.qty === 0) {
    state.cart = state.cart.filter((candidate) => candidate.id !== id);
  }

  renderCart();
}

function renderCart() {
  els.cartItems.innerHTML = "";
  els.emptyCart.classList.toggle("is-hidden", state.cart.length > 0);

  let total = 0;
  let totalQty = 0;

  state.cart.forEach((item) => {
    const product = state.products.find((candidate) => candidate.id === item.id);
    if (!product) return;

    const subtotal = product.price * item.qty;
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
    const subtotal = product.price * item.qty;
    total += subtotal;
    message += `- ${product.name} x${item.qty}: ${formatPrice(subtotal)}\n`;
  });

  message += `\nTotal estimado: ${formatPrice(total)}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

els.adminToggleBtn.addEventListener("click", () => toggleAdminArea());
els.heroAdminBtn.addEventListener("click", () => toggleAdminArea(true));

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.loginBtn.disabled = true;
  els.loginBtn.textContent = "Ingresando...";
  setLoginMessage("", "");

  try {
    await signInWithEmailAndPassword(auth, els.adminEmail.value.trim(), els.adminPassword.value);
    els.loginForm.reset();
    setLoginMessage("Sesion iniciada.", "success");
  } catch (error) {
    console.error("Login error:", error);
    setLoginMessage("Correo o contrasena incorrectos, o Auth no esta activado.", "error");
  } finally {
    els.loginBtn.disabled = false;
    els.loginBtn.textContent = "Ingresar";
  }
});

els.logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  resetForm();
  state.adminRequested = false;
  syncAdminVisibility();
});

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
  if (button) addToCart(button.dataset.add);
});

els.productTable.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const product = state.products.find((item) => item.id === editButton.dataset.edit);
    if (product) fillForm(product);
  }

  if (deleteButton) {
    const product = state.products.find((item) => item.id === deleteButton.dataset.delete);
    if (!product) return;

    if (window.confirm(`Eliminar "${product.name}" del catalogo?`)) {
      try {
        await deleteDoc(doc(db, "products", product.id));
        setFormMessage(`"${product.name}" se elimino.`, "success");
      } catch (error) {
        console.error("Delete error:", error);
        setFormMessage("No se pudo eliminar el producto.", "error");
      }
    }
  }
});

els.productImageFile.addEventListener("change", () => {
  const file = els.productImageFile.files[0];
  if (!file) {
    setImagePreview(els.currentImageUrl.value);
    return;
  }
  setImagePreview(URL.createObjectURL(file));
});

els.productForm.addEventListener("submit", handleProductSubmit);
els.resetFormBtn.addEventListener("click", resetForm);

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

  if (up) updateQty(up.dataset.qtyUp, 1);
  if (down) updateQty(down.dataset.qtyDown, -1);
  if (remove) {
    state.cart = state.cart.filter((item) => item.id !== remove.dataset.remove);
    renderCart();
  }
});

els.clearCartBtn.addEventListener("click", () => {
  if (state.cart.length === 0) return;
  if (window.confirm("Vaciar toda la cotizacion?")) {
    state.cart = [];
    renderCart();
  }
});

els.sendQuoteBtn.addEventListener("click", sendQuote);

els.menuToggleBtn.addEventListener("click", () => {
  const isOpen = els.mainNav.classList.toggle("open");
  els.menuToggleBtn.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

els.floatWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quisiera mas informacion sobre sus productos.")}`;

populateCategoryFilter();
renderProductGrid();
renderCart();
syncAdminVisibility();
