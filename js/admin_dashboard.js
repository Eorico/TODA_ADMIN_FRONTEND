/* ============================================
   BASE / SHARED UTILITIES
   ============================================ */
class DashboardUtils {
    static showToast(msg) {
        let toast = document.getElementById('lf-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'lf-toast';
            toast.className = 'toast-notification';
            toast.innerHTML = `<span id="lf-toast-msg"></span>`;
            document.body.appendChild(toast);

            if (!document.querySelector('#toast-styles')) {
                const style = document.createElement('style');
                style.id = 'toast-styles';
                style.textContent = `
                    .toast-notification {
                        position: fixed;
                        bottom: 30px;
                        right: 30px;
                        background: #2c3e50;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        z-index: 10000;
                        opacity: 0;
                        transform: translateY(20px);
                        transition: all 0.3s ease;
                        pointer-events: none;
                    }
                    .toast-notification.show {
                        opacity: 1;
                        transform: translateY(0);
                    }
                `;
                document.head.appendChild(style);
            }
        }
        document.getElementById('lf-toast-msg').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3200);
    }

    static badgeClass(s) {
        if (s === 'Active') return 'badge-active';
        if (s === 'Inactive') return 'badge-inactive';
        return 'badge-suspended';
    }

    static getEl(id) {
        return document.getElementById(id);
    }

    static setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    static clearFields(ids) {
        ids.forEach(id => DashboardUtils.setVal(id, ''));
    }

    static openModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.add('open');
    }

    static closeModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.remove('open');
    }

    static bindOverlayClose(modalId, closeFn) {
        const modal = document.getElementById(modalId);
        if (modal) modal.onclick = function (e) {
            if (e.target === this) closeFn();
        };
    }
}

/* ============================================
   DASHBOARD STORE (global data)
   ============================================ */
class DashboardStore {
    constructor() {
        this.members = [
            { name: 'Juan Dela Cruz', id: 2055, status: 'Active', contrib: '₱250.00', date: 'Oct 21' },
            { name: 'Maria Santos',   id: 1138, status: 'Active', contrib: '₱250.00', date: 'Oct 21' },
        ];
        this.lfItems = [
            { name: 'Black Leather Wallet', body: '2045', date: 'Oct 22', status: 'Pending' },
            { name: 'Samsung Galaxy A54',   body: '1138', date: 'Oct 20', status: 'Claimed' },
        ];
        this.driverData = [
            { fname: 'Antonio',    lname: 'Santos', id: 'ID-2024-0089', body: '345', status: 'Active',   contact: '+63 917 555 1234' },
            { fname: 'Maria Clara', lname: 'D.',    id: 'ID-2024-0042', body: '102', status: 'Inactive', contact: '+63 920 888 4321' },
        ];
        this.annPosts = [
            { id: 1, type: 'emergency',   title: 'Road Maintenance: J. Rizal Ave.', body: 'Expect heavy traffic due to drainage repairs starting Oct 20. Drivers are advised to take alternative routes via Mabini St.', time: 'Oct 24, 09:45 AM', author: 'Admin Command' },
            { id: 2, type: 'operational', title: 'Fare Adjustment — Effective Oct 25', body: 'Base fare has been updated to ₱15.00 per passenger for the first 2 kilometers. All drivers must comply immediately.', time: 'Oct 23, 02:00 PM', author: 'Admin Juan Dela Cruz' },
        ];
        this.officerData = [
            { fname: 'Roberto',   mi: 'V.', lname: 'Macaspac', id: 'TODA-001', role: 'President',      status: 'on-duty',  phone: '+63 917 555 0001', email: 'president@toda.ph' },
            { fname: 'Carmelita', mi: 'S.', lname: 'Reyes',    id: 'TODA-002', role: 'Vice President', status: 'in-office', phone: '+63 917 555 0002', email: 'vp@toda.ph' },
        ];
        this.tcData = [
            { day: 'Mon / Wed', bodyRange: '0 – 2', time: '7:00 AM – 7:00 PM', status: 'active', route: 'All Routes', effectivity: '2024-01-15' },
            { day: 'Tue / Thu', bodyRange: '3 – 5', time: '7:00 AM – 7:00 PM', status: 'active', route: 'All Routes', effectivity: '2024-01-15' },
        ];
        this.cnData = [
            { fname: 'Juan',  lname: 'Dela Cruz', body: '345', driverid: 'ID-2024-0089', amount: 250, period: 'Oct 2024', date: '2024-10-21', status: 'paid', notes: '' },
            { fname: 'Maria', lname: 'Santos',    body: '102', driverid: 'ID-2024-0042', amount: 250, period: 'Oct 2024', date: '2024-10-21', status: 'paid', notes: '' },
        ];

        // Pagination / state
        this.drPage = 1;
        this.drData = null;
        this.drEditIdx = null;
        this.cnPage = 1;
        this.cnEditIdx = null;
        this.cnDeleteIdx = null;
        this.cnFiltered = null;
        this.offEditIdx = null;
        this.offDeleteIdx = null;
        this.offView = 'grid';
        this.tcEditIdx = null;
        this.tcDeleteIdx = null;
        this.annNextId = 5;
        this.offNextId = 7;
    }
}

/* ============================================
   DASHBOARD 1: MEMBER ROSTER
   ============================================ */
class RosterDashboard {
    constructor(store) {
        this.store = store;
        this.editIdx = null;
    }

    renderRoster(list) {
        const tbody = DashboardUtils.getEl('roster-body');
        if (!tbody) return;
        tbody.innerHTML = list.map((m, i) => `
            <tr>
                <td><div class="member-name">${m.name}</div><div class="member-id">Member ID · #${m.id}</div></td>
                <td>#${m.id}</td>
                <td><span class="badge ${DashboardUtils.badgeClass(m.status)}">${m.status}</span></td>
                <td>${m.contrib} <span style="color:var(--text-light);font-size:11px">· ${m.date}</span></td>
                <td><button class="btn-edit" onclick="window.openModal('${m.name}', ${m.id}, '${m.status}', '${m.contrib.replace('₱', '')}', ${i})">Edit</button></td>
            </tr>
        `).join('');
    }

