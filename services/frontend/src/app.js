const API_URL = 'http://localhost:4000/api';
const USER_ID = 'user123';

let cakes = [];
let ratingSummaries = {};
let activeCategory = 'All';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEvents();
});

async function initApp() {
  await fetchRatingSummaries();
  await fetchCakes();
  await fetchBasket();
  await fetchOrders();
  await fetchNotifications();

  // Poll for notifications every 10s
  setInterval(fetchNotifications, 10000);
}

function setupEvents() {
  // Category Pills
  document.getElementById('categoryPills').addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-pill')) {
      document.querySelectorAll('.cat-pill').forEach((btn) => btn.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.dataset.category;
      renderCakes();
    }
  });

  // Search Bar
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderCakes();
  });

  // Price Range Toggle Bar
  const priceBar = document.getElementById('priceToggleBar');
  const priceVal = document.getElementById('maxPriceVal');
  priceBar.addEventListener('input', (e) => {
    priceVal.textContent = `$${e.target.value}`;
    renderCakes();
  });

  // Basket Drawer Toggles
  document.getElementById('basketBtn').addEventListener('click', toggleDrawer);
  document.getElementById('closeDrawerBtn').addEventListener('click', toggleDrawer);
  document.getElementById('drawerOverlay').addEventListener('click', toggleDrawer);

  // Modal Open/Close Controls
  document.getElementById('openCheckoutModalBtn').addEventListener('click', openCheckoutModal);
  document.getElementById('closeCheckoutBtn').addEventListener('click', closeCheckoutModal);
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);

  document.getElementById('closeRatingBtn').addEventListener('click', closeRatingModal);
  document.getElementById('ratingForm').addEventListener('submit', handleRatingSubmit);

  // Star selector logic
  document.getElementById('starBox').addEventListener('click', (e) => {
    if (e.target.classList.contains('star-item')) {
      const val = Number(e.target.dataset.val);
      document.getElementById('ratingScore').value = val;
      document.querySelectorAll('.star-item').forEach((star) => {
        const starVal = Number(star.dataset.val);
        if (starVal <= val) {
          star.classList.add('active');
        } else {
          star.classList.remove('active');
        }
      });
    }
  });

  // Notification Dropdown Toggle & Mark Read
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const markAllBtn = document.getElementById('markAllReadBtn');

  if (markAllBtn) {
    markAllBtn.addEventListener('click', markAllNotificationsRead);
  }

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.remove('active');
    }
  });
}

function toggleDrawer() {
  document.getElementById('cartDrawer').classList.toggle('active');
  document.getElementById('drawerOverlay').classList.toggle('active');
}

// 1. Catalog Microservice Integration
async function fetchCakes() {
  try {
    const res = await fetch(`${API_URL}/cakes`);
    const json = await res.json();
    if (json.success) {
      cakes = json.data;
      renderCakes();
    }
  } catch (err) {
    document.getElementById('catalogGrid').innerHTML = `
      <div class="loading-state">
        <i class="fa-solid fa-triangle-exclamation" style="color:var(--primary)"></i>
        <p>Could not connect to Catalog Service via API Gateway.</p>
      </div>`;
  }
}

