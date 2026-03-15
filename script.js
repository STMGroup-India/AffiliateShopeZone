// State
let products = [];
let cart = [];
let activeCategory = 'all';
let activeType = 'all';

// DOM refs
const grid = document.getElementById('productsGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const searchCategory = document.getElementById('searchCategory');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const cartItemCountEl = document.getElementById('cartItemCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const subnavBtns = document.querySelectorAll('.subnav-btn[data-type]');
const sectionTitle = document.getElementById('sectionTitle');
const productCountLabel = document.getElementById('productCountLabel');

const typeLabels = { all: 'All Products', own: 'Our Collection', affiliate: 'Top Picks from Partners' };

// Load products from localStorage, fallback to products.json
async function loadProducts() {
  const stored = localStorage.getItem('shopzone_products');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.length) {
        products = data.map(p => ({ ...p, id: String(p.id) }));
        render();
        return;
      }
    } catch {}
  }
  try {
    const res = await fetch('products.json');
    const data = await res.json();
    if (data.length) {
      localStorage.setItem('shopzone_products', JSON.stringify(data));
    }
    products = data.map(p => ({ ...p, id: String(p.id) }));
    render();
  } catch {
    grid.innerHTML = '<p style="padding:20px;color:#565959;">Could not load products.</p>';
  }
}

function starsSVG(rating) {
  const r = parseFloat(rating) || 0;
  let s = '';
  for (let i = 1; i <= 5; i++) {
    const cls = i <= Math.floor(r) ? 'star-filled' : 'star-empty';
    s += `<svg class="star ${cls}" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
  }
  return s;
}

function render() {
  const q = searchInput.value.toLowerCase().trim();
  const sCat = searchCategory.value;
  const list = products.filter(p => {
    const catOk = activeCategory === 'all' || p.category === activeCategory;
    const sCatOk = sCat === 'all' || p.category === sCat;
    const typeOk = activeType === 'all' || p.type === activeType;
    const qOk = !q || p.name.toLowerCase().includes(q) || (p.category && p.category.includes(q));
    return catOk && sCatOk && typeOk && qOk;
  });

  if (!list.length) {
    grid.innerHTML = '';
    noResults.hidden = false;
    sectionTitle.textContent = typeLabels[activeType] || 'All Products';
    productCountLabel.textContent = '0 results';
    return;
  }
  noResults.hidden = true;
  sectionTitle.textContent = typeLabels[activeType] || 'All Products';
  productCountLabel.textContent = list.length + ' result' + (list.length !== 1 ? 's' : '');

  grid.innerHTML = list.map(p => {
    const price = parseInt(p.price) || 0;
    const origPrice = parseInt(p.originalPrice) || price;
    const off = origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0;
    const reviews = parseInt(p.reviews) || 0;
    const safeId = p.id;

    return `
    <div class="product-card">
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      <img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <div class="stars">${starsSVG(p.rating)}</div>
          <span class="rating-count">${reviews.toLocaleString()}</span>
        </div>
        <div class="product-price">
          ${off >= 40 ? '<div class="price-limited">Limited time deal</div>' : ''}
          <div class="price-main">
            <span class="price-symbol">₹</span><span class="price-whole">${price.toLocaleString()}</span>
          </div>
          ${origPrice > price ? `<div class="price-mrp">M.R.P.: <span class="price-mrp-strike">₹${origPrice.toLocaleString()}</span><span class="price-pct">(${off}% off)</span></div>` : ''}
        </div>
        <div class="delivery-info"><span class="delivery-free">FREE Delivery</span> by ShopZone</div>
        <div class="product-actions">
          ${p.type === 'own'
            ? `<button class="btn-amazon-yellow" onclick="addToCart('${safeId}')">Add to Cart</button>
               <button class="btn-amazon-orange" onclick="buyNow('${safeId}')">Buy Now</button>`
            : `<a href="${p.link || '#'}" target="_blank" rel="noopener noreferrer" class="btn-amazon-orange">View Deal ↗</a>`}
        </div>
        ${p.type === 'affiliate' ? '<div class="affiliate-tag">Sponsored</div>' : ''}
      </div>
    </div>`;
  }).join('');
}

// Cart functions — all IDs are strings
function findProduct(id) { return products.find(x => String(x.id) === String(id)); }
function findCartItem(id) { return cart.find(x => String(x.id) === String(id)); }

function addToCart(id) {
  const p = findProduct(id);
  if (!p) { console.warn('Product not found:', id); return; }
  const ex = findCartItem(id);
  if (ex) { ex.qty++; } else { cart.push({ ...p, qty: 1 }); }
  updateCart();
  openCart();
}

function buyNow(id) {
  addToCart(id);
  alert('Proceeding to checkout... (demo)');
}

function removeFromCart(id) {
  cart = cart.filter(x => String(x.id) !== String(id));
  updateCart();
}

function changeQty(id, d) {
  const item = findCartItem(id);
  if (!item) return;
  item.qty += d;
  if (item.qty < 1) { removeFromCart(id); return; }
  updateCart();
}

function updateCart() {
  const qty = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + (parseInt(i.price) || 0) * i.qty, 0);
  cartCountEl.textContent = qty;
  cartTotalEl.textContent = total.toLocaleString();
  cartItemCountEl.textContent = qty;

  if (!cart.length) {
    cartItemsEl.innerHTML = '<div class="cart-empty"><p>Your ShopZone Cart is empty.</p></div>';
    return;
  }
  cartItemsEl.innerHTML = cart.map(i => {
    const itemTotal = (parseInt(i.price) || 0) * i.qty;
    return `
    <div class="cart-item">
      <img src="${i.image}" alt="${i.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-stock">In stock</div>
        <div class="cart-item-price">₹${itemTotal.toLocaleString()}</div>
        <div class="cart-item-qty">
          <button onclick="changeQty('${i.id}',-1)" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button onclick="changeQty('${i.id}',1)" aria-label="Increase">+</button>
        </div>
        <div class="cart-item-actions">
          <button onclick="removeFromCart('${i.id}')">Delete</button>
          <span>|</span>
          <button>Save for later</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openCart() {
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('open');
}

// Event listeners
cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

checkoutBtn.addEventListener('click', () => {
  if (!cart.length) return alert('Your cart is empty.');
  alert('Checkout coming soon! (demo)');
});

subnavBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    subnavBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeType = btn.dataset.type;
    render();
  });
});