    openModal(name, id, status, contrib, idx) {
        this.editIdx = idx !== undefined ? idx : null;
        const modalNameEl = DashboardUtils.getEl('modal-name');
        const modalBodyEl = DashboardUtils.getEl('modal-body');
        const modalContribEl = DashboardUtils.getEl('modal-contrib');
        const modalStatusEl = DashboardUtils.getEl('modal-status');
        if (modalNameEl) modalNameEl.textContent = `${name} (#${id})`;
        if (modalBodyEl) modalBodyEl.value = id;
        if (modalContribEl) modalContribEl.value = contrib;
        if (modalStatusEl) {
            Array.from(modalStatusEl.options).forEach(o => { o.selected = o.text.startsWith(status); });
        }
        DashboardUtils.openModal('edit-modal');
    }

    save() {
        if (this.editIdx === null) return;
        const contrib = DashboardUtils.getEl('modal-contrib')?.value.trim();
        const statusEl = DashboardUtils.getEl('modal-status');
        const statusVal = statusEl?.value || '';

        const member = this.store.members[this.editIdx];
        if (!member) return;

        if (contrib) member.contrib = '₱' + contrib;
        if (statusVal) member.status = statusVal;
        member.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        DashboardUtils.closeModal('edit-modal');
        this.renderRoster(this.store.members);
        DashboardUtils.showToast(`${member.name}'s record updated.`);
    }

    init() {
        const members = this.store.members;
        this.renderRoster(members);

        const searchInput = DashboardUtils.getEl('member-search');
        if (searchInput) {
            searchInput.oninput = () => {
                const q = searchInput.value.toLowerCase();
                this.renderRoster(members.filter(m =>
                    m.name.toLowerCase().includes(q) || String(m.id).includes(q)
                ));
            };
        }

        DashboardUtils.bindOverlayClose('edit-modal', () => DashboardUtils.closeModal('edit-modal'));
    }
}

/* ============================================
   DASHBOARD 2: LOST & FOUND
   ============================================ */
class LostFoundDashboard {
    constructor(store) {
        this.store = store;
        this.itemIcons = [
            `<svg width="22" height="22" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
            `<svg width="22" height="22" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
        ];
    }

    randomIcon() {
        return this.itemIcons[Math.floor(Math.random() * this.itemIcons.length)];
    }

    renderItems() {
        const container = DashboardUtils.getEl('lf-items-container');
        if (!container) return;
        container.innerHTML = '';
        this.store.lfItems.forEach(item => {
            const row = document.createElement('div');
            row.className = 'lf-item-row';
            row.innerHTML = `
                <div class="lf-item-thumb">${this.randomIcon()}</div>
                <div class="lf-item-info">
                    <div class="lf-item-name">${item.name}</div>
                    <div class="lf-item-meta">Body #${item.body} &nbsp;•&nbsp; Found ${item.date}</div>
                </div>
                <div class="lf-item-status status-${item.status.toLowerCase()}">${item.status}</div>
            `;
            container.appendChild(row);
        });
    }

    bindPhotoUpload() {
        const fileInput = DashboardUtils.getEl('lf-file-input');
        if (!fileInput) return;
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const area = DashboardUtils.getEl('lf-photo-area');
                if (!area) return;
                let img = area.querySelector('img');
                if (!img) { img = document.createElement('img'); area.appendChild(img); }
                img.src = e.target.result;
                area.classList.add('has-image');
                area.querySelectorAll('.photo-icon,.photo-tap,.photo-hint').forEach(el => el.style.display = 'none');
            };
            reader.readAsDataURL(file);
        });
    }

    submit() {
        const name = DashboardUtils.getEl('lf-item-name')?.value.trim();
        const body = DashboardUtils.getEl('lf-body-num')?.value.trim();
        const date = DashboardUtils.getEl('lf-date')?.value;
        if (!name) { DashboardUtils.getEl('lf-item-name')?.focus(); return; }

        const photoArea = DashboardUtils.getEl('lf-photo-area');
        const img = photoArea?.querySelector('img');
        const thumbHTML = img?.src
            ? `<img src="${img.src}" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>`
            : this.randomIcon();

        const dateLabel = date
            ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Today';

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
        DashboardUtils.getEl('lf-items-container')?.prepend(row);

        this.store.lfItems.unshift({ name, body: body || '—', date: dateLabel, status: 'Pending' });

        DashboardUtils.clearFields(['lf-item-name', 'lf-body-num', 'lf-date']);
        if (photoArea) {
            photoArea.classList.remove('has-image');
            if (img) img.remove();
            photoArea.querySelectorAll('.photo-icon,.photo-tap,.photo-hint').forEach(el => el.style.display = '');
        }
        const fi = DashboardUtils.getEl('lf-file-input');
        if (fi) fi.value = '';

        DashboardUtils.showToast(`"${name}" posted to bulletin.`);
    }

    init() {
        this.renderItems();
        this.bindPhotoUpload();
        const submitBtn = DashboardUtils.getEl('lf-submit-btn');
        if (submitBtn) submitBtn.onclick = () => this.submit();
    }
}

/* ============================================
   DASHBOARD 3: DRIVERS REGISTRY
   ============================================ */
class DriversDashboard {
    constructor(store) {
        this.store = store;
        this.avatarColors = ['#c0392b', '#e67e22', '#2980b9', '#27ae60', '#8e44ad', '#16a085'];
        this.PER_PAGE = 4;
    }

    statusClass(s) {
        return s === 'Active' ? 'active' : s === 'Inactive' ? 'inactive' : 'suspended';
    }

    initials(d) {
        return (d.fname[0] + d.lname[0]).toUpperCase();
    }

    getData() {
        return this.store.drData || this.store.driverData;
    }

