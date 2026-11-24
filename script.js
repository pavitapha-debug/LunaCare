document.addEventListener('DOMContentLoaded', () => {
  // 1. ตรวจสอบและทำงานในหน้า product.html
  if (document.getElementById('product-list')) {
    initProductPage();
  }

  // 2. ตรวจสอบและทำงานในหน้า order.html
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }

  // 3. ตรวจสอบและทำงานในหน้า admin.html
  if (document.getElementById('ordersTable')) {
    initAdminPage();
  }
});

/* ==========================================================================
   1. หน้าแสดงสินค้า (product.html)
   ========================================================================== */
function initProductPage() {
  const productListEl = document.getElementById('product-list');
  const filterBarEl = document.getElementById('filter-bar');
  let allProducts = [];

  // อ่านค่า ?mood=xxx จาก URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialMood = (urlParams.get('mood') || 'all').toLowerCase();

  // สร้างปุ่มกรองตาม mood
  const moods = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'fresh', label: 'Fresh' },
    { key: 'sweet', label: 'Sweet' },
    { key: 'confident', label: 'Confident' }
  ];

  if (filterBarEl) {
    filterBarEl.innerHTML = moods
      .map(
        (m) => `
        <button type="button" class="filter-btn ${m.key === initialMood ? 'active' : ''}" data-mood="${m.key}">
          ${m.key !== 'all' ? `<span class="mood-dot" style="background-color: var(--mood-${m.key})"></span>` : ''}
          ${m.label}
        </button>
      `
      )
      .join('');

    // ผูก Event คลิกปุ่มกรอง
    filterBarEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filterBarEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedMood = btn.dataset.mood;
      renderProducts(selectedMood);
    });
  }

  // โหลดข้อมูลจาก products.json
  fetch('products.json')
    .then((res) => {
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
      return res.json();
    })
    .then((data) => {
      allProducts = data;
      renderProducts(initialMood);
    })
    .catch((err) => {
      console.error(err);
      productListEl.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">เกิดข้อผิดพลาดในการโหลดรายการสินค้า</p>';
    });

  // ฟังก์ชันวาดการ์ดสินค้า
  function renderProducts(moodFilter) {
    const filtered =
      moodFilter === 'all'
        ? allProducts
        : allProducts.filter((p) => p.mood.toLowerCase() === moodFilter);

    if (filtered.length === 0) {
      productListEl.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">ไม่พบสินค้าในหมวดหมู่นี้</p>';
      return;
    }

    productListEl.innerHTML = filtered
      .map((product) => {
        const orderUrl = `order.html?item=${encodeURIComponent(product.name)}&price=${encodeURIComponent(product.price)}`;
        return `
          <div class="product-card mood-${product.mood.toLowerCase()}">
            <div class="product-img-wrap">
              <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
              <div class="product-meta">
                <span><span class="mood-dot"></span>${product.mood}</span>
                <span>${product.size}</span>
              </div>
              <h3 class="product-title">${product.name}</h3>
              <p class="product-desc">${product.description || ''}</p>
              <div class="product-footer">
                <span class="product-price">฿${Number(product.price).toLocaleString()}</span>
                <a href="${orderUrl}" class="btn btn-sm">สั่งซื้อ</a>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }
}

/* ==========================================================================
   2. หน้าสั่งซื้อสินค้า (order.html)
   ========================================================================== */
function initOrderPage() {
  const orderForm = document.getElementById('orderForm');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  // อ่านค่า item และ price จาก URL parameter แล้วเติมลงฟอร์มทันที
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  if (itemParam && itemsInput) {
    itemsInput.value = itemParam;
  }
  if (priceParam && totalInput) {
    totalInput.value = priceParam;
  }

  // จัดการการส่งฟอร์มสั่งซื้อ
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่งคำสั่งซื้อ...';
    }

    const payload = {
      customerName: document.getElementById('customerName').value.trim(),
      contact: document.getElementById('contact').value.trim(),
      items: document.getElementById('items').value.trim(),
      total: document.getElementById('total').value.trim(),
      note: document.getElementById('note').value.trim()
    };

    fetch('https://script.google.com/macros/s/AKfycbzA-fYeWT77qagKmzH7WmjZRWJG0JmgtYxmgpdufQ0FBDUknCbUyLkXjxtHAzutahVS/exec', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch((error) => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ยืนยันสั่งซื้อ';
        }
      });
  });
}

/* ==========================================================================
   3. หน้าจัดการคำสั่งซื้อ (admin.html)
   ========================================================================== */
function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');
  const csvUrl =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBIbIa2TN2I-UKa2LurkxaWQwvunduSFMii-K6ArpE8RmEMyPqvM4V7aDaDVtCGbpbqR1n_hgbMrzq/pub?gid=0&single=true&output=csv';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">กำลังโหลดข้อมูลคำสั่งซื้อ...</td></tr>';

  fetch(csvUrl)
    .then((res) => {
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูล CSV ได้');
      return res.text();
    })
    .then((csvText) => {
      const rows = parseCSV(csvText);

      // ตัดแถวหัวตาราง (index 0) และกรองแถวว่างออก
      const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ''));

      if (dataRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีรายการสั่งซื้อ</td></tr>';
        return;
      }

      // เรียงจากรายการล่าสุดขึ้นก่อน (สมมติว่า Google Sheet ต่อท้ายแถวใหม่ด้านล่างสุด)
      const latestFirst = dataRows.reverse();

      tbody.innerHTML = latestFirst
        .map((cols) => {
          const timestamp = escapeHTML(cols[0] || '-');
          const customerName = escapeHTML(cols[1] || '-');
          const contact = escapeHTML(cols[2] || '-');
          const items = escapeHTML(cols[3] || '-');
          const total = escapeHTML(cols[4] || '-');
          const note = escapeHTML(cols[5] || '-');

          return `
            <tr>
              <td>${timestamp}</td>
              <td>${customerName}</td>
              <td>${contact}</td>
              <td>${items}</td>
              <td>${total}</td>
              <td>${note}</td>
            </tr>
          `;
        })
        .join('');
    })
    .catch((err) => {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    });
}

/**
 * ฟังก์ชัน Parse CSV แบบเขียนเอง (รองรับเครื่องหมายคำพูด "..." และจุลภาค/ขึ้นบรรทัดใหม่ภายในช่องข้อมูล)
 */
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // กรณี "" ภายใน quotes ให้แปลงเป็น " หนึ่งตัว
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  // เก็บข้อมูลตัวสุดท้าย (ถ้ามี)
  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  return rows;
}

/**
 * ป้องกัน XSS เมื่อนำข้อความจาก Sheet มาแสดงเป็น HTML
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}