searchCategory.addEventListener('change', render);

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(render, 250);
});

// Init
loadProducts();
updateCart();

// ===== LOCATION =====
const deliverTo = document.getElementById('deliverTo');
const deliverLocation = document.getElementById('deliverLocation');
const locOverlay = document.getElementById('locOverlay');
const locCloseBtn = document.getElementById('locClose');
const locPincode = document.getElementById('locPincode');
const locApply = document.getElementById('locApply');
const locError = document.getElementById('locError');
const locDetect = document.getElementById('locDetect');
const locDetecting = document.getElementById('locDetecting');
const locCurrent = document.getElementById('locCurrent');
const locCurrentText = document.getElementById('locCurrentText');
const locCurrentDetail = document.getElementById('locCurrentDetail');
const locClear = document.getElementById('locClear');
const locAddressForm = document.getElementById('locAddressForm');
const locCity = document.getElementById('locCity');
const locState = document.getElementById('locState');
const locPinDisplay = document.getElementById('locPinDisplay');
const locSaveAddr = document.getElementById('locSaveAddr');
const locAddrError = document.getElementById('locAddrError');

function initLocation() {
  const saved = localStorage.getItem('shopzone_address');
  if (saved) {
    try {
      const addr = JSON.parse(saved);
      showSavedAddress(addr);
    } catch { locCurrent.hidden = true; }
  } else {
    locCurrent.hidden = true;
  }
}