    render() {
        const drData = this.getData();
        const total = drData.length;
        const pages = Math.ceil(total / this.PER_PAGE);
        const start = (this.store.drPage - 1) * this.PER_PAGE;
        const slice = drData.slice(start, start + this.PER_PAGE);

        const tbody = DashboardUtils.getEl('driver-table-body');
        if (!tbody) return;

        tbody.innerHTML = slice.map((d, i) => {
            const sc = this.statusClass(d.status);
            const color = this.avatarColors[(start + i) % this.avatarColors.length];
            return `
                <tr>
                    <td>
                        <div class="dr-member-cell">
                            <div class="dr-avatar" style="background:${color};color:white;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700">
                                ${this.initials(d)}
                            </div>
                            <div>
                                <div class="dr-member-name">${d.fname}<br>${d.lname}</div>
                                <div class="dr-member-id">${d.id}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="dr-body-tag">#${d.body}</span></td>
                    <td>
                        <div class="dr-status">
                            <div class="dr-status-dot ${sc}"></div>
                            <div class="dr-status-label ${sc}">${d.status.toUpperCase()}</div>
                        </div>
                    </td>
                    <td>
                        <div class="dr-contact">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.38 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            ${d.contact}
                        </div>
                    </td>
                    <td>
                        <div class="dr-actions">
                            <button class="dr-btn-edit" title="Edit" onclick="window.openDriverModal(${start + i})">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="dr-btn-del" title="Delete" onclick="window.deleteDriver(${start + i})">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        const showingEl = DashboardUtils.getEl('dr-showing');
        if (showingEl) {
            showingEl.innerHTML = `Showing <strong>${start + 1} – ${Math.min(start + this.PER_PAGE, total)}</strong> of <strong>${total}</strong> total members`;
        }

        const pb = DashboardUtils.getEl('dr-page-btns');
        if (pb) {
            pb.innerHTML = '';
            for (let p = 1; p <= pages; p++) {
                const b = document.createElement('button');
                b.className = 'dr-pg-num' + (p === this.store.drPage ? ' current' : '');
                b.textContent = p;
                b.onclick = () => { this.store.drPage = p; this.render(); };
                pb.appendChild(b);
            }
        }

        const prevBtn = DashboardUtils.getEl('dr-prev');
        const nextBtn = DashboardUtils.getEl('dr-next');
        if (prevBtn) prevBtn.disabled = this.store.drPage === 1;
        if (nextBtn) nextBtn.disabled = this.store.drPage >= pages;
    }

    changePage(dir) {
        const pages = Math.ceil(this.getData().length / this.PER_PAGE);
        this.store.drPage = Math.max(1, Math.min(pages, this.store.drPage + dir));
        this.render();
    }

    delete(idx) {
        this.getData().splice(idx, 1);
        if ((this.store.drPage - 1) * this.PER_PAGE >= this.getData().length && this.store.drPage > 1) {
            this.store.drPage--;
        }
        this.render();
        DashboardUtils.showToast('Driver removed from registry.');
    }

    openModal(idx) {
        this.store.drEditIdx = idx !== undefined ? idx : null;
        const drData = this.getData();
        const isEdit = this.store.drEditIdx !== null;
        const titleEl = DashboardUtils.getEl('driver-modal-title');
        const subEl = DashboardUtils.getEl('driver-modal-sub');
        if (titleEl) titleEl.textContent = isEdit ? 'Edit Driver Profile' : 'Add New Driver';
        if (subEl) {
            subEl.textContent = isEdit
                ? `Editing record for ${drData[idx].fname} ${drData[idx].lname}.`
                : 'Fill in the details to register a new fleet member.';
        }

        if (isEdit) {
            const d = drData[idx];
            DashboardUtils.setVal('drv-fname', d.fname);
            DashboardUtils.setVal('drv-lname', d.lname);
            DashboardUtils.setVal('drv-body', d.body);
            DashboardUtils.setVal('drv-contact', d.contact.replace('+63 ', ''));
            const statusSelect = DashboardUtils.getEl('drv-status');
            if (statusSelect) Array.from(statusSelect.options).forEach(o => o.selected = o.text === d.status);
        } else {
            DashboardUtils.clearFields(['drv-fname', 'drv-lname', 'drv-body', 'drv-contact']);
            const statusSelect = DashboardUtils.getEl('drv-status');
            if (statusSelect) statusSelect.selectedIndex = 0;
        }
        DashboardUtils.openModal('driver-modal');
    }

    save() {
        const fname = DashboardUtils.getEl('drv-fname')?.value.trim();
        const lname = DashboardUtils.getEl('drv-lname')?.value.trim();
        const body = DashboardUtils.getEl('drv-body')?.value.trim();
        const contact = DashboardUtils.getEl('drv-contact')?.value.trim();
        const status = DashboardUtils.getEl('drv-status')?.value;
        if (!fname || !lname) { DashboardUtils.getEl('drv-fname')?.focus(); return; }

        const entry = {
            fname, lname,
            id: `ID-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            body: body || '---',
            status,
            contact: contact ? `+63 ${contact}` : '—'
        };

        const drData = this.getData();
        if (this.store.drEditIdx !== null) {
            drData[this.store.drEditIdx] = { ...drData[this.store.drEditIdx], ...entry };
            DashboardUtils.showToast('Driver profile updated.');
        } else {
            drData.unshift(entry);
            this.store.drPage = 1;
            DashboardUtils.showToast(`${fname} ${lname} added to registry.`);
        }

        DashboardUtils.closeModal('driver-modal');
        this.render();
    }

    init() {
        if (!this.store.drData) this.store.drData = [...this.store.driverData];
        this.store.drPage = 1;
        this.render();
        DashboardUtils.bindOverlayClose('driver-modal', () => DashboardUtils.closeModal('driver-modal'));
    }
}

/* ============================================
   DASHBOARD 4: ANNOUNCEMENTS
   ============================================ */
class AnnouncementsDashboard {
    constructor(store) {
        this.store = store;
    }

