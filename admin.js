const db = firebase.firestore();
const productsRef = db.collection('products');

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

// Type toggle
typeSelect.addEventListener('change', () => {
  affiliateRow.hidden = typeSelect.value !== 'affiliate';
});

// Image file to base64
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

// Render product list from Firestore (real-time)
function listenProducts() {
  productsRef.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    renderList(products);
  }, (error) => {
    console.error('Firestore listen error:', error);
    productList.innerHTML = '<p style="padding:20px;color:#ff6b6b;">Could not load products. Check Firestore rules.</p>';
  });
}

function renderList(products) {
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
        <button onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn-del" onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    </div>`).join('');
}

// Submit form — save to Firestore
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = editIdField.value || null;

  // Resolve image
  let image = '';
  if (uploadedFileData) {
    image = uploadedFileData;
  } else if (imageUrlInput.value.trim()) {
    image = imageUrlInput.value.trim();
  } else if (editId) {
    // Keep existing image on edit
    try {
      const doc = await productsRef.doc(editId).get();
      image = doc.exists ? doc.data().image : '';
    } catch { image = ''; }
  }

  if (!image) {
    alert('Please add a product image (upload or paste URL).');
    return;
  }

  const product = {
    name: document.getElementById('pName').value.trim(),
    price: parseInt(document.getElementById('pPrice').value),
    originalPrice: parseInt(document.getElementById('pOriginalPrice').value),
    image: image,
    category: document.getElementById('pCategory').value,
    badge: document.getElementById('pBadge').value.trim() || null,
    rating: parseFloat(document.getElementById('pRating').value) || 4.0,
    reviews: 0,
    type: document.getElementById('pType').value,
    link: document.getElementById('pType').value === 'affiliate'
      ? document.getElementById('pLink').value.trim() || null
      : null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  btnSave.disabled = true;
  btnSave.textContent = 'Saving...';

  try {
    if (editId) {
      await productsRef.doc(editId).update(product);
    } else {
      product.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await productsRef.add(product);
    }
    resetForm();
  } catch (error) {
    console.error('Save error:', error);
    alert('Could not save product. Check Firestore rules and try again.');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = editId ? 'Update Product' : 'Add Product';
  }
});

// Edit product
async function editProduct(id) {
  try {
    const doc = await productsRef.doc(id).get();
    if (!doc.exists) return;
    const p = doc.data();

    editIdField.value = id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pOriginalPrice').value = p.originalPrice;
    imageUrlInput.value = p.image && !p.image.startsWith('data:') ? p.image : '';
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
  } catch (error) {
    console.error('Edit error:', error);
  }
}

// Delete product
async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await productsRef.doc(id).delete();
  } catch (error) {
    console.error('Delete error:', error);
    alert('Could not delete product.');
  }
}

// Reset form
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

// Start listening
listenProducts();