function showSavedAddress(addr) {
  deliverLocation.textContent = '📍 ' + (addr.city || addr.pincode);
  locCurrentText.textContent = addr.name || addr.city || addr.pincode;
  const detail = [addr.flat, addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
  locCurrentDetail.textContent = detail;
  if (addr.phone) locCurrentDetail.textContent += ' · ' + addr.phone;
  locCurrent.hidden = false;
  locAddressForm.hidden = true;
}

function clearLocation() {
  localStorage.removeItem('shopzone_address');
  localStorage.removeItem('shopzone_location');
  deliverLocation.textContent = '📍 Select location';
  locCurrent.hidden = true;
  locAddressForm.hidden = true;
  locPincode.value = '';
  document.getElementById('locName').value = '';
  document.getElementById('locPhone').value = '';
  document.getElementById('locFlat').value = '';
  document.getElementById('locStreet').value = '';
  locCity.value = '';
  locState.value = '';
  locPinDisplay.value = '';
}

function openLocModal() { locOverlay.classList.add('open'); }
function closeLocModal() { locOverlay.classList.remove('open'); locError.hidden = true; locAddrError.hidden = true; }

deliverTo.addEventListener('click', openLocModal);
locCloseBtn.addEventListener('click', closeLocModal);
locOverlay.addEventListener('click', (e) => { if (e.target === locOverlay) closeLocModal(); });

// Apply pincode — show address form
locApply.addEventListener('click', () => {
  const pin = locPincode.value.trim();
  if (!/^\d{6}$/.test(pin)) {
    locError.hidden = false;
    return;
  }
  locError.hidden = true;
  locApply.textContent = 'Loading...';
  locApply.disabled = true;

  fetch('https://api.postalpincode.in/pincode/' + pin)
    .then(r => r.json())
    .then(data => {
      if (data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length) {
        const po = data[0].PostOffice[0];
        locCity.value = po.District || '';
        locState.value = po.State || '';
        locPinDisplay.value = pin;
        locAddressForm.hidden = false;
      } else {
        locCity.value = '';
        locState.value = '';
        locPinDisplay.value = pin;
        locAddressForm.hidden = false;
      }
    })
    .catch(() => {
      locPinDisplay.value = pin;
      locAddressForm.hidden = false;
    })
    .finally(() => {
      locApply.textContent = 'Apply';
      locApply.disabled = false;
    });
});

locPincode.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); locApply.click(); }
});

// Save full address
locSaveAddr.addEventListener('click', () => {
  const name = document.getElementById('locName').value.trim();
  const phone = document.getElementById('locPhone').value.trim();
  const flat = document.getElementById('locFlat').value.trim();
  const street = document.getElementById('locStreet').value.trim();

  if (!name || !phone || !flat || !street) {
    locAddrError.hidden = false;
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    locAddrError.textContent = 'Please enter a valid 10-digit phone number.';
    locAddrError.hidden = false;
    return;
  }
  locAddrError.hidden = true;

  const addr = {
    name, phone, flat, street,
    city: locCity.value,
    state: locState.value,
    pincode: locPinDisplay.value
  };
  localStorage.setItem('shopzone_address', JSON.stringify(addr));
  showSavedAddress(addr);
  closeLocModal();
});

// Detect location
locDetect.addEventListener('click', () => {
  if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
  locDetecting.hidden = false;
  locDetect.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(r => r.json())
        .then(data => {
          const a = data.address || {};
          locCity.value = a.city || a.town || a.village || '';
          locState.value = a.state || '';
          locPinDisplay.value = a.postcode || '';
          locPincode.value = a.postcode || '';
          locAddressForm.hidden = false;
        })
        .catch(() => { locAddressForm.hidden = false; })
        .finally(() => { locDetecting.hidden = true; locDetect.disabled = false; });
    },
    () => {
      locDetecting.hidden = true;
      locDetect.disabled = false;
      alert('Could not detect location. Please enter pincode manually.');
    },
    { timeout: 10000 }
  );
});

// Change/clear
locClear.addEventListener('click', () => { clearLocation(); });

// Init location
initLocation();