    render() {
        const container = DashboardUtils.getEl('ann-posts-list');
        if (!container) return;

        container.innerHTML = this.store.annPosts.map(p => `
            <div class="ann-post-item" id="ann-post-${p.id}">
                <div class="ann-post-top">
                    <span class="ann-post-badge ${p.type}">${p.type.charAt(0).toUpperCase() + p.type.slice(1)}</span>
                    <button class="ann-post-del" onclick="window.deleteAnnouncement(${p.id})" title="Delete">
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

        const countEl = DashboardUtils.getEl('ann-count');
        if (countEl) countEl.textContent = `${this.store.annPosts.length} active`;
    }

    delete(id) {
        this.store.annPosts = this.store.annPosts.filter(p => p.id !== id);
        this.render();
        DashboardUtils.showToast('Announcement removed from bulletin.');
    }

    post() {
        const title = DashboardUtils.getEl('ann-new-title')?.value.trim();
        const body = DashboardUtils.getEl('ann-new-body')?.value.trim();
        const type = DashboardUtils.getEl('ann-new-type')?.value;
        if (!title) { DashboardUtils.getEl('ann-new-title')?.focus(); return; }

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        this.store.annPosts.unshift({ id: this.store.annNextId++, type, title, body: body || '—', time: dateStr, author: 'Admin' });
        this.render();

        DashboardUtils.setVal('ann-new-title', '');
        DashboardUtils.setVal('ann-new-body', '');
        const typeSelect = DashboardUtils.getEl('ann-new-type');
        if (typeSelect) typeSelect.selectedIndex = 0;
        DashboardUtils.showToast(`"${title}" posted to bulletin.`);
    }

    init() {
        this.render();
    }
}

/* ============================================
   DASHBOARD 5: OFFICERS MANAGEMENT
   ============================================ */
class OfficersDashboard {
    constructor(store) {
        this.store = store;
        this.avatarColors = ['#7a0c0c', '#2980b9', '#27ae60', '#8e44ad', '#16a085', '#e67e22', '#c0392b', '#1a5276'];
    }

    statusLabel(s) {
        if (s === 'on-duty') return 'ON-DUTY';
        if (s === 'in-office') return 'IN OFFICE';
        return 'OFF-DUTY';
    }

    initials(o) {
        return (o.fname[0] + o.lname[0]).toUpperCase();
    }

    render() {
        const container = DashboardUtils.getEl('off-grid-container');
        if (!container) return;

        const totalEl = DashboardUtils.getEl('off-total-num');
        if (totalEl) totalEl.textContent = this.store.officerData.length;

        container.className = 'off-grid' + (this.store.offView === 'list' ? ' list-view' : '');
        container.innerHTML = this.store.officerData.map((o, i) => {
            const color = this.avatarColors[i % this.avatarColors.length];
            const statusClass = o.status;
            const statusLbl = this.statusLabel(o.status);
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
                            <div class="off-avatar-initials" style="background:${color}">${this.initials(o)}</div>
                        </div>
                        <div>
                            <div class="off-name">${o.fname} ${o.mi} ${o.lname}</div>
                            <div class="off-role">${o.role}</div>
                        </div>
                    </div>
                    <div class="off-card-actions with-contact">
                        <button class="off-btn edit-btn" onclick="window.openOfficerModal(${i})">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                        </button>
                        <button class="off-btn del-btn" onclick="window.openOfficerConfirm(${i})">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                            Remove
                        </button>
                    </div>
                    <div class="off-contact-row">
                        <button class="off-btn call-btn" onclick="window.showToast('Calling ${o.fname} ${o.lname}…')">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.87a16 16 0 0 0 6.29 6.29l1.08-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            Call
                        </button>
                        <button class="off-btn email-btn" onclick="window.showToast('Opening email to ${o.fname} ${o.lname}…')">
                            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            Email
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    setView(v) {
        this.store.offView = v;
        const gridBtn = DashboardUtils.getEl('off-grid-btn');
        const listBtn = DashboardUtils.getEl('off-list-btn');
        if (gridBtn) gridBtn.classList.toggle('active', v === 'grid');
        if (listBtn) listBtn.classList.toggle('active', v === 'list');
        this.render();
    }

    openModal(idx) {
        this.store.offEditIdx = idx !== undefined ? idx : null;
        const isEdit = this.store.offEditIdx !== null;
        const titleEl = DashboardUtils.getEl('off-modal-title');
        const subEl = DashboardUtils.getEl('off-modal-sub');
        const saveLabel = DashboardUtils.getEl('off-save-label');
        if (titleEl) titleEl.textContent = isEdit ? 'Edit Officer Profile' : 'Add New Officer';
        if (subEl) {
            subEl.textContent = isEdit
                ? `Editing record for ${this.store.officerData[idx].fname} ${this.store.officerData[idx].lname}.`
                : 'Register a new official into the current term.';
        }
        if (saveLabel) saveLabel.textContent = isEdit ? 'Save Changes' : 'Register Officer';

        if (isEdit) {
            const o = this.store.officerData[idx];
            DashboardUtils.setVal('off-fname', o.fname);
            DashboardUtils.setVal('off-mi', o.mi);
            DashboardUtils.setVal('off-lname', o.lname);
            DashboardUtils.setVal('off-id', o.id);
            const roleSelect = DashboardUtils.getEl('off-role');
            const statusSelect = DashboardUtils.getEl('off-status');
            if (roleSelect) roleSelect.value = o.role;
            if (statusSelect) statusSelect.value = o.status;
            DashboardUtils.setVal('off-phone', o.phone.replace('+63 ', ''));
            DashboardUtils.setVal('off-email', o.email);
        } else {
            DashboardUtils.clearFields(['off-fname', 'off-mi', 'off-lname', 'off-phone', 'off-email']);
            DashboardUtils.setVal('off-id', `TODA-${String(this.store.offNextId).padStart(3, '0')}`);
            const roleSelect = DashboardUtils.getEl('off-role');
            const statusSelect = DashboardUtils.getEl('off-status');
            if (roleSelect) roleSelect.selectedIndex = 0;
            if (statusSelect) statusSelect.selectedIndex = 0;
        }
        DashboardUtils.openModal('officer-modal');
    }

    closeModal() {
        DashboardUtils.closeModal('officer-modal');
    }

    save() {
        const fname = DashboardUtils.getEl('off-fname')?.value.trim();
        const mi = DashboardUtils.getEl('off-mi')?.value.trim();
        const lname = DashboardUtils.getEl('off-lname')?.value.trim();
        const role = DashboardUtils.getEl('off-role')?.value;
        const status = DashboardUtils.getEl('off-status')?.value;
        const phone = DashboardUtils.getEl('off-phone')?.value.trim();
        const email = DashboardUtils.getEl('off-email')?.value.trim();

        if (!fname || !lname) { DashboardUtils.getEl('off-fname')?.focus(); return; }

        const entry = {
            fname, mi, lname,
            id: this.store.offEditIdx !== null
                ? this.store.officerData[this.store.offEditIdx].id
                : `TODA-${String(this.store.offNextId).padStart(3, '0')}`,
            role, status,
            phone: phone ? `+63 ${phone}` : '—',
            email: email || '—'
        };

        if (this.store.offEditIdx !== null) {
            this.store.officerData[this.store.offEditIdx] = entry;
            DashboardUtils.showToast(`${fname} ${lname}'s profile updated.`);
        } else {
            this.store.officerData.push(entry);
            this.store.offNextId++;
            DashboardUtils.showToast(`${fname} ${lname} added to the council.`);
        }

        this.closeModal();
        this.render();
    }

