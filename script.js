
const products = [
  { id: 1, name: "แพ็กเติมเกม Starter", category: "topup", price: 49, icon: "♢", tag: "เติมเกม", description: "แพ็กทดลองสำหรับระบบเติมเกม" },
  { id: 2, name: "แพ็กเติมเกม Premium", category: "topup", price: 99, icon: "✦", tag: "เติมเกม", description: "แพ็กตัวอย่างระดับพรีเมียม" },
  { id: 3, name: "Game Gift Card", category: "digital", price: 150, icon: "▣", tag: "บัตรดิจิทัล", description: "บัตรดิจิทัลตัวอย่าง" },
  { id: 4, name: "Digital Wallet", category: "digital", price: 200, icon: "◇", tag: "บัตรดิจิทัล", description: "เครดิตกระเป๋าเงินจำลอง" },
  { id: 5, name: "Android App Pack", category: "apps", price: 79, icon: "⌘", tag: "แอปและบริการ", description: "แพ็กแอปตัวอย่าง" },
  { id: 6, name: "Premium App Service", category: "apps", price: 129, icon: "✧", tag: "แอปและบริการ", description: "บริการดิจิทัลตัวอย่าง" },
  { id: 7, name: "Gaming Accessories", category: "other", price: 250, icon: "◈", tag: "สินค้าอื่น ๆ", description: "สินค้าเกมตัวอย่าง" },
  { id: 8, name: "Mystery Game Box", category: "other", price: 99, icon: "✺", tag: "สินค้าอื่น ๆ", description: "กล่องตัวอย่าง ไม่มีการส่งสินค้าจริง" }
];

const $ = (selector) => document.querySelector(selector);

const productGrid = $("#productGrid");
const searchInput = $("#searchInput");
const cartOverlay = $("#cartOverlay");
const checkoutOverlay = $("#checkoutOverlay");
const orderOverlay = $("#orderOverlay");

let activeCategory = "all";
let cart = {};

try {
  const saved = JSON.parse(localStorage.getItem("thanawat168-cart") || "{}");
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    products.forEach((p) => {
      const q = saved[p.id];
      if (Number.isSafeInteger(q) && q > 0 && q <= 99) cart[p.id] = q;
    });
  }
} catch {
  cart = {};
}

function money(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value);
}

function saveCart() {
  try {
    localStorage.setItem("thanawat168-cart", JSON.stringify(cart));
  } catch {}
}

function renderProducts() {
  const keyword = searchInput.value.trim().toLowerCase();

  const list = products.filter((p) =>
    (activeCategory === "all" || p.category === activeCategory) &&
    (p.name.toLowerCase().includes(keyword) ||
     p.description.toLowerCase().includes(keyword))
  );

  $("#productTotal").textContent = `${list.length} รายการ`;
  $("#emptyMessage").hidden = list.length > 0;

  productGrid.innerHTML = list.map((p) => `
    <article class="product-card">
      <div class="product-art" aria-hidden="true">${p.icon}</div>
      <div class="product-info">
        <span class="product-tag">${p.tag}</span>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="product-bottom">
          <span class="product-price">${money(p.price)}</span>
          <button class="add-button" data-add="${p.id}" type="button">+ เพิ่ม</button>
        </div>
      </div>
    </article>
  `).join("");
}

function cartItems() {
  return products
    .filter((p) => cart[p.id] > 0)
    .map((p) => ({ ...p, quantity: cart[p.id] }));
}

function total() {
  return cartItems().reduce((sum, p) => sum + p.price * p.quantity, 0);
}

