// ============================================
// AVOCADO - Marketplace Module
// Handles product listings, filtering, sorting
// ============================================

// Sample product data
const defaultProducts = [
  {
    id: 1,
    title: "Laptop Stand - Adjustable",
    category: "buy",
    price: 35,
    originalPrice: 50,
    seller: "John Doe",
    seller_id: 1,
    image: "📚",
    description: "Ergonomic laptop stand for better posture",
    condition: "Like New",
    dorm: "Dorm I",
    posted_date: "2024-01-25"
  },
  {
    id: 2,
    title: "Single Dorm Desk",
    category: "rent",
    price: 25,
    originalPrice: 40,
    seller: "Sarah Smith",
    seller_id: 2,
    image: "🪑",
    description: "Perfect desk for dorm room, great condition",
    condition: "Good",
    dorm: "Dorm II",
    posted_date: "2024-01-24"
  },
  {
    id: 3,
    title: "Textbook - Physics 101",
    category: "sell",
    price: 45,
    seller: "Mike Johnson",
    seller_id: 3,
    image: "📖",
    description: "Barely used physics textbook",
    condition: "Like New",
    dorm: "Dorm III",
    posted_date: "2024-01-23"
  },
  {
    id: 4,
    title: "Free - Old Bookshelf",
    category: "free",
    price: 0,
    seller: "Emily Chen",
    seller_id: 4,
    image: "📦",
    description: "Free bookshelf, must pick up by Jan 30",
    condition: "Fair",
    dorm: "Dorm IV",
    posted_date: "2024-01-22"
  },
  {
    id: 5,
    title: "Microwave Rental",
    category: "rent",
    price: 5,
    seller: "David Lee",
    seller_id: 5,
    image: "🍲",
    description: "2-week rental period, fully functional",
    condition: "Good",
    dorm: "Dorm V",
    posted_date: "2024-01-21"
  },
  {
    id: 6,
    title: "Mini Refrigerator",
    category: "buy",
    price: 80,
    originalPrice: 120,
    seller: "Lisa Wang",
    seller_id: 6,
    image: "🧊",
    description: "Perfect for dorm room, works great",
    condition: "Like New",
    dorm: "Dorm VI",
    posted_date: "2024-01-20"
  },
  {
    id: 7,
    title: "Exercise Bike",
    category: "sell",
    price: 150,
    seller: "Alex Rodriguez",
    seller_id: 7,
    image: "🚴",
    description: "Stationary bike, excellent condition",
    condition: "Like New",
    dorm: "Dorm VII",
    posted_date: "2024-01-19"
  },
  {
    id: 8,
    title: "Free - Desk Lamp",
    category: "free",
    price: 0,
    seller: "Jordan Taylor",
    seller_id: 8,
    image: "💡",
    description: "Working desk lamp, free to good home",
    condition: "Good",
    dorm: "Dorm VIII",
    posted_date: "2024-01-18"
  }
];

let products = JSON.parse(localStorage.getItem('avocado_products')) || defaultProducts;
let currentFilter = 'all';
let currentSort = '';

// RENDER PRODUCTS
function renderProducts(productsToRender = products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (productsToRender.length === 0) {
    grid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; padding: 40px;">No products found</p>';
    return;
  }

  grid.innerHTML = productsToRender.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
  const isSale = product.category === 'buy' || product.category === 'sell';
  const isRental = product.category === 'rent';
  const isFree = product.category === 'free';

  let priceDisplay = '';
  if (isFree) {
    priceDisplay = '<span class="product-price-current">FREE</span>';
  } else if (product.originalPrice && product.category === 'buy') {
    priceDisplay = `
      <span class="product-price-current">$${product.price}</span>
      <span class="product-price-original">$${product.originalPrice}</span>
    `;
  } else if (isRental) {
    priceDisplay = `<span class="product-price-current">$${product.price}/week</span>`;
  } else {
    priceDisplay = `<span class="product-price-current">$${product.price}</span>`;
  }

  const categoryLabel = {
    buy: 'For Sale',
    sell: 'For Sale',
    rent: 'For Rent',
    free: 'Free'
  }[product.category];

  return `
    <div class="product-card" data-category="${product.category}">
      <div class="product-image">
        <div class="product-image-placeholder">${product.image}</div>
      </div>
      <div class="product-info">
        <p class="product-category">${categoryLabel}</p>
        <h3 class="product-title">${product.title}</h3>
        <p class="product-seller">by ${product.seller}</p>
        <div class="product-price">
          ${priceDisplay}
        </div>
        <p style="font-size: 12px; color: #999; margin-bottom: 12px;">
          📍 ${product.dorm} • Condition: ${product.condition}
        </p>
        <div class="product-actions">
          <button class="btn-primary" onclick="viewProductDetail(${product.id})">View</button>
          <button class="btn-secondary" onclick="contactSeller(${product.id})">Contact</button>
        </div>
      </div>
    </div>
  `;
}

