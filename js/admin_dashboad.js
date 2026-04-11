/* SAMPLE DATA */
const members = [
  { name: 'Juan Dela Cruz',    id: 2055, status: 'Active',    contrib: '₱250.00', date: 'Oct 21' },
  { name: 'Maria Santos',      id: 1138, status: 'Active',    contrib: '₱250.00', date: 'Oct 21' },
  { name: 'Pedro Reyes',       id: 3301, status: 'Inactive',  contrib: '₱100.00', date: 'Sep 15' },
  { name: 'Ana Lim',           id: 892, status: 'Active',    contrib: '₱250.00', date: 'Oct 21' },
  { name: 'Carlos Navarro',    id: 4412, status: 'Suspended', contrib: '₱0.00',   date: 'Aug 01' },
  { name: 'Rosario Bautista',  id: 2278, status: 'Active',    contrib: '₱250.00', date: 'Oct 20' },
  { name: 'Emmanuel Torres',   id: 5503, status: 'Suspended', contrib: '₱0.00',   date: 'Jul 14' },
  { name: 'Ligaya Flores',     id: 6617, status: 'Active',    contrib: '₱250.00', date: 'Oct 21' },
];

function badgeClass(s) {
  if (s === 'Active') return 'badge-active';
  if (s === 'Inactive') return 'badge-inactive';
  return 'badge-suspended';
}

function renderRoster(list) {
  const tbody = document.getElementById('roster-body');
  tbody.innerHTML = list.map(m => `
    <tr>
      <td><div class="member-name">${m.name}</div><div class="member-id">Member ID · #${m.id}</div></td>
      <td>#${m.id}</span></td>
      <td><span class="badge ${badgeClass(m.status)}">${m.status}</span></span></td>
      <td>${m.contrib} <span style="color:var(--text-light);font-size:11px">· ${m.date}</span></span></td>
      <td><button class="btn-edit" onclick="openModal('${m.name}', ${m.id}, '${m.status}', '${m.contrib.replace('₱','')}')">Edit</button></span></td>
    </tr>
  `).join('');
}

renderRoster(members);

document.getElementById('member-search').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  renderRoster(members.filter(m => m.name.toLowerCase().includes(q) || String(m.id).includes(q)));
});

/* PAGE SWITCHING */
function switchPage(page) {
  document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const btn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (btn) btn.classList.add('active');
}

document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

/* MODAL */
function openModal(name, id, status, contrib) {
  document.getElementById('modal-name').textContent = `${name} (#${id})`;
  document.getElementById('modal-body').value = id;
  document.getElementById('modal-contrib').value = contrib;
  const sel = document.getElementById('modal-status');
  [...sel.options].forEach(o => o.selected = o.text.startsWith(status));
  document.getElementById('edit-modal').classList.add('open');
}

document.getElementById('modal-cancel').onclick = () =>
  document.getElementById('edit-modal').classList.remove('open');
document.getElementById('modal-save').onclick = () => {
  document.getElementById('edit-modal').classList.remove('open');
  showToast('Member profile updated successfully.');
};
document.getElementById('edit-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

/* PHOTO UPLOAD */
document.getElementById('lf-file-input').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const area = document.getElementById('lf-photo-area');
    let img = area.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      area.appendChild(img);
    }
    img.src = e.target.result;
    area.classList.add('has-image');
    area.querySelectorAll('.photo-icon,.photo-tap,.photo-hint').forEach(el => el.style.display = 'none');
  };
  reader.readAsDataURL(file);
});

/* SUBMIT LOST & FOUND */
let lfItems = [
  { name: 'Black Leather Wallet', body: '2045', date: 'Oct 22', status: 'Pending' },
  { name: 'Samsung Galaxy A54',   body: '1138', date: 'Oct 20', status: 'Claimed' },
  { name: "Child's Red Backpack", body: '3301', date: 'Oct 19', status: 'Pending' },
  { name: 'Silver Wristwatch',    body: '0892', date: 'Oct 18', status: 'Pending' },
];

const itemIcons = [
  `<svg width="22" height="22" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  `<svg width="22" height="22" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
];

function submitLostFound() {
  const name = document.getElementById('lf-item-name').value.trim();
  const body = document.getElementById('lf-body-num').value.trim();
  const date = document.getElementById('lf-date').value;
  if (!name) { document.getElementById('lf-item-name').focus(); return; }

  const photoArea = document.getElementById('lf-photo-area');
  const img = photoArea.querySelector('img');
  const thumbHTML = img
    ? `<img src="${img.src}" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>`
    : itemIcons[Math.floor(Math.random() * itemIcons.length)];

  const dateLabel = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today';

  const row = document.createElement('div');
  row.className = 'lf-item-row';
  row.innerHTML = `
    <div class="lf-item-thumb">${thumbHTML}</div>
    <div class="lf-item-info">
      <div class="lf-item-name">${name}</div>
      <div class="lf-item-meta">Body #${body || '—'} &nbsp;•&nbsp; Found ${dateLabel}</div>
    </div>
    <div class="lf-item-status status-pending">Pending</div>
  `;
  document.getElementById('lf-items-container').prepend(row);

  /* reset form */
  document.getElementById('lf-item-name').value = '';
  document.getElementById('lf-body-num').value = '';
  document.getElementById('lf-date').value = '';
  photoArea.classList.remove('has-image');
  if (img) img.remove();
  photoArea.querySelectorAll('.photo-icon,.photo-tap,.photo-hint').forEach(el => el.style.display = '');
  document.getElementById('lf-file-input').value = '';

  showToast(`"${name}" posted to bulletin.`);
}