function renderCakes() {
  const maxVal = parseFloat(document.getElementById('priceToggleBar').value) || 50;

  const filtered = cakes.filter((c) => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery) ||
      c.description.toLowerCase().includes(searchQuery) ||
      c.category.toLowerCase().includes(searchQuery);

    const matchPrice = c.price <= maxVal;

    return matchCat && matchSearch && matchPrice;
  });

  document.getElementById('productCountLabel').textContent = `Showing ${filtered.length} of ${cakes.length} cakes`;

  const grid = document.getElementById('catalogGrid');
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-text">No cakes found matching your search</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((cake) => {
      const rating = ratingSummaries[cake._id] || { averageRating: 4.8, totalRatings: 1 };
      return `
      <div class="cake-item-card">
        <div class="card-img-box">
          <img src="${cake.imageUrl}" alt="${cake.name}">
          <span class="category-tag">${cake.category}</span>
          <span class="rating-tag"><i class="fa-solid fa-star"></i> ${rating.averageRating} (${rating.totalRatings})</span>
        </div>
        <div class="card-content">
          <h3 class="card-title">${cake.name}</h3>
          <p class="card-desc">${cake.description}</p>
          <div class="card-footer">
            <span class="price-text">$${cake.price.toFixed(2)}</span>
            <div class="btn-actions">
              <button class="btn btn-outline" onclick="openRatingModal('${cake._id}')" title="Submit Rating">
                <i class="fa-solid fa-star" style="color:#f59e0b"></i> Rate
              </button>
              <button class="btn btn-primary" onclick="addToBasket('${cake._id}')">
                <i class="fa-solid fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

// 2. Rating Microservice Modal Integration
async function fetchRatingSummaries() {
  try {
    const res = await fetch(`${API_URL}/ratings/summaries`);
    const json = await res.json();
    if (json.success) {
      ratingSummaries = json.data;
    }
  } catch (err) {}
}

function openRatingModal(cakeId) {
  const cake = cakes.find((c) => c._id === cakeId);
  if (!cake) return;

  document.getElementById('ratingCakeId').value = cake._id;
  document.getElementById('ratingCakeImg').src = cake.imageUrl;
  document.getElementById('ratingCakeTitle').textContent = cake.name;
  document.getElementById('ratingCakeCategory').textContent = cake.category;

  document.getElementById('ratingModal').classList.add('active');
}

function closeRatingModal() {
  document.getElementById('ratingModal').classList.remove('active');
}

async function handleRatingSubmit(e) {
  e.preventDefault();
  const cakeId = document.getElementById('ratingCakeId').value;
  const rating = Number(document.getElementById('ratingScore').value);
  const comment = document.getElementById('ratingCommentText').value;

  try {
    const res = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cakeId,
        userId: USER_ID,
        userName: 'Ajay Pavushetti',
        rating,
        comment: comment || 'Delicious artisanal cake!'
      })
    });
    const json = await res.json();
    if (json.success) {
      closeRatingModal();
      showToast('⭐ Rating submitted successfully!');
      document.getElementById('ratingCommentText').value = '';
      await fetchRatingSummaries();
      renderCakes();
    }
  } catch (err) {
    showToast('Failed to submit rating');
  }
}

// 3. Order Microservice & Checkout Modal Integration
async function fetchBasket() {
  try {
    const res = await fetch(`${API_URL}/orders/basket/${USER_ID}`);
    const json = await res.json();
    if (json.success) {
      renderBasket(json.data);
    }
  } catch (err) {}
}

function renderBasket(basket) {
  const items = basket.items || [];
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  document.getElementById('basketBadge').textContent = count;
  const list = document.getElementById('basketItemList');
  const openCheckoutBtn = document.getElementById('openCheckoutModalBtn');

  if (items.length === 0) {
    list.innerHTML = `<p class="empty-text">Your basket is currently empty</p>`;
    document.getElementById('basketTotal').textContent = '$0.00';
    openCheckoutBtn.disabled = true;
    return;
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  document.getElementById('basketTotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('modalPayableAmount').textContent = `$${subtotal.toFixed(2)}`;
  openCheckoutBtn.disabled = false;

  list.innerHTML = items
    .map(
      (item) => `
    <div class="basket-row">
      <div class="basket-item-info">
        <strong>${item.name}</strong>
        <div class="basket-item-price">$${(item.price * item.quantity).toFixed(2)} ($${item.price.toFixed(2)} each)</div>
      </div>
      <div class="qty-toggle-group">
        <button class="qty-btn" onclick="updateItemQty('${item.cakeId}', -1)">-</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="updateItemQty('${item.cakeId}', 1)">+</button>
      </div>
    </div>
  `
    )
    .join('');
}

async function updateItemQty(cakeId, change) {
  try {
    const res = await fetch(`${API_URL}/orders/basket/${USER_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cakeId,
        name: 'Item',
        price: 0,
        quantity: change
      })
    });
    const json = await res.json();
    if (json.success) {
      renderBasket(json.data);
    }
  } catch (err) {
    showToast('Error updating item quantity');
  }
}

