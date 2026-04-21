import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";
/* ============================================
   DASHBOARD 3: DRIVERS REGISTRY
   ============================================ */
export class DriversDashboard {
    constructor(store) {
        this.store = store;
        this.avatarColors = ['#c0392b', '#e67e22', '#2980b9', '#27ae60', '#8e44ad', '#16a085'];
        this.PER_PAGE = 4;
    }

    async sync() {
        const data = await ApiService.call('/admin/riders', 'GET');
        if (data) {
            this.store.drData = data;
            this.render();
        }
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

    async delete(idx) {
        const driver = this.store.drData[idx];
        const id = driver.id || driver._id;

        if (!confirm(`Are you sure you want to remove ${driver.fname} ${driver.lname}`)) return;

        const result = await ApiService.call(`/admin/riders/${id}`, 'DELETE');
        if (result) {
            DashboardUtils.showToast('Driver removed from registry.');
            ActivityLog.push({ 
                icon: 'user', 
                title: 'Driver Removed', 
                desc: `${driver.fname} ${driver.lname}` 
            });
            await this.sync();
        }
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

    async save() {
        const fname = DashboardUtils.getEl('drv-fname')?.value.trim();
        const lname = DashboardUtils.getEl('drv-lname')?.value.trim();
        const body = DashboardUtils.getEl('drv-body')?.value.trim();
        const contact = DashboardUtils.getEl('drv-contact')?.value.trim();
        const status = DashboardUtils.getEl('drv-status')?.value;
        if (!fname || !lname) { DashboardUtils.getEl('drv-fname')?.focus(); return; }

        const payload = {
            fname, lname,  body: body || '---', contact: contact ? `+63 ${contact}` : '-', status: status || 'Active'
        }

        let result;
        if (this.store.drEditIdx !== null) {
            // UPDATE
            const id = this.store.drData[this.store.drEditIdx].id || this.store.drData[this.store.drEditIdx]._id;
            result = await ApiService.call(`/admin/riders/${id}`, 'PUT', payload);
        } else {
            // CREATE (Note: If your backend requires registration, this may vary)
            result = await ApiService.call('/admin/riders', 'POST', payload);
        }

        if (result) {
            DashboardUtils.closeModal('driver-modal');
            DashboardUtils.showToast(this.store.drEditIdx !== null ? 'Profile updated' : 'Driver added');
            ActivityLog.push({
                icon: 'user',
                title: this.store.drEditIdx !== null ? 'Driver Profile Updated' : 'New Driver Registered',
                desc: `${fname} ${lname} · Body #${body}`
            });
            await this.sync();
        }
    }

    init() {
        this.sync();
        if (!this.store.drData) this.store.drData = [...this.store.driverData];
        this.store.drPage = 1;
        DashboardUtils.bindOverlayClose('driver-modal', () => DashboardUtils.closeModal('driver-modal'));
    }
}