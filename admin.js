const STORAGE_KEY = 'shopzone_products';

// DOM
const form = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const editIdField = document.getElementById('editId');
const affiliateRow = document.getElementById('affiliateRow');
const productList = document.getElementById('productList');
const productCount = document.getElementById('productCount');
const emptyMsg = document.getElementById('emptyMsg');
const typeSelect = document.getElementById('pType');
const imageFileInput = document.getElementById('pImageFile');
const imageUrlInput = document.getElementById('pImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const clearImageBtn = document.getElementById('clearImage');
let uploadedFileData = null;

function getProducts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}
function nextId(products) {
  if (!products.length) return 1;
  return Math.max(...products.map(p => parseInt(p.id) || 0)) + 1;
}

// Type toggle
typeSelect.addEventListener('change', () => {
  affiliateRow.hidden = typeSelect.value !== 'affiliate';
});

// Image file → convert to base64 data URL (no server needed)
imageFileInput.addEventListener('change', () => {
  const file = imageFileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFileData = e.target.result;
    imageUrlInput.value = '';
    previewImg.src = uploadedFileData;
    imagePreview.hidden = false;
  };
  reader.readAsDataURL(file);
});

// Image URL pasted
imageUrlInput.addEventListener('input', () => {
  const url = imageUrlInput.value.trim();
  if (url) {
    uploadedFileData = null;
    imageFileInput.value = '';
    previewImg.src = url;
    imagePreview.hidden = false;
  } else {
    imagePreview.hidden = true;
  }
});

// Clear image
clearImageBtn.addEventListener('click', () => {
  uploadedFileData = null;
  imageFileInput.value = '';
  imageUrlInput.value = '';
  imagePreview.hidden = true;
});

// Render list
function renderList() {
  const products = getProducts();
  productCount.textContent = products.length;

  if (!products.length) {
    productList.innerHTML = '';
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  productList.innerHTML = products.map(p => `
    <div class="p-row">
      <img src="${p.image}" alt="${p.name}">
      <div class="p-row-info">
        <div class="p-row-name">${p.name}</div>
        <div class="p-row-meta">${p.category} · Rating: ${p.rating}★ ${p.badge ? '· ' + p.badge : ''}</div>
      </div>
      <span class="p-row-type ${p.type}">${p.type === 'own' ? 'Own' : 'Affiliate'}</span>
      <div class="p-row-price">₹${parseInt(p.price).toLocaleString()}</div>
      <div class="p-row-actions">
        <button onclick="editProduct(${p.id})">Edit</button>
        <button class="btn-del" onclick="deleteProduct(${p.id})">Delete</button>
      </div>
    </div>`).join('');
}

// Submit form
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const products = getProducts();
  const editId = editIdField.value ? parseInt(editIdField.value) : null;

  // Resolve image
  let image = '';
  if (uploadedFileData) {
    image = uploadedFileData;
  } else if (imageUrlInput.value.trim()) {
    image = imageUrlInput.value.trim();
  } else if (editId) {
    const existing = products.find(p => p.id === editId);
    image = existing ? existing.image : '';
  }

  if (!image) {
    alert('Please add a product image (upload or paste URL).');
    return;
  }

  const product = {
    id: editId || nextId(products),
    name: document.getElementById('pName').value.trim(),
    price: parseInt(document.getElementById('pPrice').value),
    originalPrice: parseInt(document.getElementById('pOriginalPrice').value),
    image: image,
    category: document.getElementById('pCategory').value,
    badge: document.getElementById('pBadge').value.trim() || null,
    rating: parseFloat(document.getElementById('pRating').value) || 4.0,
    reviews: editId ? (products.find(p => p.id === editId)?.reviews || 0) : 0,
    type: document.getElementById('pType').value,
    link: document.getElementById('pType').value === 'affiliate'
      ? document.getElementById('pLink').value.trim() || null
      : null
  };

  if (editId) {
    const idx = products.findIndex(p => p.id === editId);
    if (idx !== -1) products[idx] = product;
  } else {
    products.push(product);
  }

  saveProducts(products);
  resetForm();
  renderList();
});

// Edit
function editProduct(id) {
  const products = getProducts();
  const p = products.find(x => x.id === id);
  if (!p) return;

  editIdField.value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pOriginalPrice').value = p.originalPrice;
  imageUrlInput.value = p.image.startsWith('data:') ? '' : p.image;
  if (p.image) { previewImg.src = p.image; imagePreview.hidden = false; }
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pRating').value = p.rating;
  document.getElementById('pType').value = p.type;
  document.getElementById('pLink').value = p.link || '';
  affiliateRow.hidden = p.type !== 'affiliate';

  formTitle.textContent = 'Edit Product';
  btnSave.textContent = 'Update Product';
  btnCancel.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete
function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
  renderList();
}

// Reset
function resetForm() {
  form.reset();
  editIdField.value = '';
  formTitle.textContent = 'Add New Product';
  btnSave.textContent = 'Add Product';
  btnCancel.hidden = true;
  affiliateRow.hidden = true;
  document.getElementById('pRating').value = '4.0';
  uploadedFileData = null;
  imageFileInput.value = '';
  imageUrlInput.value = '';
  imagePreview.hidden = true;
}

renderList();