    openConfirm(idx) {
        this.store.offDeleteIdx = idx;
        const o = this.store.officerData[idx];
        const subEl = DashboardUtils.getEl('off-confirm-sub');
        if (subEl) {
            subEl.textContent = `Are you sure you want to remove ${o.fname} ${o.lname} (${o.role}) from the current term? This action cannot be undone.`;
        }
        DashboardUtils.openModal('officer-confirm');
    }

    closeConfirm() {
        DashboardUtils.closeModal('officer-confirm');
        this.store.offDeleteIdx = null;
    }

    confirmDelete() {
        if (this.store.offDeleteIdx === null) return;
        const name = `${this.store.officerData[this.store.offDeleteIdx].fname} ${this.store.officerData[this.store.offDeleteIdx].lname}`;
        this.store.officerData.splice(this.store.offDeleteIdx, 1);
        this.closeConfirm();
        this.render();
        DashboardUtils.showToast(`${name} removed from the council.`);
    }

    init() {
        this.render();
        const gridBtn = DashboardUtils.getEl('off-grid-btn');
        const listBtn = DashboardUtils.getEl('off-list-btn');
        if (gridBtn) gridBtn.onclick = () => this.setView('grid');
        if (listBtn) listBtn.onclick = () => this.setView('list');
        DashboardUtils.bindOverlayClose('officer-modal', () => this.closeModal());
        DashboardUtils.bindOverlayClose('officer-confirm', () => this.closeConfirm());
    }
}

/* ============================================
   DASHBOARD 6: TRICYCLE CODING
   ============================================ */
class CodingDashboard {
    constructor(store) {
        this.store = store;
        this.statusLabels = { active: 'Active', suspended: 'Suspended', 'open-win': 'Open Window' };
    }