// FILTER & SORT
function filterProducts(category) {
  currentFilter = category;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  applyFiltersAndSort();
}

function sortProducts() {
  const select = document.getElementById('sort-dropdown');
  if (!select) return;

  currentSort = select.value;
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  let filtered = products;

  // Apply filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(p => p.category === currentFilter);
  }

  // Apply sort
  switch (currentSort) {
    case 'price-low':
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-high':
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'newest':
      filtered.sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date));
      break;
    case 'popular':
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
  }

  renderProducts(filtered);
}

// PRODUCT DETAIL 
function viewProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (!currentUser) {
    openLoginModal();
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'product-detail-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2 class="modal-title">${product.title}</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="product-image" style="margin-bottom: 20px; height: 200px;">
        <div class="product-image-placeholder" style="font-size: 120px;">${product.image}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <p style="color: #999; font-size: 12px; margin-bottom: 4px;">CATEGORY</p>
          <p style="font-weight: 600;">${product.category.toUpperCase()}</p>
        </div>
        <div>
          <p style="color: #999; font-size: 12px; margin-bottom: 4px;">CONDITION</p>
          <p style="font-weight: 600;">${product.condition}</p>
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="color: #999; font-size: 12px; margin-bottom: 4px;">PRICE</p>
        <p style="font-size: 28px; font-weight: 700; color: #558b2f;">$${product.price}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="color: #999; font-size: 12px; margin-bottom: 4px;">DESCRIPTION</p>
        <p>${product.description}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="color: #999; font-size: 12px; margin-bottom: 4px;">LOCATION</p>
        <p>${product.dorm}</p>
      </div>
      <div style="margin-bottom: 20px; padding: 16px; background-color: #f5f1ed; border-radius: 4px;">
        <p style="font-weight: 600; margin-bottom: 8px;">Seller: ${product.seller}</p>
        <p style="font-size: 14px; color: #666;">Posted on ${new Date(product.posted_date).toLocaleDateString()}</p>
      </div>
      <button class="btn btn-primary btn-block btn-lg" onclick="contactSeller(${product.id})">
        Contact Seller
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.remove();
  });
}

