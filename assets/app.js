// ==========================================
// SmartLomba — Frontend Application
// ==========================================

const API = '/api';

function getToken() {
  return localStorage.getItem('sl_token');
}

function getUser() {
  const u = localStorage.getItem('sl_user');
  return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
  localStorage.setItem('sl_token', token);
  localStorage.setItem('sl_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('sl_token');
  localStorage.removeItem('sl_user');
}

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

function showToast(message, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ==========================================
// Login Page
// ==========================================
let currentLoginRole = 'admin';

function switchTab(role) {
  currentLoginRole = role;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${role}"]`).classList.add('active');
  const emailInput = document.getElementById('loginEmail');
  if (emailInput) {
    emailInput.placeholder = role === 'admin' ? 'Username' : 'Email';
  }
}

function togglePassword() {
  const pwdInput = document.getElementById('loginPassword');
  if (pwdInput) pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
}

async function handleLogin(e) {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  errorEl.style.display = 'none';

  const identifier = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!identifier || !password) {
    errorEl.textContent = 'Semua field wajib diisi.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role: currentLoginRole }),
    });
    setAuth(res.data.token, res.data.user);
    window.location.href = res.data.user.role === 'admin' ? 'admin-dashboard.html' : 'peserta-dashboard.html';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Masuk Sekarang';
  }
}

// ==========================================
// Signup Page
// ==========================================
async function handleSignup(e) {
  e.preventDefault();
  const errorEl = document.getElementById('signupError');
  const successEl = document.getElementById('signupSuccess');
  const btn = document.getElementById('signupBtn');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  const pw = document.getElementById('regPassword').value;
  const pw2 = document.getElementById('regPasswordConfirm').value;

  if (pw !== pw2) {
    errorEl.textContent = 'Password dan konfirmasi tidak cocok.';
    errorEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Mendaftar...';

  try {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nama: document.getElementById('regNama').value.trim(),
        nisn: document.getElementById('regNisn').value.trim(),
        asal_sekolah: document.getElementById('regSekolah').value.trim(),
        jenjang: document.getElementById('regJenjang').value,
        kelas: document.getElementById('regKelas').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        no_hp_ortu: document.getElementById('regHp').value.trim(),
        password: pw,
      }),
    });
    successEl.textContent = 'Registrasi berhasil! Silakan login.';
    successEl.style.display = 'block';
    document.getElementById('signupForm').reset();
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Daftar Sekarang';
  }
}

// ==========================================
// Logout
// ==========================================
async function handleLogout(e) {
  if (e) e.preventDefault();
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (_) {}
  clearAuth();
  window.location.href = 'index.html';
}

// ==========================================
// Auth Guard
// ==========================================
function requireLogin(role) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) { window.location.href = 'index.html'; return null; }
  if (role && user.role !== role) { window.location.href = 'index.html'; return null; }
  return user;
}

// ==========================================
// Sidebar Toggle
// ==========================================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.style.transform = sidebar.style.transform === 'translateX(-100%)' ? 'translateX(0)' : 'translateX(-100%)';
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// ==========================================
// Registrasi Lomba (registrasi.html)
// ==========================================
let regSelectedLombaId = null;

