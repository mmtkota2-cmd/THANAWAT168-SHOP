
let products = [];

const productIcons = {
  topup: "◈",
  digital: "▣",
  apps: "✧",
  other: "●"
};

function mapSupabaseProduct(row) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    icon: productIcons[row.category] || "◈",
    tag: row.category === "topup"
      ? "เติมเกม"
      : row.category === "digital"
      ? "บัตรดิจิทัล"
      : row.category === "apps"
      ? "แอปและบริการ"
      : "สินค้าอื่น ๆ",
    description: row.description || ""
  };
}

async function loadProductsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("id, sku, name, category, description, price, stock")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
  console.error("Supabase:", error.message);
  alert("โหลดสินค้าไม่สำเร็จ: " + error.message);
  return;
}

  products = (data || []).map(mapSupabaseProduct);
  renderProducts();
}


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

$("#checkoutForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const items = cartItems();
  const name = $("#customerName").value.trim();
  const contact = $("#customerContact").value.trim();

  if (!items.length || !name || !contact) {
    alert("กรุณากรอกข้อมูลให้ครบและเลือกสินค้า");
    return;
  }

  const submitButton = event.currentTarget.querySelector(
    'button[type="submit"]'
  );

  if (submitButton?.disabled) return;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "กำลังสร้างออเดอร์...";
  }

  $("#paymentSection").hidden = true;
  try {
    const { data, error } = await supabaseClient.rpc(
      "create_order",
      {
        p_customer_name: name,
        p_customer_contact: contact,
        p_items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      }
    );

    if (error) throw error;

    if (!data || !data.success) {
      throw new Error("ไม่ได้รับข้อมูลยืนยันออเดอร์");
    }

    // แสดงข้อมูลจาก Supabase ไม่ใช้ยอดจากหน้าเว็บ
    $("#orderNumber").textContent = data.order_number;
    $("#paymentAmount").textContent = money(data.total_amount);
$("#paymentSection").hidden = false;

    const summary = $("#orderSummary");
    summary.replaceChildren();

    const totalLine = document.createElement("p");
    totalLine.textContent = "ยอดชำระ: " + money(data.total_amount);
    summary.appendChild(totalLine);

    const status = document.createElement("p");
    status.textContent = "สถานะ: รอชำระเงิน";
    status.className = "muted";
    summary.appendChild(status);

    const note = document.createElement("p");
    note.textContent =
  "กรุณาสแกน QR PromptPay และโอนเงินให้ตรงกับยอดออเดอร์ จากนั้นรอร้านค้าตรวจสอบยอดเงิน";
    note.className = "muted";
    summary.appendChild(note);

    cart = {};
    saveCart();
    renderCart();
    $("#checkoutForm").reset();

    close(checkoutOverlay);
    open(orderOverlay);
  } catch (error) {
    console.error("Create order error:", error);
    alert(
      "สร้างออเดอร์ไม่สำเร็จ: " +
      (error.message || "กรุณาลองใหม่")
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "ยืนยันสั่งซื้อ";
    }
  }
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


/* THANAWAT168 Gold Terminal — UI integration */

document.querySelectorAll("[data-side-category]").forEach((link) => {
  link.addEventListener("click", () => {
    const category = link.dataset.sideCategory;
    const filter = document.querySelector(
      `#productFilters [data-category="${category}"]`
    );

    if (filter) filter.click();
  });
});

function updateTerminalStats() {
  const productStat = document.getElementById("statProducts");
  const cartStat = document.getElementById("statCart");
  const cartCount = document.getElementById("cartCount");

  if (productStat) {
    const count = document.querySelectorAll(".product-card").length;
    productStat.textContent = String(count).padStart(2, "0");
  }

  if (cartStat && cartCount) {
    cartStat.textContent = String(
      Number(cartCount.textContent) || 0
    ).padStart(2, "0");
  }
}

const productGridForStats = document.getElementById("productGrid");
const cartCountForStats = document.getElementById("cartCount");

if (productGridForStats) {
  new MutationObserver(updateTerminalStats).observe(
    productGridForStats,
    { childList: true }
  );
}

if (cartCountForStats) {
  new MutationObserver(updateTerminalStats).observe(
    cartCountForStats,
    { childList: true, characterData: true, subtree: true }
  );
}

updateTerminalStats();
loadProductsFromSupabase();