/* TOAST */
function showToast(msg) {
  const toast = document.getElementById('lf-toast');
  document.getElementById('lf-toast-msg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

/* DRIVERS REGISTRY */
const driverAvatarColors = ['#c0392b','#e67e22','#2980b9','#27ae60','#8e44ad','#16a085'];
const driverData = [
  { fname:'Antonio', lname:'Santos',    id:'ID-2024-0089', body:'345', status:'Active',    contact:'+63 917 555 1234' },
  { fname:'Maria Clara', lname:'D.',    id:'ID-2024-0042', body:'102', status:'Inactive',  contact:'+63 920 888 4321' },
  { fname:'Ricardo', lname:'Gomez',     id:'ID-2023-1102', body:'556', status:'Suspended', contact:'+63 905 121 9900' },
  { fname:'Juan', lname:'Dela Cruz',    id:'ID-2024-0211', body:'088', status:'Active',    contact:'+63 944 322 1111' },
  { fname:'Nestor', lname:'Villanueva', id:'ID-2023-0554', body:'221', status:'Active',    contact:'+63 912 344 5678' },
  { fname:'Cynthia', lname:'Ramos',     id:'ID-2024-0318', body:'413', status:'Active',    contact:'+63 918 765 4321' },
  { fname:'Rodrigo', lname:'Estrada',   id:'ID-2022-1045', body:'678', status:'Suspended', contact:'+63 922 111 2233' },
  { fname:'Lourdes', lname:'Mendoza',   id:'ID-2024-0101', body:'309', status:'Inactive',  contact:'+63 933 987 6543' },
];

const DR_PER_PAGE = 4;
let drPage = 1;
let drData = [...driverData];
let drEditIdx = null;

function drStatusClass(s) {
  return s === 'Active' ? 'active' : s === 'Inactive' ? 'inactive' : 'suspended';
}

function drInitials(d) {
  return (d.fname[0] + d.lname[0]).toUpperCase();
}

function renderDrivers() {
  const total = drData.length;
  const pages = Math.ceil(total / DR_PER_PAGE);
  const start = (drPage - 1) * DR_PER_PAGE;
  const slice = drData.slice(start, start + DR_PER_PAGE);

  const tbody = document.getElementById('driver-table-body');
  tbody.innerHTML = slice.map((d, i) => {
    const sc = drStatusClass(d.status);
    const color = driverAvatarColors[(start + i) % driverAvatarColors.length];
    return `
      <tr>
        <td>
          <div class="dr-member-cell">
            <div class="dr-avatar" style="background:${color};color:white;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700">
              ${drInitials(d)}
            </div>
            <div>
              <div class="dr-member-name">${d.fname}<br>${d.lname}</div>
              <div class="dr-member-id">${d.id}</div>
            </div>
          </div>
         </span>
        <td><span class="dr-body-tag">#${d.body}</span></span>
        <td>
          <div class="dr-status">
            <div class="dr-status-dot ${sc}"></div>
            <div class="dr-status-label ${sc}">${d.status.toUpperCase()}</div>
          </div>
         </span>
        <td>
          <div class="dr-contact">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.38 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${d.contact}
          </div>
         </span>
        <td>
          <div class="dr-actions">
            <button class="dr-btn-edit" title="Edit" onclick="openDriverModal(${start + i})">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="dr-btn-del" title="Delete" onclick="deleteDriver(${start + i})">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
         </span>
      </tr>`;
  }).join('');

  document.getElementById('dr-showing').innerHTML =
    `Showing <strong>${start + 1} – ${Math.min(start + DR_PER_PAGE, total)}</strong> of <strong>${total}</strong> total members`;

  const pb = document.getElementById('dr-page-btns');
  pb.innerHTML = '';
  for (let p = 1; p <= pages; p++) {
    const b = document.createElement('button');
    b.className = 'dr-pg-num' + (p === drPage ? ' current' : '');
    b.textContent = p;
    b.onclick = () => { drPage = p; renderDrivers(); };
    pb.appendChild(b);
  }

  document.getElementById('dr-prev').disabled = drPage === 1;
  document.getElementById('dr-next').disabled = drPage >= pages;
}

function drChangePage(dir) {
  const pages = Math.ceil(drData.length / DR_PER_PAGE);
  drPage = Math.max(1, Math.min(pages, drPage + dir));
  renderDrivers();
}

function deleteDriver(idx) {
  drData.splice(idx, 1);
  if ((drPage - 1) * DR_PER_PAGE >= drData.length && drPage > 1) drPage--;
  renderDrivers();
  showToast('Driver removed from registry.');
}

function openDriverModal(idx) {
  drEditIdx = (idx !== undefined) ? idx : null;
  const isEdit = drEditIdx !== null;
  document.getElementById('driver-modal-title').textContent = isEdit ? 'Edit Driver Profile' : 'Add New Driver';
  document.getElementById('driver-modal-sub').textContent = isEdit
    ? `Editing record for ${drData[idx].fname} ${drData[idx].lname}.`
    : 'Fill in the details to register a new fleet member.';

  if (isEdit) {
    const d = drData[idx];
    document.getElementById('drv-fname').value = d.fname;
    document.getElementById('drv-lname').value = d.lname;
    document.getElementById('drv-body').value = d.body;
    document.getElementById('drv-contact').value = d.contact.replace('+63 ', '');
    const sel = document.getElementById('drv-status');
    [...sel.options].forEach(o => o.selected = o.text === d.status);
  } else {
    ['drv-fname','drv-lname','drv-body','drv-contact'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('drv-status').selectedIndex = 0;
  }
  document.getElementById('driver-modal').classList.add('open');
}

function saveDriver() {
  const fname   = document.getElementById('drv-fname').value.trim();
  const lname   = document.getElementById('drv-lname').value.trim();
  const body    = document.getElementById('drv-body').value.trim();
  const contact = document.getElementById('drv-contact').value.trim();
  const status  = document.getElementById('drv-status').value;
  if (!fname || !lname) { document.getElementById('drv-fname').focus(); return; }

  const entry = {
    fname, lname,
    id: `ID-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`,
    body: body || '---',
    status,
    contact: contact ? `+63 ${contact}` : '—'
  };

  if (drEditIdx !== null) {
    drData[drEditIdx] = { ...drData[drEditIdx], ...entry };
    showToast('Driver profile updated.');
  } else {
    drData.unshift(entry);
    drPage = 1;
    showToast(`${fname} ${lname} added to registry.`);
  }

  document.getElementById('driver-modal').classList.remove('open');
  renderDrivers();
}

document.getElementById('driver-modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('open');
});

renderDrivers();

/* ANNOUNCEMENTS */
let annPosts = [
  {
    id: 1, type: 'emergency', title: 'Road Maintenance: J. Rizal Ave.',
    body: 'Expect heavy traffic due to drainage repairs starting Oct 20. Drivers are advised to take alternative routes via Mabini St.',
    time: 'Oct 24, 09:45 AM', author: 'Admin Command'
  },
  {
    id: 2, type: 'operational', title: 'Fare Adjustment — Effective Oct 25',
    body: 'Base fare has been updated to ₱15.00 per passenger for the first 2 kilometers. All drivers must comply immediately.',
    time: 'Oct 23, 02:00 PM', author: 'Admin Juan Dela Cruz'
  },
  {
    id: 3, type: 'meeting', title: 'Election of Officers 2024 — MANDATORY',
    body: 'General Assembly for election of officers will be held at Brgy. Hall Multi-Purpose Court on Oct 24 at 09:00 AM. Attendance is mandatory.',
    time: 'Oct 21, 11:00 AM', author: 'Secretary Ramos'
  },
  {
    id: 4, type: 'general', title: 'Reminder: Quarterly Contribution Deadline',
    body: 'All members are reminded that Q4 contributions are due by Oct 31. Failure to pay will result in temporary suspension of driving privileges.',
    time: 'Oct 19, 08:30 AM', author: 'Treasurer Flores'
  }
];
let annNextId = 5;

function renderAnnPosts() {
  const container = document.getElementById('ann-posts-list');
  if (!container) return;
  container.innerHTML = annPosts.map(p => `
    <div class="ann-post-item" id="ann-post-${p.id}">
      <div class="ann-post-top">
        <span class="ann-post-badge ${p.type}">${p.type.charAt(0).toUpperCase() + p.type.slice(1)}</span>
        <button class="ann-post-del" onclick="deleteAnnouncement(${p.id})" title="Delete">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
      <div class="ann-post-title">${p.title}</div>
      <div class="ann-post-body">${p.body}</div>
      <div class="ann-post-foot">
        <div class="ann-post-time">${p.time}</div>
        <div class="ann-post-author">by ${p.author}</div>
      </div>
    </div>
  `).join('');

  const countEl = document.getElementById('ann-count');
  if (countEl) countEl.textContent = `${annPosts.length} active`;
}

function deleteAnnouncement(id) {
  annPosts = annPosts.filter(p => p.id !== id);
  renderAnnPosts();
  showToast('Announcement removed from bulletin.');
}

function postAnnouncement() {
  const title = document.getElementById('ann-new-title').value.trim();
  const body  = document.getElementById('ann-new-body').value.trim();
  const type  = document.getElementById('ann-new-type').value;
  if (!title) { document.getElementById('ann-new-title').focus(); return; }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month:'short', day:'numeric' }) +
    ', ' + now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

  annPosts.unshift({ id: annNextId++, type, title, body: body || '—', time: dateStr, author: 'Admin' });
  renderAnnPosts();

  document.getElementById('ann-new-title').value = '';
  document.getElementById('ann-new-body').value = '';
  document.getElementById('ann-new-type').selectedIndex = 0;
  showToast(`"${title}" posted to bulletin.`);
}

