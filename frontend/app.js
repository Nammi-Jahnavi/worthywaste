const API = {
  counters: () => fetch('/api/counters').then(r => r.json()),
  leaderboard: () => fetch('/api/leaderboard').then(r => r.json()),
  analytics: () => fetch('/api/analytics').then(r => r.json()),
  addWaste: (formData) => fetch('/api/waste', { method: 'POST', body: formData }).then(r => r.json()),
  wastes: (supplier) => fetch(`/api/waste${supplier ? `?supplier=${encodeURIComponent(supplier)}` : ''}`).then(r => r.json()),
  listings: (params={}) => {
    const q = new URLSearchParams(params);
    return fetch(`/api/listings${q.toString() ? `?${q.toString()}` : ''}`).then(r => r.json());
  },
  bookings: (buyer) => fetch(`/api/bookings${buyer ? `?buyer=${encodeURIComponent(buyer)}` : ''}`).then(r => r.json()),
  createBooking: (payload) => fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
  updateBookingStatus: (id, status) => fetch(`/api/bookings/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).then(r => r.json()),
};

async function loadCounters() {
  try {
    const c = await API.counters();
    const waste = `${c.wasteSavedKg?.toFixed?.(1) ?? c.wasteSavedKg} kg`;
    const compost = `${c.compostProducedKg?.toFixed?.(1) ?? c.compostProducedKg} kg`;
    const co2 = `${c.co2ReducedKg?.toFixed?.(1) ?? c.co2ReducedKg} kg`;
    const w = document.getElementById('wasteSaved'); if (w) w.textContent = waste;
    const cp = document.getElementById('compostProduced'); if (cp) cp.textContent = compost;
    const co = document.getElementById('co2Reduced'); if (co) co.textContent = co2;

    const aw = document.getElementById('aWasteSaved'); if (aw) aw.textContent = waste;
    const ac = document.getElementById('aCompostProduced'); if (ac) ac.textContent = compost;
    const az = document.getElementById('aCo2Reduced'); if (az) az.textContent = co2;
  } catch (e) { console.error(e); }
}

function statusTracker(status) {
  const steps = ['Requested','Confirmed','Picked','Completed'];
  return `<div class="status">${steps.map(s => `<div class="dot ${steps.indexOf(s) <= steps.indexOf(status) ? 'active' : ''}"></div><span class="label">${s}</span>`).join('<span style=\"width:10px\"></span>')}</div>`;
}

// Supplier page
function initSupplierPage() {
  const form = document.getElementById('addWasteForm');
  const msgEl = document.getElementById('addWasteMsg');
  const histEl = document.getElementById('wasteHistory');
  const ecoBadge = document.getElementById('ecoScoreBadge');

  async function refreshHistory() {
    const supplier = document.getElementById('supplierName').value.trim();
    const list = await API.wastes(supplier || undefined);
    histEl.innerHTML = list.map(item => `
      <div class="card">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <strong>${item.type}</strong>
          <span class="badge">${item.weight} kg</span>
        </div>
        <div class="small">${item.location}</div>
        ${item.photoUrl ? `<img src="${item.photoUrl}" alt="photo" style="width:100%;margin-top:8px;border-radius:8px;">` : ''}
        <div style="margin-top:8px;">${statusTracker(item.status)}</div>
      </div>
    `).join('');

    // Eco score: total completed kg * 10 (demo)
    const score = Math.round((list.filter(x => x.status === 'Completed').reduce((a,b) => a + (b.weight||0), 0)) * 10);
    ecoBadge.textContent = `Eco Score: ${score}`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.textContent = 'Uploading...';
    try {
      const fd = new FormData();
      fd.append('supplier', document.getElementById('supplierName').value.trim());
      fd.append('type', document.getElementById('wasteType').value);
      fd.append('weight', document.getElementById('wasteWeight').value);
      fd.append('location', document.getElementById('wasteLocation').value.trim());
      const file = document.getElementById('wastePhoto').files[0];
      if (file) fd.append('photo', file);
      const res = await API.addWaste(fd);
      if (res.error) throw new Error(res.error);
      msgEl.textContent = 'Waste added successfully!';
      await refreshHistory();
      loadCounters();
      form.reset();
    } catch (err) {
      console.error(err);
      msgEl.textContent = 'Failed to add waste.';
    }
  });

  const nameInput = document.getElementById('supplierName');
  nameInput.addEventListener('change', refreshHistory);
  refreshHistory();
}

// Buyer page
function initBuyerPage() {
  const grid = document.getElementById('listingGrid');
  const bookingsEl = document.getElementById('bookingsList');

  async function renderListings() {
    const params = {
      location: document.getElementById('filterLocation').value.trim(),
      minWeight: document.getElementById('filterMinWeight').value,
      maxWeight: document.getElementById('filterMaxWeight').value,
    };
    // Remove empty params
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

    const list = await API.listings(params);
    grid.innerHTML = list.map(item => `
      <div class="card">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <strong>${item.type}</strong>
          <span class="badge">${item.weight} kg</span>
        </div>
        <div class="small">${item.location}</div>
        ${item.photoUrl ? `<img src="${item.photoUrl}" alt="photo" style="width:100%;margin-top:8px;border-radius:8px;">` : ''}
        <div style="margin-top:8px;">${statusTracker(item.status)}</div>
        <button class="btn btn-primary" data-wasteid="${item._id}">Book Pickup</button>
      </div>
    `).join('');

    grid.querySelectorAll('button[data-wasteid]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const buyer = prompt('Enter your name or email to book:');
        if (!buyer) return;
        const res = await API.createBooking({ wasteId: btn.dataset.wasteid, buyer });
        if (res.error) { alert(res.error); return; }
        alert('Booking requested!');
        renderListings();
        renderBookings(buyer);
      });
    });
  }

  async function renderBookings(buyerName) {
    const buyer = buyerName || localStorage.getItem('buyerName') || '';
    if (buyer) localStorage.setItem('buyerName', buyer);
    const list = await API.bookings(buyer || undefined);
    bookingsEl.innerHTML = list.map(b => `
      <div class="card">
        <div><strong>Booking</strong> <span class="small">for ${b.buyer}</span></div>
        <div class="small">Waste ID: ${b.wasteId}</div>
        <div style="margin-top:8px;">${statusTracker(b.status)}</div>
      </div>
    `).join('');
  }

  document.getElementById('applyFilters').addEventListener('click', renderListings);
  renderListings();
  renderBookings();
}

// Analytics page
async function initAnalyticsPage() {
  await loadCounters();
  // Status Breakdown bars
  try {
    const a = await API.analytics();
    const container = document.getElementById('statusChart');
    const total = a.byStatus.reduce((acc, x) => acc + x.count, 0) || 1;
    container.innerHTML = a.byStatus.map(x => {
      const pct = Math.round((x.count / total) * 100);
      return `<div class="small">${x._id} • ${x.count}</div>
        <div style="background:#0f221a;border:1px solid #1b4b34;border-radius:8px;height:16px;margin-bottom:8px;">
          <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:8px;"></div>
        </div>`;
    }).join('');
  } catch (e) { console.error(e); }

  // Leaderboard
  try {
    const lb = await API.leaderboard();
    const ol = document.getElementById('leaderboard');
    ol.innerHTML = lb.map((x, i) => `<li>${i+1}. <strong>${x.supplier}</strong> — ${x.totalKg} kg (${x.items} items)</li>`).join('');
  } catch (e) { console.error(e); }
}