async function initRegistrasi() {
  const user = requireLogin('peserta');
  if (!user) return;

  try {
    const res = await apiFetch('/peserta/me');
    const me = res.data;

    document.getElementById('namaLengkap').value = me.nama;
    document.getElementById('nisn').value = me.nisn || '';
    document.getElementById('asalSekolah').value = me.asal_sekolah || '';
    document.getElementById('emailPeserta').value = me.email;
    document.getElementById('noHpOrtu').value = me.no_hp_ortu || '';

    ['namaLengkap', 'nisn', 'asalSekolah', 'emailPeserta', 'noHpOrtu'].forEach(id => {
      document.getElementById(id).readOnly = true;
      document.getElementById(id).style.backgroundColor = '#F3F4F6';
    });

    const jenjangEl = document.getElementById('jenjang');
    if (me.jenjang) {
      jenjangEl.value = me.jenjang;
      jenjangEl.disabled = true;
      jenjangEl.style.backgroundColor = '#F3F4F6';
    }
    const kelasEl = document.getElementById('kelas');
    if (me.kelas) {
      kelasEl.innerHTML = `<option>${me.kelas}</option>`;
      kelasEl.disabled = true;
      kelasEl.style.backgroundColor = '#F3F4F6';
    }
  } catch (err) {
    showToast('Gagal memuat profil: ' + err.message, 'error');
  }

  try {
    const res = await apiFetch('/lomba');
    const lombaList = res.data;
    const grid = document.querySelector('.lomba-grid');
    const colors = ['lomba-blue', 'lomba-green', 'lomba-orange', 'lomba-purple'];
    const icons = ['∑', '⚗', 'Ʌ', 'E'];

    grid.innerHTML = lombaList.map((l, i) => `
      <label class="lomba-card">
        <input type="radio" name="lomba" value="${l.id}" onchange="regSelectedLombaId=${l.id}; regSelectedLombaName='${l.nama_lomba}'" />
        <div class="lomba-icon ${colors[i % colors.length]}">${icons[i % icons.length]}</div>
        <div class="lomba-info">
          <strong>${l.nama_lomba}</strong>
          <span>${l.pelaksana} &bull; ${new Date(l.tanggal_pelaksanaan).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</span>
        </div>
        <div class="lomba-check">✓</div>
      </label>
    `).join('');
  } catch (err) {
    showToast('Gagal memuat daftar lomba: ' + err.message, 'error');
  }
}

let regSelectedLombaName = '';

function nextStep(e, currentStep) {
  if (e) e.preventDefault();
  if (currentStep === 1) {
    document.getElementById('regStep1').style.display = 'none';
    document.getElementById('regStep2').style.display = 'block';
    document.getElementById('step-ind-2').classList.add('active');
    document.getElementById('line-1').style.background = 'var(--accent)';
  }
}

function prevStep(currentStep) {
  if (currentStep === 2) {
    document.getElementById('regStep2').style.display = 'none';
    document.getElementById('regStep1').style.display = 'block';
    document.getElementById('step-ind-2').classList.remove('active');
    document.getElementById('line-1').style.background = 'var(--border)';
  } else if (currentStep === 3) {
    document.getElementById('regStep3').style.display = 'none';
    document.getElementById('regStep2').style.display = 'block';
    document.getElementById('step-ind-3').classList.remove('active');
    document.getElementById('line-2').style.background = 'var(--border)';
  }
}

function selectLomba(radioElem) {
  regSelectedLombaId = parseInt(radioElem.value);
}

function goToStep3() {
  if (!regSelectedLombaId) {
    alert('Silakan pilih lomba terlebih dahulu.');
    return;
  }

  document.getElementById('regStep2').style.display = 'none';
  document.getElementById('regStep3').style.display = 'block';
  document.getElementById('step-ind-3').classList.add('active');
  document.getElementById('line-2').style.background = 'var(--accent)';

  const user = getUser();
  document.getElementById('confirmData').innerHTML = `
    <div style="margin-bottom:16px;">
      <p style="font-size:12px;color:var(--text-gray);">Nama Lengkap</p>
      <p style="font-weight:600;">${user.nama}</p>
    </div>
    <div style="margin-bottom:16px;">
      <p style="font-size:12px;color:var(--text-gray);">Asal Sekolah</p>
      <p style="font-weight:600;">${user.asal_sekolah}</p>
    </div>
    <div style="margin-bottom:16px;">
      <p style="font-size:12px;color:var(--text-gray);">Kelas</p>
      <p style="font-weight:600;">${user.kelas}</p>
    </div>
    <div>
      <p style="font-size:12px;color:var(--text-gray);">Lomba yang Diikuti</p>
      <p style="font-weight:600;color:var(--accent);">${regSelectedLombaName}</p>
    </div>
  `;
}