renderAnnPosts();

/* OFFICERS MANAGEMENT */
const officerAvatarColors = ['#7a0c0c','#2980b9','#27ae60','#8e44ad','#16a085','#e67e22','#c0392b','#1a5276'];

let officerData = [
  { fname:'Roberto', mi:'V.', lname:'Macaspac', id:'TODA-001', role:'President',      status:'on-duty',  phone:'+63 917 555 0001', email:'president@toda.ph' },
  { fname:'Carmelita', mi:'S.', lname:'Reyes',   id:'TODA-002', role:'Vice President', status:'in-office', phone:'+63 917 555 0002', email:'vp@toda.ph' },
  { fname:'Antonio', mi:'G.', lname:'Luna',      id:'TODA-003', role:'Secretary',      status:'on-duty',  phone:'+63 917 555 0003', email:'secretary@toda.ph' },
  { fname:'Maria', mi:'D.', lname:'Santos',      id:'TODA-004', role:'Treasurer',      status:'in-office', phone:'+63 917 555 0004', email:'treasurer@toda.ph' },
  { fname:'Jose', mi:'R.', lname:'Flores',       id:'TODA-005', role:'Auditor',        status:'off-duty', phone:'+63 917 555 0005', email:'auditor@toda.ph' },
  { fname:'Elena', mi:'C.', lname:'Cruz',        id:'TODA-006', role:'PRO',            status:'on-duty',  phone:'+63 917 555 0006', email:'pro@toda.ph' },
];
let offEditIdx = null;
let offDeleteIdx = null;
let offNextId = 7;
let offView = 'grid';