function renderCart() {
  const items = cartItems();
  const count = Object.values(cart).reduce((sum, q) => sum + q, 0);

  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(total());
  $("#checkoutBtn").disabled = items.length === 0;

  $("#cartItems").innerHTML = items.length
    ? items.map((p) => `
      <div class="cart-row">
        <div>
          <strong>${p.icon} ${p.name}</strong>
          <p>${money(p.price)} × ${p.quantity}</p>
          <strong>${money(p.price * p.quantity)}</strong>
        </div>
        <div class="cart-actions">
          <button class="quantity-button" data-change="${p.id}" data-delta="-1" aria-label="ลดจำนวน">−</button>
          <span>${p.quantity}</span>
          <button class="quantity-button" data-change="${p.id}" data-delta="1" aria-label="เพิ่มจำนวน">+</button>
          <button class="remove-button" data-remove="${p.id}" aria-label="ลบสินค้า">✕</button>
        </div>
      </div>
    `).join("")
    : '<p class="muted">ยังไม่มีสินค้าในตะกร้า</p>';
}

function addToCart(id) {
  if (!products.some((p) => p.id === id)) return;
  if ((cart[id] || 0) >= 99) {
    alert("เพิ่มได้สูงสุด 99 ชิ้นต่อรายการ");
    return;
  }

  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
}

function changeQuantity(id, delta) {
  const next = (cart[id] || 0) + delta;

  if (next <= 0) delete cart[id];
  else if (next <= 99) cart[id] = next;

  saveCart();
  renderCart();
}

function open(overlay) {
  overlay.hidden = false;
}

function close(overlay) {
  overlay.hidden = true;
}

function chooseCategory(category) {
  activeCategory = category;

  document.querySelectorAll(".filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });

  renderProducts();
}

$("#productFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (button) chooseCategory(button.dataset.category);
});

$("#categories").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  chooseCategory(button.dataset.category);
  $("#products").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", renderProducts);

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});

$("#cartBtn").addEventListener("click", () => {
  renderCart();
  open(cartOverlay);
});

$("#closeCart").addEventListener("click", () => close(cartOverlay));
$("#closeCheckout").addEventListener("click", () => close(checkoutOverlay));
$("#closeOrder").addEventListener("click", () => close(orderOverlay));

$("#cartItems").addEventListener("click", (event) => {
  const change = event.target.closest("[data-change]");
  const remove = event.target.closest("[data-remove]");

  if (change) {
    changeQuantity(Number(change.dataset.change), Number(change.dataset.delta));
  }

  if (remove) {
    delete cart[Number(remove.dataset.remove)];
    saveCart();
    renderCart();
  }
});

$("#checkoutBtn").addEventListener("click", () => {
  if (!cartItems().length) return;
  close(cartOverlay);
  open(checkoutOverlay);
});

$("#checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const items = cartItems();
  const name = $("#customerName").value.trim();
  const contact = $("#customerContact").value.trim();

  if (!items.length || !name || !contact) return;

  const order = {
    number: "DEMO-" + Date.now().toString().slice(-8),
    name,
    contact,
    items: items.map(({ id, name, price, quantity }) => ({
      id, name, price, quantity
    })),
    total: total(),
    status: "DEMO — ยังไม่ชำระเงิน",
    createdAt: new Date().toISOString()
  };

  try {
    const previous = JSON.parse(
      localStorage.getItem("thanawat168-demo-orders") || "[]"
    );

    const orders = Array.isArray(previous) ? previous : [];
    orders.push(order);

    localStorage.setItem(
      "thanawat168-demo-orders",
      JSON.stringify(orders.slice(-20))
    );
  } catch {}

  $("#orderNumber").textContent = order.number;

  const summary = $("#orderSummary");
  summary.replaceChildren();

  const line = document.createElement("p");
  line.textContent = `จำนวน ${items.reduce((n, p) => n + p.quantity, 0)} ชิ้น · รวม ${money(order.total)}`;
  summary.appendChild(line);

  const status = document.createElement("p");
  status.textContent = order.status;
  status.className = "muted";
  summary.appendChild(status);

  cart = {};
  saveCart();
  renderCart();
  $("#checkoutForm").reset();

  close(checkoutOverlay);
  open(orderOverlay);
});

[cartOverlay, checkoutOverlay, orderOverlay].forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close(overlay);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    [cartOverlay, checkoutOverlay, orderOverlay].forEach(close);
  }
});

renderProducts();
renderCart();