// ===== LOGIN / OTP (Firebase Phone Auth) =====
const accountBtn = document.getElementById('accountBtn');
const accountLine1 = document.getElementById('accountLine1');
const accountLine2 = document.getElementById('accountLine2');
const loginOverlay = document.getElementById('loginOverlay');
const loginClose = document.getElementById('loginClose');
const loginStep1 = document.getElementById('loginStep1');
const loginStep2 = document.getElementById('loginStep2');
const loginPhone = document.getElementById('loginPhone');
const loginPhoneDisplay = document.getElementById('loginPhoneDisplay');
const loginPhoneError = document.getElementById('loginPhoneError');
const loginSendOtp = document.getElementById('loginSendOtp');
const loginVerifyOtp = document.getElementById('loginVerifyOtp');
const loginOtpError = document.getElementById('loginOtpError');
const loginResend = document.getElementById('loginResend');
const loginBack = document.getElementById('loginBack');
const otpBoxes = [1,2,3,4,5,6].map(i => document.getElementById('loginOtp' + i));

let confirmationResult = null;
let loginPhoneNum = '';
let recaptchaVerifier = null;
let recaptchaWidgetId = null;

// Setup invisible reCAPTCHA (required by Firebase Phone Auth)
function setupRecaptcha() {
  if (recaptchaVerifier) return;
  recaptchaVerifier = new firebase.auth.RecaptchaVerifier('loginSendOtp', {
    size: 'invisible',
    callback: () => { /* reCAPTCHA solved — will proceed with sendOtp */ },
    'expired-callback': () => { recaptchaVerifier = null; setupRecaptcha(); }
  });
  recaptchaVerifier.render().then(id => { recaptchaWidgetId = id; });
}

// Check Firebase auth state on load
function initAuth() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      accountLine1.textContent = 'Hello, User';
      accountLine2.textContent = user.phoneNumber || '';
      localStorage.setItem('shopzone_user', JSON.stringify({
        phone: user.phoneNumber, uid: user.uid, loggedAt: new Date().toISOString()
      }));
    } else {
      const cached = localStorage.getItem('shopzone_user');
      if (cached) {
        try {
          const u = JSON.parse(cached);
          accountLine1.textContent = 'Hello, User';
          accountLine2.textContent = u.phone;
        } catch { /* ignore */ }
      }
    }
  });
}

function openLogin() {
  // Check if already signed in
  const user = firebase.auth().currentUser;
  if (user) {
    if (confirm('You are signed in as ' + user.phoneNumber + '. Sign out?')) {
      firebase.auth().signOut();
      localStorage.removeItem('shopzone_user');
      accountLine1.textContent = 'Hello, sign in';
      accountLine2.textContent = 'Account ▾';
    }
    return;
  }
  loginStep1.hidden = false;
  loginStep2.hidden = true;
  loginPhoneError.hidden = true;
  loginOtpError.hidden = true;
  loginPhone.value = '';
  otpBoxes.forEach(b => b.value = '');
  loginOverlay.classList.add('open');
  setupRecaptcha();
}

function closeLogin() { loginOverlay.classList.remove('open'); }

accountBtn.addEventListener('click', (e) => { e.preventDefault(); openLogin(); });
loginClose.addEventListener('click', closeLogin);
loginOverlay.addEventListener('click', (e) => { if (e.target === loginOverlay) closeLogin(); });