function offStatusLabel(s) {
  if (s === 'on-duty') return 'ON-DUTY';
  if (s === 'in-office') return 'IN OFFICE';
  return 'OFF-DUTY';
}

function offInitials(o) {
  return (o.fname[0] + o.lname[0]).toUpperCase();
}

function renderOfficers() {
  const container = document.getElementById('off-grid-container');
  if (!container) return;

  document.getElementById('off-total-num').textContent = officerData.length;

  container.className = 'off-grid' + (offView === 'list' ? ' list-view' : '');
  container.innerHTML = officerData.map((o, i) => {
    const color = officerAvatarColors[i % officerAvatarColors.length];
    const statusClass = o.status;
    const statusLbl = offStatusLabel(o.status);
    return `
      <div class="off-card">
        <div class="off-card-top">
          <span class="off-status-chip ${statusClass}">
            <span class="off-chip-dot"></span>
            ${statusLbl}
          </span>
          <span class="off-card-id">ID: ${o.id}</span>
        </div>
        <div class="off-avatar-area">
          <div class="off-avatar">
            <div class="off-avatar-initials" style="background:${color}">${offInitials(o)}</div>
          </div>
          <div>
            <div class="off-name">${o.fname} ${o.mi} ${o.lname}</div>
            <div class="off-role">${o.role}</div>
          </div>
        </div>
        <div class="off-card-actions with-contact">
          <button class="off-btn edit-btn" onclick="openOfficerModal(${i})">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="off-btn del-btn" onclick="openOfficerConfirm(${i})">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Remove
          </button>
        </div>
        <div class="off-contact-row">
          <button class="off-btn call-btn" onclick="showToast('Calling ${o.fname} ${o.lname}…')">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.87a16 16 0 0 0 6.29 6.29l1.08-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </button>
          <button class="off-btn email-btn" onclick="showToast('Opening email to ${o.fname} ${o.lname}…')">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function setOfficerView(v) {
  offView = v;
  document.getElementById('off-grid-btn').classList.toggle('active', v === 'grid');
  document.getElementById('off-list-btn').classList.toggle('active', v === 'list');
  renderOfficers();
}

function openOfficerModal(idx) {
  offEditIdx = (idx !== undefined) ? idx : null;
  const isEdit = offEditIdx !== null;
  document.getElementById('off-modal-title').textContent = isEdit ? 'Edit Officer Profile' : 'Add New Officer';
  document.getElementById('off-modal-sub').textContent = isEdit
    ? `Editing record for ${officerData[idx].fname} ${officerData[idx].lname}.`
    : 'Register a new official into the current term.';
  document.getElementById('off-save-label').textContent = isEdit ? 'Save Changes' : 'Register Officer';

  if (isEdit) {
    const o = officerData[idx];
    document.getElementById('off-fname').value = o.fname;
    document.getElementById('off-mi').value = o.mi;
    document.getElementById('off-lname').value = o.lname;
    document.getElementById('off-id').value = o.id;
    document.getElementById('off-role').value = o.role;
    document.getElementById('off-status').value = o.status;
    document.getElementById('off-phone').value = o.phone.replace('+63 ', '');
    document.getElementById('off-email').value = o.email;
  } else {
    ['off-fname','off-mi','off-lname','off-phone','off-email'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('off-id').value = `TODA-${String(offNextId).padStart(3,'0')}`;
    document.getElementById('off-role').selectedIndex = 0;
    document.getElementById('off-status').selectedIndex = 0;
  }
  document.getElementById('officer-modal').classList.add('open');
}

function closeOfficerModal() {
  document.getElementById('officer-modal').classList.remove('open');
}

function saveOfficer() {
  const fname  = document.getElementById('off-fname').value.trim();
  const mi     = document.getElementById('off-mi').value.trim();
  const lname  = document.getElementById('off-lname').value.trim();
  const role   = document.getElementById('off-role').value;
  const status = document.getElementById('off-status').value;
  const phone  = document.getElementById('off-phone').value.trim();
  const email  = document.getElementById('off-email').value.trim();

  if (!fname || !lname) {
    document.getElementById('off-fname').focus();
    return;
  }

  const entry = {
    fname, mi, lname,
    id: offEditIdx !== null ? officerData[offEditIdx].id : `TODA-${String(offNextId).padStart(3,'0')}`,
    role, status,
    phone: phone ? `+63 ${phone}` : '—',
    email: email || '—'
  };

  if (offEditIdx !== null) {
    officerData[offEditIdx] = entry;
    showToast(`${fname} ${lname}'s profile updated.`);
  } else {
    officerData.push(entry);
    offNextId++;
    showToast(`${fname} ${lname} added to the council.`);
  }

  closeOfficerModal();
  renderOfficers();
}

function openOfficerConfirm(idx) {
  offDeleteIdx = idx;
  const o = officerData[idx];
  document.getElementById('off-confirm-sub').textContent =
    `Are you sure you want to remove ${o.fname} ${o.lname} (${o.role}) from the current term? This action cannot be undone.`;
  document.getElementById('officer-confirm').classList.add('open');
}

function closeOfficerConfirm() {
  document.getElementById('officer-confirm').classList.remove('open');
  offDeleteIdx = null;
}

function confirmDeleteOfficer() {
  if (offDeleteIdx === null) return;
  const name = `${officerData[offDeleteIdx].fname} ${officerData[offDeleteIdx].lname}`;
  officerData.splice(offDeleteIdx, 1);
  closeOfficerConfirm();
  renderOfficers();
  showToast(`${name} removed from the council.`);
}

document.getElementById('officer-modal').addEventListener('click', function(e) {
  if (e.target === this) closeOfficerModal();
});
document.getElementById('officer-confirm').addEventListener('click', function(e) {
  if (e.target === this) closeOfficerConfirm();
});

renderOfficers();

/* TRICYCLE CODING PAGE */
let tcData = [
  { day:'Mon / Wed', bodyRange:'0 – 2', time:'7:00 AM – 7:00 PM', status:'active',    route:'All Routes',       effectivity:'2024-01-15' },
  { day:'Tue / Thu', bodyRange:'3 – 5', time:'7:00 AM – 7:00 PM', status:'active',    route:'All Routes',       effectivity:'2024-01-15' },
  { day:'Friday',    bodyRange:'6 – 7', time:'7:00 AM – 7:00 PM', status:'active',    route:'All Routes',       effectivity:'2024-01-15' },
  { day:'Saturday',  bodyRange:'8 – 9', time:'7:00 AM – 7:00 PM', status:'active',    route:'Town Proper only', effectivity:'2024-01-15' },
  { day:'Sunday',    bodyRange:'ALL',   time:'Open All Day',       status:'open-win',  route:'All Routes',       effectivity:'2024-01-15' },
];
let tcEditIdx = null;
let tcDeleteIdx = null;

const tcStatusLabels = { 'active':'Active', 'suspended':'Suspended', 'open-win':'Open Window' };

function renderCoding() {
  const tbody = document.getElementById('tc-table-body');
  if (!tbody) return;

  document.getElementById('tc-total').textContent = tcData.length;

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = dayNames[new Date().getDay()];
  const todaySchedules = tcData.filter(t => t.day === today || t.day.includes(today.substring(0,3)));
  const todayEl = document.getElementById('tc-today-label');
  const todayDetail = document.getElementById('tc-today-detail');
  const todayTime = document.getElementById('tc-today-time');
  if (todayEl) {
    if (todaySchedules.length) {
      todayEl.textContent = `Today (${today}) — Restricted Body Numbers:`;
      todayDetail.textContent = todaySchedules.map(t => t.bodyRange).join(', ');
      todayTime.textContent = todaySchedules[0].time;
      document.getElementById('tc-active-today').textContent = todaySchedules.map(t=>t.bodyRange).join(', ');
    } else {
      todayEl.textContent = `Today (${today})`;
      todayDetail.textContent = 'No Restriction';
      todayTime.textContent = 'All body numbers may operate freely';
      document.getElementById('tc-active-today').textContent = 'None';
    }
  }

  tbody.innerHTML = tcData.map((t, i) => {
    const isToday = t.day === today || t.day.includes(today.substring(0,3));
    const statusClass = t.status;
    const statusLabel = tcStatusLabels[t.status] || t.status;
    const bodyDisplay = t.bodyRange === 'ALL'
      ? `<span class="tc-body-tag open">ALL OPEN</span>`
      : `<span class="tc-body-tag">${t.bodyRange}</span>`;
    return `<tr>
      <td>
        <div class="tc-day-cell">
          <div class="tc-day-icon ${isToday ? 'active-day' : ''}">
            <svg width="14" height="14" fill="none" stroke="${isToday ? 'white' : 'var(--crimson)'}" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div class="tc-day-name">${t.day}</div>
            <div class="tc-day-type">${isToday ? '🔴 TODAY' : 'Scheduled'}</div>
          </div>
        </div>
       </span>
      <td>${bodyDisplay}</span>
      <td style="font-size:13px;color:var(--text-body)">${t.time}</span>
      <td><span class="tc-status-pill ${statusClass}">${statusLabel}</span></span>
      <td>
        <div class="tc-actions">
          <button class="tc-btn-edit" onclick="openCodingModal(${i})" title="Edit">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="tc-btn-del" onclick="openCodingConfirm(${i})" title="Delete">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
       </span>
    </tr>`;
  }).join('');
}

function openCodingModal(idx) {
  tcEditIdx = (idx !== undefined) ? idx : null;
  const isEdit = tcEditIdx !== null;
  document.getElementById('tc-modal-title').textContent = isEdit ? 'Edit Coding Schedule' : 'Add Coding Schedule';
  document.getElementById('tc-modal-sub').textContent = isEdit ? 'Update this coding window.' : 'Define an operational window for a body number range.';
  document.getElementById('tc-save-label').textContent = isEdit ? 'Save Changes' : 'Add Schedule';
  if (isEdit) {
    const t = tcData[idx];
    document.getElementById('tc-day').value = t.day;
    document.getElementById('tc-status').value = t.status;
    document.getElementById('tc-body-range').value = t.bodyRange;
    document.getElementById('tc-time').value = t.time;
    document.getElementById('tc-route').value = t.route;
    document.getElementById('tc-effectivity').value = t.effectivity;
  } else {
    document.getElementById('tc-day').selectedIndex = 0;
    document.getElementById('tc-status').selectedIndex = 0;
    ['tc-body-range','tc-time','tc-route','tc-effectivity'].forEach(id => document.getElementById(id).value = '');
  }
  document.getElementById('coding-modal').classList.add('open');
}

function closeCodingModal() {
  document.getElementById('coding-modal').classList.remove('open');
}

function saveCodingSchedule() {
  const day         = document.getElementById('tc-day').value;
  const status      = document.getElementById('tc-status').value;
  const bodyRange   = document.getElementById('tc-body-range').value.trim();
  const time        = document.getElementById('tc-time').value.trim();
  const route       = document.getElementById('tc-route').value.trim();
  const effectivity = document.getElementById('tc-effectivity').value;
  if (!bodyRange) { document.getElementById('tc-body-range').focus(); return; }
  const entry = { day, bodyRange, time: time || 'Not specified', status, route: route || 'All Routes', effectivity };
  if (tcEditIdx !== null) {
    tcData[tcEditIdx] = entry;
    showToast('Coding schedule updated.');
  } else {
    tcData.push(entry);
    showToast(`Coding schedule for ${day} added.`);
  }
  closeCodingModal();
  renderCoding();
}

function openCodingConfirm(idx) {
  tcDeleteIdx = idx;
  document.getElementById('coding-confirm-sub').textContent =
    `Delete the coding schedule for ${tcData[idx].day} (Body Nos. ${tcData[idx].bodyRange})?`;
  document.getElementById('coding-confirm').classList.add('open');
}

function closeCodingConfirm() {
  document.getElementById('coding-confirm').classList.remove('open');
  tcDeleteIdx = null;
}

function confirmDeleteCoding() {
  if (tcDeleteIdx === null) return;
  const label = `${tcData[tcDeleteIdx].day} – Body ${tcData[tcDeleteIdx].bodyRange}`;
  tcData.splice(tcDeleteIdx, 1);
  closeCodingConfirm();
  renderCoding();
  showToast(`Schedule "${label}" deleted.`);
}

document.getElementById('coding-modal').addEventListener('click', function(e) { if (e.target===this) closeCodingModal(); });
document.getElementById('coding-confirm').addEventListener('click', function(e) { if (e.target===this) closeCodingConfirm(); });

renderCoding();

/* CONTRIBUTIONS PAGE */
const cnAvatarColors = ['#7a0c0c','#2980b9','#27ae60','#8e44ad','#16a085','#e67e22','#c0392b','#1a5276','#784212','#1f618d'];

let cnData = [
  { fname:'Juan',     lname:'Dela Cruz',   body:'345',  driverid:'ID-2024-0089', amount:250, period:'Oct 2024', date:'2024-10-21', status:'paid',    notes:'' },
  { fname:'Maria',    lname:'Santos',      body:'102',  driverid:'ID-2024-0042', amount:250, period:'Oct 2024', date:'2024-10-21', status:'paid',    notes:'' },
  { fname:'Pedro',    lname:'Reyes',       body:'556',  driverid:'ID-2023-1102', amount:100, period:'Oct 2024', date:'2024-10-10', status:'partial',  notes:'Balance due Oct 31' },
  { fname:'Ana',      lname:'Lim',         body:'088',  driverid:'ID-2024-0211', amount:250, period:'Oct 2024', date:'2024-10-21', status:'paid',    notes:'' },
  { fname:'Carlos',   lname:'Navarro',     body:'221',  driverid:'ID-2023-0554', amount:0,   period:'Oct 2024', date:'',           status:'unpaid',   notes:'Suspended — no collection' },
  { fname:'Rosario',  lname:'Bautista',    body:'413',  driverid:'ID-2024-0318', amount:250, period:'Oct 2024', date:'2024-10-20', status:'paid',    notes:'' },
  { fname:'Emmanuel', lname:'Torres',      body:'678',  driverid:'ID-2022-1045', amount:0,   period:'Oct 2024', date:'',           status:'unpaid',   notes:'Suspended — coding violation' },
  { fname:'Ligaya',   lname:'Flores',      body:'309',  driverid:'ID-2024-0101', amount:250, period:'Oct 2024', date:'2024-10-21', status:'paid',    notes:'' },
  { fname:'Roberto',  lname:'Magsaysay',   body:'512',  driverid:'ID-2024-0215', amount:150, period:'Oct 2024', date:'2024-10-18', status:'partial',  notes:'Installment' },
  { fname:'Lourdes',  lname:'Mendoza',     body:'731',  driverid:'ID-2024-0401', amount:250, period:'Oct 2024', date:'2024-10-22', status:'paid',    notes:'' },
  { fname:'Nestor',   lname:'Villanueva',  body:'890',  driverid:'ID-2023-0554', amount:250, period:'Sep 2024', date:'2024-09-19', status:'paid',    notes:'' },
  { fname:'Cynthia',  lname:'Ramos',       body:'044',  driverid:'ID-2024-0318', amount:250, period:'Sep 2024', date:'2024-09-20', status:'paid',    notes:'' },
];
const CN_PER_PAGE = 8;
let cnPage = 1;
let cnEditIdx = null;
let cnDeleteIdx = null;
let cnFiltered = [...cnData];

function cnInitials(r) { return (r.fname[0] + r.lname[0]).toUpperCase(); }

function cnAmountClass(r) {
  if (r.status === 'paid') return 'paid';
  if (r.status === 'partial') return 'partial';
  return 'unpaid';
}

function cnFormatDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function cnUpdateSummary() {
  const paid    = cnData.filter(r => r.status === 'paid');
  const partial = cnData.filter(r => r.status === 'partial');
  const unpaid  = cnData.filter(r => r.status === 'unpaid');
  const total   = cnData.reduce((s, r) => s + Number(r.amount), 0);
  document.getElementById('cn-total-amount').textContent = '₱' + total.toLocaleString('en-PH', {minimumFractionDigits:2});
  document.getElementById('cn-paid-count').textContent = paid.length;
  document.getElementById('cn-paid-num').textContent = paid.length;
  document.getElementById('cn-partial-num').textContent = partial.length;
  document.getElementById('cn-unpaid-num').textContent = unpaid.length;
}

function cnFilterRender() {
  const q       = (document.getElementById('cn-search-input').value || '').toLowerCase();
  const fStatus = document.getElementById('cn-filter-status').value;
  const fPeriod = document.getElementById('cn-filter-period').value;
  cnFiltered = cnData.filter(r => {
    const name = `${r.fname} ${r.lname} ${r.body} ${r.driverid}`.toLowerCase();
    return (!q || name.includes(q))
      && (!fStatus || r.status === fStatus)
      && (!fPeriod || r.period === fPeriod);
  });
  cnPage = 1;
  renderContributions();
}

function renderContributions() {
  cnUpdateSummary();
  const tbody = document.getElementById('cn-table-body');
  if (!tbody) return;
  const total = cnFiltered.length;
  const pages = Math.max(1, Math.ceil(total / CN_PER_PAGE));
  const start = (cnPage - 1) * CN_PER_PAGE;
  const slice = cnFiltered.slice(start, start + CN_PER_PAGE);

  tbody.innerHTML = slice.map((r) => {
    const realIdx = cnData.indexOf(r);
    const color = cnAvatarColors[realIdx % cnAvatarColors.length];
    const amtClass = cnAmountClass(r);
    return `<tr>
      <td>
        <div class="cn-driver-cell">
          <div class="cn-avatar" style="background:${color}">${cnInitials(r)}</div>
          <div>
            <div class="cn-driver-name">${r.fname} ${r.lname}</div>
            <div class="cn-driver-id">${r.driverid}</div>
          </div>
        </div>
       </span>
      <td><strong>#${r.body}</strong></span>
      <td><span class="cn-amount ${amtClass}">₱${Number(r.amount).toLocaleString('en-PH',{minimumFractionDigits:2})}</span></span>
      <td><span class="cn-period-badge">${r.period}</span></span>
      <td style="font-size:13px;color:var(--text-muted)">${cnFormatDate(r.date)}</span>
      <td>
        <span class="cn-pay-status ${r.status}">
          <span class="cn-pay-dot"></span>
          ${r.status.charAt(0).toUpperCase()+r.status.slice(1)}
        </span>
       </span>
      <td>
        <div class="cn-actions">
          <button class="cn-btn-edit" onclick="openCnModal(${realIdx})" title="Edit">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="cn-btn-del" onclick="openCnConfirm(${realIdx})" title="Delete">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
       </span>
    </tr>`;
  }).join('');

  document.getElementById('cn-showing').innerHTML =
    total ? `Showing <strong>${start+1}–${Math.min(start+CN_PER_PAGE,total)}</strong> of <strong>${total}</strong> records` : 'No records found';
  const pb = document.getElementById('cn-page-btns');
  pb.innerHTML = '';
  for (let p = 1; p <= pages; p++) {
    const b = document.createElement('button');
    b.className = 'cn-pg-num' + (p === cnPage ? ' current' : '');
    b.textContent = p;
    b.onclick = () => { cnPage = p; renderContributions(); };
    pb.appendChild(b);
  }
  document.getElementById('cn-prev').disabled = cnPage === 1;
  document.getElementById('cn-next').disabled = cnPage >= pages;
}

function cnChangePage(dir) {
  const pages = Math.max(1, Math.ceil(cnFiltered.length / CN_PER_PAGE));
  cnPage = Math.max(1, Math.min(pages, cnPage + dir));
  renderContributions();
}

function openCnModal(idx) {
  cnEditIdx = (idx !== undefined) ? idx : null;
  const isEdit = cnEditIdx !== null;
  document.getElementById('cn-modal-title').textContent = isEdit ? 'Edit Contribution' : 'Add Contribution';
  document.getElementById('cn-modal-sub').textContent = isEdit ? `Editing record for ${cnData[idx].fname} ${cnData[idx].lname}.` : 'Record a drivers contribution for the period.';
  document.getElementById('cn-save-label').textContent = isEdit ? 'Save Changes' : 'Save Record';
  if (isEdit) {
    const r = cnData[idx];
    document.getElementById('cn-fname').value = r.fname;
    document.getElementById('cn-lname').value = r.lname;
    document.getElementById('cn-body').value = r.body;
    document.getElementById('cn-driverid').value = r.driverid;
    document.getElementById('cn-amount').value = r.amount;
    document.getElementById('cn-period').value = r.period;
    document.getElementById('cn-date').value = r.date;
    document.getElementById('cn-paystatus').value = r.status;
    document.getElementById('cn-notes').value = r.notes;
  } else {
    ['cn-fname','cn-lname','cn-body','cn-driverid','cn-notes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('cn-amount').value = '250';
    document.getElementById('cn-period').selectedIndex = 0;
    document.getElementById('cn-paystatus').selectedIndex = 0;
    document.getElementById('cn-date').value = new Date().toISOString().split('T')[0];
  }
  document.getElementById('cn-modal').classList.add('open');
}

function closeCnModal() { document.getElementById('cn-modal').classList.remove('open'); }

function saveCnRecord() {
  const fname    = document.getElementById('cn-fname').value.trim();
  const lname    = document.getElementById('cn-lname').value.trim();
  const body     = document.getElementById('cn-body').value.trim();
  const driverid = document.getElementById('cn-driverid').value.trim();
  const amount   = parseFloat(document.getElementById('cn-amount').value) || 0;
  const period   = document.getElementById('cn-period').value;
  const date     = document.getElementById('cn-date').value;
  const status   = document.getElementById('cn-paystatus').value;
  const notes    = document.getElementById('cn-notes').value.trim();
  if (!fname || !lname) { document.getElementById('cn-fname').focus(); return; }
  const entry = { fname, lname, body: body||'—', driverid: driverid||'—', amount, period, date, status, notes };
  if (cnEditIdx !== null) {
    cnData[cnEditIdx] = entry;
    showToast(`${fname} ${lname}'s contribution updated.`);
  } else {
    cnData.unshift(entry);
    showToast(`Contribution for ${fname} ${lname} recorded.`);
  }
  closeCnModal();
  cnFiltered = [...cnData];
  cnPage = 1;
  renderContributions();
}

function openCnConfirm(idx) {
  cnDeleteIdx = idx;
  const r = cnData[idx];
  document.getElementById('cn-confirm-sub').textContent =
    `Delete contribution record for ${r.fname} ${r.lname} (${r.period})?`;
  document.getElementById('cn-confirm').classList.add('open');
}

function closeCnConfirm() {
  document.getElementById('cn-confirm').classList.remove('open');
  cnDeleteIdx = null;
}

function confirmDeleteCn() {
  if (cnDeleteIdx === null) return;
  const name = `${cnData[cnDeleteIdx].fname} ${cnData[cnDeleteIdx].lname}`;
  cnData.splice(cnDeleteIdx, 1);
  closeCnConfirm();
  cnFiltered = [...cnData];
  cnPage = 1;
  renderContributions();
  showToast(`Record for ${name} deleted.`);
}

document.getElementById('cn-modal').addEventListener('click', function(e) { if(e.target===this) closeCnModal(); });
document.getElementById('cn-confirm').addEventListener('click', function(e) { if(e.target===this) closeCnConfirm(); });

cnFiltered = [...cnData];
renderContributions();