    render() {
        const tbody = DashboardUtils.getEl('tc-table-body');
        if (!tbody) return;

        const totalEl = DashboardUtils.getEl('tc-total');
        if (totalEl) totalEl.textContent = this.store.tcData.length;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = dayNames[new Date().getDay()];
        const todaySchedules = this.store.tcData.filter(t => t.day === today || t.day.includes(today.substring(0, 3)));

        const todayEl = DashboardUtils.getEl('tc-today-label');
        const todayDetail = DashboardUtils.getEl('tc-today-detail');
        const todayTime = DashboardUtils.getEl('tc-today-time');
        const activeToday = DashboardUtils.getEl('tc-active-today');

        if (todayEl) {
            if (todaySchedules.length) {
                todayEl.textContent = `Today (${today}) — Restricted Body Numbers:`;
                if (todayDetail) todayDetail.textContent = todaySchedules.map(t => t.bodyRange).join(', ');
                if (todayTime) todayTime.textContent = todaySchedules[0].time;
                if (activeToday) activeToday.textContent = todaySchedules.map(t => t.bodyRange).join(', ');
            } else {
                todayEl.textContent = `Today (${today})`;
                if (todayDetail) todayDetail.textContent = 'No Restriction';
                if (todayTime) todayTime.textContent = 'All body numbers may operate freely';
                if (activeToday) activeToday.textContent = 'None';
            }
        }

        tbody.innerHTML = this.store.tcData.map((t, i) => {
            const isToday = t.day === today || t.day.includes(today.substring(0, 3));
            const statusLabel = this.statusLabels[t.status] || t.status;
            const bodyDisplay = t.bodyRange === 'ALL'
                ? `<span class="tc-body-tag open">ALL OPEN</span>`
                : `<span class="tc-body-tag">${t.bodyRange}</span>`;
            return `
                <tr>
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
                    </td>
                    <td>${bodyDisplay}</td>
                    <td style="font-size:13px;color:var(--text-body)">${t.time}</td>
                    <td><span class="tc-status-pill ${t.status}">${statusLabel}</span></td>
                    <td>
                        <div class="tc-actions">
                            <button class="tc-btn-edit" onclick="window.openCodingModal(${i})" title="Edit">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="tc-btn-del" onclick="window.openCodingConfirm(${i})" title="Delete">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    openModal(idx) {
        this.store.tcEditIdx = idx !== undefined ? idx : null;
        const isEdit = this.store.tcEditIdx !== null;
        const titleEl = DashboardUtils.getEl('tc-modal-title');
        const subEl = DashboardUtils.getEl('tc-modal-sub');
        const saveLabel = DashboardUtils.getEl('tc-save-label');
        if (titleEl) titleEl.textContent = isEdit ? 'Edit Coding Schedule' : 'Add Coding Schedule';
        if (subEl) subEl.textContent = isEdit ? 'Update this coding window.' : 'Define an operational window for a body number range.';
        if (saveLabel) saveLabel.textContent = isEdit ? 'Save Changes' : 'Add Schedule';

        if (isEdit) {
            const t = this.store.tcData[idx];
            const daySelect = DashboardUtils.getEl('tc-day');
            const statusSelect = DashboardUtils.getEl('tc-status');
            if (daySelect) daySelect.value = t.day;
            if (statusSelect) statusSelect.value = t.status;
            DashboardUtils.setVal('tc-body-range', t.bodyRange);
            DashboardUtils.setVal('tc-time', t.time);
            DashboardUtils.setVal('tc-route', t.route);
            DashboardUtils.setVal('tc-effectivity', t.effectivity);
        } else {
            const daySelect = DashboardUtils.getEl('tc-day');
            const statusSelect = DashboardUtils.getEl('tc-status');
            if (daySelect) daySelect.selectedIndex = 0;
            if (statusSelect) statusSelect.selectedIndex = 0;
            DashboardUtils.clearFields(['tc-body-range', 'tc-time', 'tc-route', 'tc-effectivity']);
        }
        DashboardUtils.openModal('coding-modal');
    }

    closeModal() {
        DashboardUtils.closeModal('coding-modal');
    }

    save() {
        const day = DashboardUtils.getEl('tc-day')?.value;
        const status = DashboardUtils.getEl('tc-status')?.value;
        const bodyRange = DashboardUtils.getEl('tc-body-range')?.value.trim();
        const time = DashboardUtils.getEl('tc-time')?.value.trim();
        const route = DashboardUtils.getEl('tc-route')?.value.trim();
        const effectivity = DashboardUtils.getEl('tc-effectivity')?.value;
        if (!bodyRange) { DashboardUtils.getEl('tc-body-range')?.focus(); return; }

        const entry = { day, bodyRange, time: time || 'Not specified', status, route: route || 'All Routes', effectivity };
        if (this.store.tcEditIdx !== null) {
            this.store.tcData[this.store.tcEditIdx] = entry;
            DashboardUtils.showToast('Coding schedule updated.');
        } else {
            this.store.tcData.push(entry);
            DashboardUtils.showToast(`Coding schedule for ${day} added.`);
        }
        this.closeModal();
        this.render();
    }

    openConfirm(idx) {
        this.store.tcDeleteIdx = idx;
        const subEl = DashboardUtils.getEl('coding-confirm-sub');
        if (subEl) {
            subEl.textContent = `Delete the coding schedule for ${this.store.tcData[idx].day} (Body Nos. ${this.store.tcData[idx].bodyRange})?`;
        }
        DashboardUtils.openModal('coding-confirm');
    }

    closeConfirm() {
        DashboardUtils.closeModal('coding-confirm');
        this.store.tcDeleteIdx = null;
    }

    confirmDelete() {
        if (this.store.tcDeleteIdx === null) return;
        const label = `${this.store.tcData[this.store.tcDeleteIdx].day} – Body ${this.store.tcData[this.store.tcDeleteIdx].bodyRange}`;
        this.store.tcData.splice(this.store.tcDeleteIdx, 1);
        this.closeConfirm();
        this.render();
        DashboardUtils.showToast(`Schedule "${label}" deleted.`);
    }

    init() {
        this.render();
        DashboardUtils.bindOverlayClose('coding-modal', () => this.closeModal());
        DashboardUtils.bindOverlayClose('coding-confirm', () => this.closeConfirm());
    }
}

/* ============================================
   DASHBOARD 7: CONTRIBUTIONS
   ============================================ */
class ContributionsDashboard {
    constructor(store) {
        this.store = store;
        this.avatarColors = ['#7a0c0c', '#2980b9', '#27ae60', '#8e44ad', '#16a085', '#e67e22', '#c0392b', '#1a5276', '#784212', '#1f618d'];
        this.PER_PAGE = 8;
    }

    initials(r) { return (r.fname[0] + r.lname[0]).toUpperCase(); }

    amountClass(r) {
        if (r.status === 'paid') return 'paid';
        if (r.status === 'partial') return 'partial';
        return 'unpaid';
    }

    formatDate(d) {
        if (!d) return '—';
        return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    updateSummary() {
        const paid = this.store.cnData.filter(r => r.status === 'paid');
        const partial = this.store.cnData.filter(r => r.status === 'partial');
        const unpaid = this.store.cnData.filter(r => r.status === 'unpaid');
        const total = this.store.cnData.reduce((s, r) => s + Number(r.amount), 0);

        const set = (id, val) => { const el = DashboardUtils.getEl(id); if (el) el.textContent = val; };
        set('cn-total-amount', '₱' + total.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
        set('cn-paid-count', paid.length);
        set('cn-paid-num', paid.length);
        set('cn-partial-num', partial.length);
        set('cn-unpaid-num', unpaid.length);
    }

    filterRender() {
        const q = (DashboardUtils.getEl('cn-search-input')?.value || '').toLowerCase();
        const fStatus = DashboardUtils.getEl('cn-filter-status')?.value;
        const fPeriod = DashboardUtils.getEl('cn-filter-period')?.value;
        this.store.cnFiltered = this.store.cnData.filter(r => {
            const name = `${r.fname} ${r.lname} ${r.body} ${r.driverid}`.toLowerCase();
            return (!q || name.includes(q))
                && (!fStatus || r.status === fStatus)
                && (!fPeriod || r.period === fPeriod);
        });
        this.store.cnPage = 1;
        this.render();
    }

    render() {
        this.updateSummary();
        const tbody = DashboardUtils.getEl('cn-table-body');
        if (!tbody) return;

        const filtered = this.store.cnFiltered || this.store.cnData;
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / this.PER_PAGE));
        const start = (this.store.cnPage - 1) * this.PER_PAGE;
        const slice = filtered.slice(start, start + this.PER_PAGE);

        tbody.innerHTML = slice.map(r => {
            const realIdx = this.store.cnData.indexOf(r);
            const color = this.avatarColors[realIdx % this.avatarColors.length];
            const amtClass = this.amountClass(r);
            return `
                <tr>
                    <td>
                        <div class="cn-driver-cell">
                            <div class="cn-avatar" style="background:${color}">${this.initials(r)}</div>
                            <div>
                                <div class="cn-driver-name">${r.fname} ${r.lname}</div>
                                <div class="cn-driver-id">${r.driverid}</div>
                            </div>
                        </div>
                    </td>
                    <td><strong>#${r.body}</strong></td>
                    <td><span class="cn-amount ${amtClass}">₱${Number(r.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></td>
                    <td><span class="cn-period-badge">${r.period}</span></td>
                    <td style="font-size:13px;color:var(--text-muted)">${this.formatDate(r.date)}</td>
                    <td>
                        <span class="cn-pay-status ${r.status}">
                            <span class="cn-pay-dot"></span>
                            ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                    </td>
                    <td>
                        <div class="cn-actions">
                            <button class="cn-btn-edit" onclick="window.openCnModal(${realIdx})" title="Edit">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="cn-btn-del" onclick="window.openCnConfirm(${realIdx})" title="Delete">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        const showingEl = DashboardUtils.getEl('cn-showing');
        if (showingEl) {
            showingEl.innerHTML = total
                ? `Showing <strong>${start + 1}–${Math.min(start + this.PER_PAGE, total)}</strong> of <strong>${total}</strong> records`
                : 'No records found';
        }

        const pb = DashboardUtils.getEl('cn-page-btns');
        if (pb) {
            pb.innerHTML = '';
            for (let p = 1; p <= pages; p++) {
                const b = document.createElement('button');
                b.className = 'cn-pg-num' + (p === this.store.cnPage ? ' current' : '');
                b.textContent = p;
                b.onclick = () => { this.store.cnPage = p; this.render(); };
                pb.appendChild(b);
            }
        }

        const prevBtn = DashboardUtils.getEl('cn-prev');
        const nextBtn = DashboardUtils.getEl('cn-next');
        if (prevBtn) prevBtn.disabled = this.store.cnPage === 1;
        if (nextBtn) nextBtn.disabled = this.store.cnPage >= pages;
    }

    changePage(dir) {
        const filtered = this.store.cnFiltered || this.store.cnData;
        const pages = Math.max(1, Math.ceil(filtered.length / this.PER_PAGE));
        this.store.cnPage = Math.max(1, Math.min(pages, this.store.cnPage + dir));
        this.render();
    }

    openModal(idx) {
        this.store.cnEditIdx = idx !== undefined ? idx : null;
        const isEdit = this.store.cnEditIdx !== null;
        const titleEl = DashboardUtils.getEl('cn-modal-title');
        const subEl = DashboardUtils.getEl('cn-modal-sub');
        const saveLabel = DashboardUtils.getEl('cn-save-label');
        if (titleEl) titleEl.textContent = isEdit ? 'Edit Contribution' : 'Add Contribution';
        if (subEl) {
            subEl.textContent = isEdit
                ? `Editing record for ${this.store.cnData[idx].fname} ${this.store.cnData[idx].lname}.`
                : 'Record a drivers contribution for the period.';
        }
        if (saveLabel) saveLabel.textContent = isEdit ? 'Save Changes' : 'Save Record';

        if (isEdit) {
            const r = this.store.cnData[idx];
            DashboardUtils.setVal('cn-fname', r.fname);
            DashboardUtils.setVal('cn-lname', r.lname);
            DashboardUtils.setVal('cn-body', r.body);
            DashboardUtils.setVal('cn-driverid', r.driverid);
            DashboardUtils.setVal('cn-amount', r.amount);
            const periodSelect = DashboardUtils.getEl('cn-period');
            if (periodSelect) periodSelect.value = r.period;
            DashboardUtils.setVal('cn-date', r.date);
            const statusSelect = DashboardUtils.getEl('cn-paystatus');
            if (statusSelect) statusSelect.value = r.status;
            DashboardUtils.setVal('cn-notes', r.notes);
        } else {
            DashboardUtils.clearFields(['cn-fname', 'cn-lname', 'cn-body', 'cn-driverid', 'cn-notes']);
            DashboardUtils.setVal('cn-amount', '250');
            const periodSelect = DashboardUtils.getEl('cn-period');
            const statusSelect = DashboardUtils.getEl('cn-paystatus');
            if (periodSelect) periodSelect.selectedIndex = 0;
            if (statusSelect) statusSelect.selectedIndex = 0;
            DashboardUtils.setVal('cn-date', new Date().toISOString().split('T')[0]);
        }
        DashboardUtils.openModal('cn-modal');
    }

    closeModal() {
        DashboardUtils.closeModal('cn-modal');
    }

    save() {
        const fname = DashboardUtils.getEl('cn-fname')?.value.trim();
        const lname = DashboardUtils.getEl('cn-lname')?.value.trim();
        const body = DashboardUtils.getEl('cn-body')?.value.trim();
        const driverid = DashboardUtils.getEl('cn-driverid')?.value.trim();
        const amount = parseFloat(DashboardUtils.getEl('cn-amount')?.value) || 0;
        const period = DashboardUtils.getEl('cn-period')?.value;
        const date = DashboardUtils.getEl('cn-date')?.value;
        const status = DashboardUtils.getEl('cn-paystatus')?.value;
        const notes = DashboardUtils.getEl('cn-notes')?.value.trim();
        if (!fname || !lname) { DashboardUtils.getEl('cn-fname')?.focus(); return; }

        const entry = { fname, lname, body: body || '—', driverid: driverid || '—', amount, period, date, status, notes };
        if (this.store.cnEditIdx !== null) {
            this.store.cnData[this.store.cnEditIdx] = entry;
            DashboardUtils.showToast(`${fname} ${lname}'s contribution updated.`);
        } else {
            this.store.cnData.unshift(entry);
            DashboardUtils.showToast(`Contribution for ${fname} ${lname} recorded.`);
        }
        this.closeModal();
        this.store.cnFiltered = [...this.store.cnData];
        this.store.cnPage = 1;
        this.render();
    }

    openConfirm(idx) {
        this.store.cnDeleteIdx = idx;
        const r = this.store.cnData[idx];
        const subEl = DashboardUtils.getEl('cn-confirm-sub');
        if (subEl) subEl.textContent = `Delete contribution record for ${r.fname} ${r.lname} (${r.period})?`;
        DashboardUtils.openModal('cn-confirm');
    }

    closeConfirm() {
        DashboardUtils.closeModal('cn-confirm');
        this.store.cnDeleteIdx = null;
    }

    confirmDelete() {
        if (this.store.cnDeleteIdx === null) return;
        const name = `${this.store.cnData[this.store.cnDeleteIdx].fname} ${this.store.cnData[this.store.cnDeleteIdx].lname}`;
        this.store.cnData.splice(this.store.cnDeleteIdx, 1);
        this.closeConfirm();
        this.store.cnFiltered = [...this.store.cnData];
        this.store.cnPage = 1;
        this.render();
        DashboardUtils.showToast(`Record for ${name} deleted.`);
    }

    init() {
        this.store.cnFiltered = [...this.store.cnData];
        this.store.cnPage = 1;
        this.render();

        DashboardUtils.bindOverlayClose('cn-modal', () => this.closeModal());
        DashboardUtils.bindOverlayClose('cn-confirm', () => this.closeConfirm());

        const searchInput = DashboardUtils.getEl('cn-search-input');
        const statusFilter = DashboardUtils.getEl('cn-filter-status');
        const periodFilter = DashboardUtils.getEl('cn-filter-period');
        if (searchInput) searchInput.oninput = () => this.filterRender();
        if (statusFilter) statusFilter.onchange = () => this.filterRender();
        if (periodFilter) periodFilter.onchange = () => this.filterRender();

        const prevBtn = DashboardUtils.getEl('cn-prev');
        const nextBtn = DashboardUtils.getEl('cn-next');
        if (prevBtn) prevBtn.onclick = () => this.changePage(-1);
        if (nextBtn) nextBtn.onclick = () => this.changePage(1);
    }
}

/* ============================================
   MAIN APP CONTROLLER
   ============================================ */
class DashboardApp {
    constructor() {
        this.store = new DashboardStore();
        this.dashboards = {
            roster:        new RosterDashboard(this.store),
            lostfound:     new LostFoundDashboard(this.store),
            drivers:       new DriversDashboard(this.store),
            announcements: new AnnouncementsDashboard(this.store),
            officers:      new OfficersDashboard(this.store),
            coding:        new CodingDashboard(this.store),
            contributions: new ContributionsDashboard(this.store),
        };
    }

    switchPage(page) {
        document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.remove('active'));
        const targetPage = document.getElementById('page-' + page);
        if (targetPage) targetPage.classList.add('active');

        setTimeout(() => {
            const db = this.dashboards[page];
            if (db) db.init();
        }, 50);
    }

    initNavigation() {
        document.querySelectorAll('.nav-item').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.onclick = (e) => {
                e.preventDefault();
                const pageId = newButton.getAttribute('data-page');
                if (!pageId) return;
                document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
                newButton.classList.add('active');
                this.switchPage(pageId);
            };
        });
    }

    initActiveDashboards() {
        const activePage = document.querySelector('[id^="page-"].active');
        if (activePage) {
            const pageId = activePage.id.replace('page-', '');
            const db = this.dashboards[pageId];
            if (db) { db.init(); return; }
        }
        // Fallback: init all that exist
        Object.entries(this.dashboards).forEach(([key, db]) => {
            const exists = {
                roster:        'roster-body',
                lostfound:     'lf-items-container',
                drivers:       'driver-table-body',
                announcements: 'ann-posts-list',
                officers:      'off-grid-container',
                coding:        'tc-table-body',
                contributions: 'cn-table-body',
            };
            if (document.getElementById(exists[key])) db.init();
        });
    }

    initModalOverlayClose() {
        ['edit-modal', 'driver-modal', 'officer-modal', 'officer-confirm', 'coding-modal', 'coding-confirm', 'cn-modal', 'cn-confirm']
            .forEach(id => {
                const modal = document.getElementById(id);
                if (modal) modal.onclick = function (e) {
                    if (e.target === this) this.classList.remove('open');
                };
            });
    }

    exposeGlobals() {
        // Toast
        window.showToast = (msg) => DashboardUtils.showToast(msg);

        // Member roster modal
        window.openModal      = (name, id, status, contrib, idx) => this.dashboards.roster.openModal(name, id, status, contrib, idx);
        window.saveMember     = () => this.dashboards.roster.save();
        window.closeEditModal = () => DashboardUtils.closeModal('edit-modal');

        // Lost & Found
        window.submitLostFound = () => this.dashboards.lostfound.submit();

        // Drivers
        window.openDriverModal    = (idx) => this.dashboards.drivers.openModal(idx);
        window.openAddDriverModal = ()    => this.dashboards.drivers.openModal();
        window.closeDriverModal   = ()    => DashboardUtils.closeModal('driver-modal');
        window.saveDriver         = ()    => this.dashboards.drivers.save();
        window.deleteDriver       = (idx) => this.dashboards.drivers.delete(idx);
        window.drChangePage       = (dir) => this.dashboards.drivers.changePage(dir);

        // Announcements
        window.deleteAnnouncement = (id) => this.dashboards.announcements.delete(id);
        window.postAnnouncement   = ()   => this.dashboards.announcements.post();

        // Officers
        window.openOfficerModal     = (idx) => this.dashboards.officers.openModal(idx);
        window.openAddOfficerModal  = ()    => this.dashboards.officers.openModal();
        window.closeOfficerModal    = ()    => this.dashboards.officers.closeModal();
        window.saveOfficer          = ()    => this.dashboards.officers.save();
        window.openOfficerConfirm   = (idx) => this.dashboards.officers.openConfirm(idx);
        window.closeOfficerConfirm  = ()    => this.dashboards.officers.closeConfirm();
        window.confirmDeleteOfficer = ()    => this.dashboards.officers.confirmDelete();
        window.setOfficerView       = (v)   => this.dashboards.officers.setView(v);

        // Coding
        window.openCodingModal     = (idx) => this.dashboards.coding.openModal(idx);
        window.openAddCodingModal  = ()    => this.dashboards.coding.openModal();
        window.closeCodingModal    = ()    => this.dashboards.coding.closeModal();
        window.saveCodingSchedule  = ()    => this.dashboards.coding.save();
        window.openCodingConfirm   = (idx) => this.dashboards.coding.openConfirm(idx);
        window.closeCodingConfirm  = ()    => this.dashboards.coding.closeConfirm();
        window.confirmDeleteCoding = ()    => this.dashboards.coding.confirmDelete();

        // Contributions
        window.openCnModal     = (idx) => this.dashboards.contributions.openModal(idx);
        window.openAddCnModal  = ()    => this.dashboards.contributions.openModal();
        window.closeCnModal    = ()    => this.dashboards.contributions.closeModal();
        window.saveCnRecord    = ()    => this.dashboards.contributions.save();
        window.openCnConfirm   = (idx) => this.dashboards.contributions.openConfirm(idx);
        window.closeCnConfirm  = ()    => this.dashboards.contributions.closeConfirm();
        window.confirmDeleteCn = ()    => this.dashboards.contributions.confirmDelete();
        window.cnChangePage    = (dir) => this.dashboards.contributions.changePage(dir);
        window.cnFilterRender  = ()    => this.dashboards.contributions.filterRender();

        // Page switching
        window.switchPage = (page) => this.switchPage(page);
    }

    async IncludeHTML() {
        const elements = document.querySelectorAll('[data-include]');
        const tasks = Array.from(elements).map(async (el) => {
            const file = el.getAttribute('data-include');
            if (!file) return;
            try {
                const res = await fetch(file);
                if (res.ok) {
                    el.innerHTML = await res.text();
                } else {
                    console.error(`Failed to load ${file}: ${res.status}`);
                }
            } catch (err) {
                console.error('Error loading component:', err);
            }
        });

        await Promise.all(tasks);

        this.initNavigation();
        this.initActiveDashboards();
        this.initModalOverlayClose();
    }

    start() {
        this.exposeGlobals();
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.IncludeHTML());
        } else {
            this.IncludeHTML();
        }
    }
}

/* ============================================
   BOOTSTRAP
   ============================================ */
const app = new DashboardApp();
app.start();