async function submitRegistration() {
  try {
    await apiFetch('/pendaftaran', {
      method: 'POST',
      body: JSON.stringify({ lomba_id: regSelectedLombaId }),
    });
    document.getElementById('regStep3').style.display = 'none';
    document.querySelector('.step-indicator').style.display = 'none';
    document.getElementById('regSuccess').style.display = 'block';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// Admin Dashboard
// ==========================================
async function initAdminDashboard() {
  const user = requireLogin('admin');
  if (!user) return;

  try {
    const res = await apiFetch('/dashboard/stats');
    const stats = res.data;
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues[0]) statValues[0].textContent = stats.total_peserta;
    if (statValues[1]) statValues[1].textContent = stats.lomba_aktif;
  } catch (_) {}

  try {
    const res = await apiFetch('/dashboard/pendaftaran-per-lomba');
    const data = res.data;
    const chart = document.querySelector('.bar-chart');
    if (chart && data.length) {
      const max = Math.max(...data.map(d => d.jumlah), 1);
      const colors = ['bar-blue', 'bar-orange', 'bar-green', 'bar-purple'];
      chart.innerHTML = data.map((d, i) => `
        <div class="bar-item">
          <div class="bar-label">${d.lomba.length > 12 ? d.lomba.substring(0,12)+'...' : d.lomba}</div>
          <div class="bar-track">
            <div class="bar-fill ${colors[i % colors.length]}" style="width:${(d.jumlah / max) * 100}%;"></div>
          </div>
          <div class="bar-value">${d.jumlah}</div>
        </div>
      `).join('');
    }
  } catch (_) {}

  try {
    const res = await apiFetch('/pendaftaran?limit=5&sort=terbaru');
    const rows = res.data.data;
    const tbody = document.getElementById('dashboardTableBody');
    if (tbody) {
      tbody.innerHTML = rows.map((p, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-weight:500;">${p.nama}</td>
          <td>${p.asal_sekolah}</td>
          <td>${p.nama_lomba}</td>
          <td><span class="status-badge status-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
          <td><a href="admin-peserta.html" class="icon-btn" style="font-size:12px;">Detail</a></td>
        </tr>
      `).join('');
    }
  } catch (_) {}
}

function openTambahLombaModal() {
  document.getElementById('tambahLombaModal').style.display = 'flex';
}

async function handleTambahLomba(e) {
  e.preventDefault();
  try {
    await apiFetch('/lomba', {
      method: 'POST',
      body: JSON.stringify({
        nama_lomba: document.getElementById('tlNama').value.trim(),
        kode_lomba: document.getElementById('tlKode').value.trim(),
        tanggal_pelaksanaan: document.getElementById('tlTanggal').value,
        maksimal_peserta: parseInt(document.getElementById('tlMaks').value),
        pelaksana: document.getElementById('tlPelaksana').value.trim(),
        deskripsi: document.getElementById('tlDeskripsi').value.trim(),
      }),
    });
    showToast('Lomba berhasil ditambahkan!');
    closeModal('tambahLombaModal');
    document.getElementById('formTambahLomba').reset();
    initAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// Admin Peserta Page
// ==========================================
let adminPesertaPage = 1;
let adminPesertaData = [];
let currentDetailId = null;

async function initAdminPeserta() {
  const user = requireLogin('admin');
  if (!user) return;
  await loadPesertaTable();
}

async function loadPesertaTable() {
  const search = document.getElementById('searchInput')?.value || '';
  const status = document.getElementById('statusFilter')?.value || '';
  const limit = 10;

  try {
    const qs = `?page=${adminPesertaPage}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}&sort=terbaru`;
    const res = await apiFetch('/pendaftaran' + qs);
    const { data, total, page } = res.data;
    adminPesertaData = data;

    const tbody = document.getElementById('pesertaTableBody');
    if (!tbody) return;

    tbody.innerHTML = data.map((p, idx) => `
      <tr>
        <td><input type="checkbox" class="row-checkbox" data-id="${p.id}" onchange="checkRowSelection()" /></td>
        <td>${(page - 1) * limit + idx + 1}</td>
        <td style="font-weight:500;">${p.nama}</td>
        <td>${p.asal_sekolah}</td>
        <td>${p.kelas}</td>
        <td style="color:var(--accent);font-weight:500;">${p.nama_lomba}</td>
        <td>${new Date(p.tanggal_daftar).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</td>
        <td><span class="status-badge status-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
        <td>
          <button class="icon-btn" onclick="openDetailModal(${p.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    const totalPages = Math.ceil(total / limit);
    document.getElementById('paginationInfo').textContent = `Menampilkan ${data.length} dari ${total} peserta`;

    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = 'pg-btn' + (i === page ? ' active' : '');
      btn.textContent = i;
      btn.onclick = () => { adminPesertaPage = i; loadPesertaTable(); };
      pageNumbers.appendChild(btn);
    }
    document.getElementById('prevBtn').disabled = page <= 1;
    document.getElementById('nextBtn').disabled = page >= totalPages;
  } catch (err) {
    showToast('Gagal memuat data: ' + err.message, 'error');
  }
}

function filterTable() {
  adminPesertaPage = 1;
  loadPesertaTable();
}

function changePage(dir) {
  adminPesertaPage += dir;
  loadPesertaTable();
}

function toggleSelectAll(checkbox) {
  document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checkbox.checked);
  checkRowSelection();
}

function checkRowSelection() {
  const checked = document.querySelectorAll('.row-checkbox:checked').length;
  const bulkBar = document.getElementById('bulkBar');
  if (bulkBar) {
    bulkBar.style.display = checked > 0 ? 'flex' : 'none';
    document.getElementById('selectedCount').innerText = `${checked} Peserta Terpilih`;
  }
}

function closeBulkBar() {
  document.getElementById('bulkBar').style.display = 'none';
  document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
  const selectAll = document.getElementById('selectAll');
  if (selectAll) selectAll.checked = false;
}

function getSelectedIds() {
  return [...document.querySelectorAll('.row-checkbox:checked')].map(cb => parseInt(cb.dataset.id));
}

async function bulkVerify() {
  const ids = getSelectedIds();
  if (!ids.length) return;
  try {
    await apiFetch('/pendaftaran/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ ids, status: 'terverifikasi' }),
    });
    showToast(`${ids.length} pendaftaran berhasil diverifikasi.`);
    closeBulkBar();
    loadPesertaTable();
  } catch (err) { showToast(err.message, 'error'); }
}

async function bulkDelete() {
  const ids = getSelectedIds();
  if (!ids.length) return;
  if (!confirm('Yakin ingin menghapus ' + ids.length + ' pendaftaran?')) return;
  try {
    await apiFetch('/pendaftaran/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    showToast(`${ids.length} pendaftaran berhasil dihapus.`);
    closeBulkBar();
    loadPesertaTable();
  } catch (err) { showToast(err.message, 'error'); }
}

async function openDetailModal(id) {
  currentDetailId = id;
  try {
    const res = await apiFetch('/pendaftaran/' + id);
    const p = res.data;
    document.getElementById('modalContent').innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div><p style="font-size:12px;color:var(--text-gray);">Nama</p><p style="font-weight:600;">${p.nama}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">Email</p><p style="font-weight:500;">${p.email}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">NISN</p><p style="font-weight:500;">${p.nisn || '-'}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">Asal Sekolah</p><p style="font-weight:500;">${p.asal_sekolah}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">Kelas</p><p style="font-weight:500;">${p.kelas}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">No. HP Ortu</p><p style="font-weight:500;">${p.no_hp_ortu || '-'}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">Lomba</p><p style="font-weight:600;color:var(--accent);">${p.nama_lomba}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">No. Registrasi</p><p style="font-weight:500;">${p.nomor_registrasi}</p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">Status</p><p><span class="status-badge status-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></p></div>
        <div><p style="font-size:12px;color:var(--text-gray);">Tanggal Daftar</p><p style="font-weight:500;">${new Date(p.created_at).toLocaleDateString('id-ID')}</p></div>
      </div>
      ${p.alasan_penolakan ? `<p style="margin-top:16px;color:var(--red);font-size:13px;"><strong>Alasan Penolakan:</strong> ${p.alasan_penolakan}</p>` : ''}
    `;
    document.getElementById('detailModal').style.display = 'flex';
  } catch (err) { showToast(err.message, 'error'); }
}

async function verifyFromModal() {
  if (!currentDetailId) return;
  try {
    await apiFetch('/pendaftaran/' + currentDetailId + '/verifikasi', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'terverifikasi' }),
    });
    showToast('Pendaftaran berhasil diverifikasi.');
    closeModal('detailModal');
    loadPesertaTable();
  } catch (err) { showToast(err.message, 'error'); }
}

async function rejectFromModal() {
  if (!currentDetailId) return;
  const alasan = prompt('Masukkan alasan penolakan:');
  if (!alasan) return;
  try {
    await apiFetch('/pendaftaran/' + currentDetailId + '/verifikasi', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ditolak', alasan_penolakan: alasan }),
    });
    showToast('Pendaftaran ditolak.');
    closeModal('detailModal');
    loadPesertaTable();
  } catch (err) { showToast(err.message, 'error'); }
}

// ==========================================
// Peserta Dashboard
// ==========================================
async function initPesertaDashboard() {
  const user = requireLogin('peserta');
  if (!user) return;

  // Set nav/sidebar info
  const initial = user.nama ? user.nama.charAt(0).toUpperCase() : 'P';
  ['pdNavAvatar', 'pdSideAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initial;
  });
  const nameEl = document.getElementById('pdNavName');
  if (nameEl) nameEl.textContent = user.nama;
  const sideNameEl = document.getElementById('pdSideName');
  if (sideNameEl) sideNameEl.textContent = user.nama;
  const schoolEl = document.getElementById('pdSideSchool');
  if (schoolEl) schoolEl.textContent = user.asal_sekolah || '-';

  // Welcome banner
  const welcomeH2 = document.querySelector('.welcome-text h2');
  if (welcomeH2) welcomeH2.textContent = `Selamat datang, ${user.nama}!`;
  const welcomeP = document.querySelector('.welcome-text p');
  if (welcomeP) welcomeP.textContent = 'Pantau status pendaftaran dan ikuti lomba terbaru.';

  // Profile data
  const dataName = document.getElementById('dataName');
  if (dataName) dataName.textContent = user.nama;
  const dataKelas = document.getElementById('dataKelas');
  if (dataKelas) dataKelas.textContent = user.kelas || '-';
  const dataSekolah = document.getElementById('dataSekolah');
  if (dataSekolah) dataSekolah.textContent = user.asal_sekolah || '-';
  const dataNisn = document.getElementById('dataNisn');
  if (dataNisn) dataNisn.textContent = user.nisn || '-';

  // Edit profile form
  const editName = document.getElementById('editName');
  if (editName) editName.value = user.nama;
  const editSekolah = document.getElementById('editSekolah');
  if (editSekolah) editSekolah.value = user.asal_sekolah || '';
  const editKelas = document.getElementById('editKelas');
  if (editKelas) editKelas.value = user.kelas || '';
  const editNisn = document.getElementById('editNisn');
  if (editNisn) editNisn.value = user.nisn || '';

  // Load pendaftaran
  try {
    const res = await apiFetch('/peserta/me/pendaftaran');
    const pendaftaran = res.data;

    // Stats
    const pstatValues = document.querySelectorAll('.pstat-value');
    if (pstatValues[0]) pstatValues[0].textContent = pendaftaran.length;
    if (pstatValues[1]) {
      const statuses = [...new Set(pendaftaran.map(p => p.status))];
      if (statuses.length === 1) {
        pstatValues[1].textContent = statuses[0].charAt(0).toUpperCase() + statuses[0].slice(1);
        pstatValues[1].style.color = statuses[0] === 'terverifikasi' ? 'var(--green)' : statuses[0] === 'ditolak' ? 'var(--red)' : 'var(--yellow)';
      } else {
        pstatValues[1].textContent = `${statuses.length} status`;
        pstatValues[1].style.fontSize = '1rem';
      }
    }

    // Lomba cards
    const grid = document.getElementById('lombaCardsGrid');
    if (grid) {
      if (pendaftaran.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-gray);padding:24px;">Belum ada lomba yang diikuti. <a href="registrasi.html">Daftar sekarang!</a></p>';
      } else {
        grid.innerHTML = pendaftaran.slice(0, 4).map(p => {
          const badgeStyle = p.status === 'terverifikasi' ? 'background:var(--green);' :
                            p.status === 'ditolak' ? 'background:var(--red);' : 'background:var(--yellow);color:black;';
          const badgeText = p.status.charAt(0).toUpperCase() + p.status.slice(1);
          return `
            <div class="lomba-card-ui">
              <div class="lomba-img" style="background:linear-gradient(135deg,#1E40AF,#3B82F6);">
                <span class="lomba-badge" style="${badgeStyle}">${badgeText}</span>
              </div>
              <div class="lomba-card-content">
                <h4 class="lomba-title">${p.nama_lomba}</h4>
                <p class="lomba-date">${new Date(p.tanggal_pelaksanaan).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</p>
                <p style="font-size:12px;color:var(--text-gray);margin-bottom:12px;">No. Reg: ${p.nomor_registrasi}</p>
                <button class="btn-detail" onclick="window.location.href='lomba-saya.html'">Lihat Detail</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    showToast('Gagal memuat data: ' + err.message, 'error');
  }
}

function toggleEditProfile() {
  document.getElementById('editProfileModal').style.display = 'flex';
}

async function saveProfile() {
  try {
    const res = await apiFetch('/peserta/me', {
      method: 'PUT',
      body: JSON.stringify({
        nama: document.getElementById('editName').value.trim(),
        asal_sekolah: document.getElementById('editSekolah').value.trim(),
        kelas: document.getElementById('editKelas').value.trim(),
        nisn: document.getElementById('editNisn').value.trim(),
      }),
    });
    setAuth(getToken(), { ...getUser(), ...res.data });
    showToast('Profil berhasil diperbarui.');
    closeModal('editProfileModal');
    initPesertaDashboard();
  } catch (err) { showToast(err.message, 'error'); }
}

// ==========================================
// Lomba Saya Page
// ==========================================
let lombaSayaAll = [];
let lombaSayaFilter = '';

async function initLombaSaya() {
  const user = requireLogin('peserta');
  if (!user) return;

  const initial = user.nama ? user.nama.charAt(0).toUpperCase() : 'P';
  const navAvatar = document.getElementById('lsNavAvatar');
  if (navAvatar) navAvatar.textContent = initial;
  const navName = document.getElementById('lsNavName');
  if (navName) navName.textContent = user.nama;

  try {
    const res = await apiFetch('/peserta/me/pendaftaran');
    lombaSayaAll = res.data;
    renderLombaSaya();
  } catch (err) {
    document.getElementById('lombaSayaList').innerHTML = '<div class="ls-empty">Gagal memuat data.</div>';
  }
}

function filterLombaSaya(status, btn) {
  lombaSayaFilter = status;
  document.querySelectorAll('.ls-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderLombaSaya();
}

function renderLombaSaya() {
  const list = document.getElementById('lombaSayaList');
  const filtered = lombaSayaFilter ? lombaSayaAll.filter(p => p.status === lombaSayaFilter) : lombaSayaAll;

  if (filtered.length === 0) {
    list.innerHTML = '<div class="ls-empty">Tidak ada pendaftaran ditemukan.</div>';
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="ls-card">
      <div class="ls-card-info">
        <h4>${p.nama_lomba}</h4>
        <div class="ls-card-meta">
          <span>${p.pelaksana}</span>
          <span>${new Date(p.tanggal_pelaksanaan).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</span>
        </div>
        ${p.alasan_penolakan ? `<p class="ls-alasan">Alasan: ${p.alasan_penolakan}</p>` : ''}
      </div>
      <div class="ls-card-right">
        <span class="status-badge status-${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
        <span class="ls-noreg">${p.nomor_registrasi}</span>
      </div>
    </div>
  `).join('');
}

// ==========================================
// Init on page load
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.endsWith('admin-dashboard.html')) {
    initAdminDashboard();
  } else if (path.endsWith('admin-peserta.html')) {
    initAdminPeserta();
  } else if (path.endsWith('peserta-dashboard.html')) {
    initPesertaDashboard();
  } else if (path.endsWith('registrasi.html')) {
    initRegistrasi();
  } else if (path.endsWith('lomba-saya.html')) {
    initLombaSaya();
  }
});
