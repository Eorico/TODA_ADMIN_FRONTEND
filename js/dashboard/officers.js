import { DashboardUtils } from "../utils/utils.js";

/* ============================================
   DASHBOARD 5: OFFICERS MANAGEMENT
   ============================================ */
export class OfficersDashboard {
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