// CONTACT SELLER
function contactSeller(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (!currentUser) {
    openLoginModal();
    return;
  }

  const modal = document.querySelector('.modal.active');
  if (modal) modal.remove();

  // Create chat message modal
  const chatModal = document.createElement('div');
  chatModal.className = 'modal active';
  chatModal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2 class="modal-title">Message ${product.seller}</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
        About: <strong>${product.title}</strong>
      </p>
      <form onsubmit="sendMessage(event, ${productId})">
        <div class="form-group">
          <label for="message-text">Your Message</label>
          <textarea id="message-text" placeholder="Hi, I'm interested in this item..." required></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg">Send Message</button>
      </form>
    </div>
  `;

  document.body.appendChild(chatModal);
}

function sendMessage(event, productId) {
  event.preventDefault();

  const product = products.find(p => p.id === productId);
  const message = document.getElementById('message-text').value;

  const chat = {
    id: Date.now(),
    sender_id: currentUser.id,
    receiver_id: product.seller_id,
    product_id: productId,
    message: message,
    timestamp: new Date().toISOString(),
    read: false
  };

  const messages = JSON.parse(localStorage.getItem('avocado_messages')) || [];
  messages.push(chat);
  localStorage.setItem('avocado_messages', JSON.stringify(messages));

  // Update notification count
  const unreadCount = messages.filter(m => m.receiver_id === currentUser.id && !m.read).length;
  document.getElementById('notification-count').textContent = unreadCount;

  showAlert('success', 'Message sent! The seller will reply soon.');

  document.querySelector('.modal.active').remove();
}

// LOAD TOP ITEMS SIDEBAR 
function loadTopItems() {
  const topItemsDiv = document.getElementById('top-items');
  if (!topItemsDiv) return;

  const topItems = products.slice(0, 3).map(item => `
    <div class="sidebar-item" onclick="viewProductDetail(${item.id})" style="cursor: pointer; padding: 12px 0; color: #558b2f;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>${item.title}</strong>
        <span style="font-size: 18px;">${item.image}</span>
      </div>
      <p style="font-size: 12px; color: #999;">$${item.price}</p>
    </div>
  `).join('');

  topItemsDiv.innerHTML = topItems;
}

// LOAD ACTIVE RENTALS 
function loadActiveRentals() {
  const rentalsDiv = document.getElementById('active-rentals');
  if (!rentalsDiv) return;

  if (!currentUser) {
    rentalsDiv.innerHTML = '<p class="text-muted">Sign in to view rentals</p>';
    return;
  }

  const rentals = JSON.parse(localStorage.getItem('avocado_rentals')) || [];
  const userRentals = rentals.filter(r => r.borrower_id === currentUser.id);

  if (userRentals.length === 0) {
    rentalsDiv.innerHTML = '<p class="text-muted">No active rentals</p>';
    return;
  }

  const rentalsHTML = userRentals.map(rental => {
    const product = products.find(p => p.id === rental.item_id);
    const daysLeft = Math.ceil((new Date(rental.due_date) - new Date()) / (1000 * 60 * 60 * 24));

    return `
      <div class="sidebar-item" style="padding: 12px 0; border-bottom: 1px solid #e0d5cc;">
        <strong>${product?.title || 'Item'}</strong>
        <p style="font-size: 12px; color: #999;">Due: ${new Date(rental.due_date).toLocaleDateString()}</p>
        <p style="font-size: 12px; color: ${daysLeft <= 3 ? '#d32f2f' : '#558b2f'};">
          ${daysLeft} days left
        </p>
      </div>
    `;
  }).join('');

  rentalsDiv.innerHTML = rentalsHTML;
}

// INITIALIZE 
function initMarketplace() {
  renderProducts();
  loadTopItems();
  loadActiveRentals();

  // Update notification count
  if (currentUser) {
    const messages = JSON.parse(localStorage.getItem('avocado_messages')) || [];
    const unreadCount = messages.filter(m => m.receiver_id === currentUser.id && !m.read).length;
    document.getElementById('notification-count').textContent = unreadCount;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initMarketplace);

function openNotifications() {
  if (!currentUser) {
    openLoginModal();
    return;
  }

  const messages = JSON.parse(localStorage.getItem('avocado_messages')) || [];
  const userMessages = messages.filter(m => m.receiver_id === currentUser.id);

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2 class="modal-title">Messages (${userMessages.length})</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        ${userMessages.length === 0 ? '<p class="text-muted">No messages yet</p>' : 
          userMessages.map(msg => {
            const sender = users.find(u => u.id === msg.sender_id);
            const product = products.find(p => p.id === msg.product_id);
            return `
              <div style="padding: 12px; border-bottom: 1px solid #e0d5cc; cursor: pointer;" onclick="readMessage(${msg.id})">
                <p style="font-weight: 600;">${sender?.name} - About: <strong>${product?.title}</strong></p>
                <p style="font-size: 13px; color: #666; margin: 4px 0;">"${msg.message}"</p>
                <p style="font-size: 11px; color: #999;">${new Date(msg.timestamp).toLocaleString()}</p>
              </div>
            `;
          }).join('')
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function readMessage(messageId) {
  const messages = JSON.parse(localStorage.getItem('avocado_messages')) || [];
  const message = messages.find(m => m.id === messageId);
  if (message) {
    message.read = true;
    localStorage.setItem('avocado_messages', JSON.stringify(messages));
    
    const unreadCount = messages.filter(m => m.receiver_id === currentUser.id && !m.read).length;
    document.getElementById('notification-count').textContent = unreadCount;
  }
}