// Send OTP via Firebase
loginSendOtp.addEventListener('click', () => {
  const phone = loginPhone.value.trim();
  if (!/^\d{10}$/.test(phone)) {
    loginPhoneError.textContent = 'Please enter a valid 10-digit mobile number.';
    loginPhoneError.hidden = false;
    return;
  }
  loginPhoneError.hidden = true;
  loginPhoneNum = phone;
  loginSendOtp.textContent = 'Sending...';
  loginSendOtp.disabled = true;

  const fullNumber = '+91' + phone;

  firebase.auth().signInWithPhoneNumber(fullNumber, recaptchaVerifier)
    .then((result) => {
      confirmationResult = result;
      loginPhoneDisplay.textContent = '+91 ' + phone;
      loginStep1.hidden = true;
      loginStep2.hidden = false;
      otpBoxes[0].focus();
    })
    .catch((error) => {
      console.error('Firebase OTP error:', error);
      let msg = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
      if (error.code === 'auth/invalid-phone-number') msg = 'Invalid phone number.';
      if (error.code === 'auth/quota-exceeded') msg = 'SMS quota exceeded. Try again tomorrow.';
      loginPhoneError.textContent = msg;
      loginPhoneError.hidden = false;
      // Reset reCAPTCHA for retry
      if (typeof grecaptcha !== 'undefined' && recaptchaWidgetId !== null) {
        grecaptcha.reset(recaptchaWidgetId);
      }
    })
    .finally(() => {
      loginSendOtp.textContent = 'Send OTP';
      loginSendOtp.disabled = false;
    });
});

// OTP box auto-focus
otpBoxes.forEach((box, i) => {
  box.addEventListener('input', () => {
    box.value = box.value.replace(/\D/g, '');
    if (box.value && i < 5) otpBoxes[i + 1].focus();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !box.value && i > 0) otpBoxes[i - 1].focus();
  });
  box.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    paste.split('').forEach((ch, j) => { if (otpBoxes[j]) otpBoxes[j].value = ch; });
    if (paste.length > 0) otpBoxes[Math.min(paste.length, 5)].focus();
  });
});

// Verify OTP via Firebase
loginVerifyOtp.addEventListener('click', () => {
  const entered = otpBoxes.map(b => b.value).join('');
  if (entered.length < 6) {
    loginOtpError.textContent = 'Please enter the complete 6-digit OTP.';
    loginOtpError.hidden = false;
    return;
  }
  if (!confirmationResult) {
    loginOtpError.textContent = 'Session expired. Please request a new OTP.';
    loginOtpError.hidden = false;
    return;
  }
  loginOtpError.hidden = true;
  loginVerifyOtp.textContent = 'Verifying...';
  loginVerifyOtp.disabled = true;

  confirmationResult.confirm(entered)
    .then((result) => {
      const user = result.user;
      localStorage.setItem('shopzone_user', JSON.stringify({
        phone: user.phoneNumber, uid: user.uid, loggedAt: new Date().toISOString()
      }));
      accountLine1.textContent = 'Hello, User';
      accountLine2.textContent = user.phoneNumber;
      closeLogin();
    })
    .catch((error) => {
      console.error('OTP verify error:', error);
      let msg = 'Invalid OTP. Please try again.';
      if (error.code === 'auth/code-expired') msg = 'OTP expired. Please request a new one.';
      loginOtpError.textContent = msg;
      loginOtpError.hidden = false;
    })
    .finally(() => {
      loginVerifyOtp.textContent = 'Verify & Sign In';
      loginVerifyOtp.disabled = false;
    });
});

// Resend OTP
loginResend.addEventListener('click', () => {
  otpBoxes.forEach(b => b.value = '');
  otpBoxes[0].focus();
  loginOtpError.hidden = true;

  // Reset reCAPTCHA and resend
  recaptchaVerifier = null;
  setupRecaptcha();

  const fullNumber = '+91' + loginPhoneNum;
  firebase.auth().signInWithPhoneNumber(fullNumber, recaptchaVerifier)
    .then((result) => {
      confirmationResult = result;
      loginOtpError.textContent = 'New OTP sent successfully.';
      loginOtpError.style.color = '#007600';
      loginOtpError.hidden = false;
      setTimeout(() => { loginOtpError.style.color = ''; loginOtpError.hidden = true; }, 3000);
    })
    .catch((error) => {
      console.error('Resend error:', error);
      loginOtpError.textContent = 'Failed to resend. Please try again.';
      loginOtpError.hidden = false;
    });
});

// Back to phone step
loginBack.addEventListener('click', () => {
  loginStep1.hidden = false;
  loginStep2.hidden = true;
  confirmationResult = null;
});

initAuth();