async function addToBasket(cakeId) {
  const cake = cakes.find((c) => c._id === cakeId);
  if (!cake) return;

  try {
    const res = await fetch(`${API_URL}/orders/basket/${USER_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cakeId: cake._id,
        name: cake.name,
        price: cake.price,
        quantity: 1,
        imageUrl: cake.imageUrl
      })
    });
    const json = await res.json();
    if (json.success) {
      renderBasket(json.data);
      showToast(`🛒 Added "${cake.name}" to basket`);
    }
  } catch (err) {}
}

function openCheckoutModal() {
  toggleDrawer();
  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const custName = document.getElementById('custName').value;
  const custEmail = document.getElementById('custEmail').value;
  const custAddress = document.getElementById('custAddress').value;

  try {
    const res = await fetch(`${API_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        customerName: custName,
        customerEmail: custEmail,
        deliveryAddress: custAddress
      })
    });

    const json = await res.json();
    if (json.success) {
      closeCheckoutModal();
      showToast('🎉 Order placed successfully! Event Published.');
      await fetchBasket();
      await fetchOrders();
      setTimeout(fetchNotifications, 800);
    }
  } catch (err) {
    showToast('Checkout error');
  }
}

async function fetchOrders() {
  try {
    const res = await fetch(`${API_URL}/orders/user/${USER_ID}`);
    const json = await res.json();
    if (json.success) {
      renderOrders(json.data);
    }
  } catch (err) {}
}

function renderOrders(orders) {
  const grid = document.getElementById('orderHistoryList');
  if (!orders || orders.length === 0) {
    grid.innerHTML = `<p class="empty-text">No orders placed yet</p>`;
    return;
  }

  grid.innerHTML = orders
    .map(
      (o) => `
    <div class="order-card">
      <div class="order-card-top">
        <span>Order #${o._id.substring(o._id.length - 6)}</span>
        <span class="status-badge">${o.status}</span>
      </div>
      <div style="font-size:0.85rem; color:var(--text-secondary);">
        ${o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
      </div>
      <div style="margin-top:0.4rem; font-weight:700; font-size:0.9rem;">
        Total: $${o.totalAmount.toFixed(2)}
      </div>
    </div>
  `
    )
    .join('');
}

// 4. Notification Microservice Integration
async function fetchNotifications() {
  try {
    const res = await fetch(`${API_URL}/notifications/user/${USER_ID}`);
    const json = await res.json();
    if (json.success) {
      renderNotifications(json.data, json.unreadCount);
    }
  } catch (err) {}
}

function renderNotifications(notifs, unreadCount) {
  const badge = document.getElementById('notifBadge');
  if (unreadCount > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = unreadCount;
  } else {
    badge.style.display = 'none';
  }

  const list = document.getElementById('notifList');
  if (!notifs || notifs.length === 0) {
    list.innerHTML = `<p class="empty-text">No new notifications</p>`;
    return;
  }

  list.innerHTML = notifs
    .map(
      (n) => `
    <div class="notif-card ${n.isRead ? 'read' : ''}">
      <div class="notif-header-row">
        <span class="notif-title">${n.title}</span>
        ${!n.isRead ? `<button class="mark-single-read-btn" onclick="markNotificationRead('${n._id}')"><i class="fa-solid fa-check"></i> Read</button>` : ''}
      </div>
      <div>${n.message}</div>
      <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">
        Status: <strong style="color:#16a34a">${n.deliveryStatus}</strong>
      </div>
    </div>
  `
    )
    .join('');
}

async function markNotificationRead(notifId) {
  try {
    await fetch(`${API_URL}/notifications/${notifId}/read`, { method: 'PUT' });
    await fetchNotifications();
  } catch (err) {
    showToast('Error marking notification read');
  }
}

async function markAllNotificationsRead() {
  try {
    await fetch(`${API_URL}/notifications/user/${USER_ID}/read-all`, { method: 'PUT' });
    await fetchNotifications();
    showToast('All notifications marked as read');
  } catch (err) {
    showToast('Error marking notifications read');
  }
}

// Helper Toast Notification
function showToast(msg) {
  const box = document.getElementById('toastBox');
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
