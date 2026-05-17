import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { cache } from "../utils/data_cache.js";

/* ============================================
   DASHBOARD 7: CONTRIBUTIONS
   ============================================ */

export class ContributionsDashboard {
    constructor(store) {
        this.store = store;
        this.avatarColors = ['#7a0c0c', '#2980b9', '#27ae60', '#8e44ad', '#16a085', '#e67e22', '#c0392b', '#1a5276', '#784212', '#1f618d'];
        this.PER_PAGE = 8;
    }

    async sync() {
        // Both riders and contributions share the cache —
        // if DriversDashboard already fetched riders this tick, this is free
        const [cnData, riderData] = await Promise.all([
            cache.fetch('/admin/contributions'),
            cache.fetch('/admin/riders'),
        ]);

        if (Array.isArray(cnData)) {
            this.store.cnData = cnData;
            this.filterRender();
        }
        if (Array.isArray(riderData)) {
            this.store.drData = riderData;
        }
    }

    initials(r) { return (r.full_name[0] + r.last_name[0]).toUpperCase(); }

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
            const name = `${r.full_name} ${r.last_name} ${r.body_number} ${r.driverid}`.toLowerCase();
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
                                <div class="cn-driver-name">${r.full_name} ${r.last_name}</div>
                                <div class="cn-driver-id">${r.driverid}</div>
                            </div>
                        </div>
                    </td>
                    <td><strong>#${r.body_number}</strong></td>
                    <td><span class="cn-amount ${amtClass}">₱${Number(r.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></td>
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
        const isEdit    = this.store.cnEditIdx !== null;
        const titleEl   = DashboardUtils.getEl('cn-modal-title');
        const subEl     = DashboardUtils.getEl('cn-modal-sub');
        const saveLabel = DashboardUtils.getEl('cn-save-label');

        if (titleEl)   titleEl.textContent   = isEdit ? 'Edit Contribution' : 'Add Contribution';
        if (subEl)     subEl.textContent     = isEdit
            ? `Editing record for ${this.store.cnData[idx].full_name} ${this.store.cnData[idx].last_name}.`
            : 'Record a driver\'s butaw/contribution.';
        if (saveLabel) saveLabel.textContent = isEdit ? 'Save Changes' : 'Save Record';

        // ── Populate driver dropdown from riders store ──────────────
        const driverSelect = DashboardUtils.getEl('cn-driver-select');
        if (driverSelect) {
            const riders = this.store.drData || [];
            driverSelect.innerHTML =
                `<option value="">— Select Driver —</option>` +
                riders.map(d =>
                    `<option value="${d.id || d._id}|${d.full_name}|${d.last_name}|${d.body_number}">
                        ${d.full_name} ${d.last_name} · #${d.body_number}
                    </option>`
                ).join('');

            // Auto-fill body number on driver change
            driverSelect.onchange = () => {
                const parts = driverSelect.value.split('|');
                const bodyInput = DashboardUtils.getEl('cn-body');
                if (bodyInput) bodyInput.value = parts[3] || '';
            };
        }

        if (isEdit) {
            const r = this.store.cnData[idx];

            // Pre-select the driver in the dropdown
            const driverSelect = DashboardUtils.getEl('cn-driver-select');
            if (driverSelect) {
                Array.from(driverSelect.options).forEach(o => {
                    const parts = o.value.split('|');
                    if (parts[1] === r.full_name && parts[2] === r.last_name) {
                        o.selected = true;
                    }
                });
            }

            DashboardUtils.setVal('cn-body',     r.body_number);
            DashboardUtils.setVal('cn-amount',   r.amount);
            DashboardUtils.setVal('cn-date',     r.date);
            DashboardUtils.setVal('cn-notes',    r.notes);

            const periodSelect = DashboardUtils.getEl('cn-period');
            const statusSelect = DashboardUtils.getEl('cn-paystatus');
            if (periodSelect) periodSelect.value = r.period;
            if (statusSelect) statusSelect.value = r.status;
        } else {
            const driverSelect = DashboardUtils.getEl('cn-driver-select');
            if (driverSelect) driverSelect.selectedIndex = 0;
            DashboardUtils.setVal('cn-body',   '');
            DashboardUtils.setVal('cn-amount', '250');
            DashboardUtils.setVal('cn-date',   new Date().toISOString().split('T')[0]);
            const periodSelect = DashboardUtils.getEl('cn-period');
            const statusSelect = DashboardUtils.getEl('cn-paystatus');
            if (periodSelect) periodSelect.selectedIndex = 0;
            if (statusSelect) statusSelect.selectedIndex = 0;
        }

        DashboardUtils.openModal('cn-modal');
    }

    closeModal() {
        DashboardUtils.closeModal('cn-modal');
    }

    async save() {
        const driverVal = DashboardUtils.getEl('cn-driver-select')?.value;
        const amount    = parseFloat(DashboardUtils.getEl('cn-amount')?.value) || 0;
        const date      = DashboardUtils.getEl('cn-date')?.value;
        const status    = DashboardUtils.getEl('cn-paystatus')?.value;

        if (!driverVal) {
            DashboardUtils.getEl('cn-driver-select')?.focus();
            return;
        }

        const [driverId, fname, lname, body] = driverVal.split('|');

        const payLoad = {
            full_name:   fname,
            last_name:   lname,
            body_number: body || '—',
            driverid:    driverId,
            amount,
            date,
            status,
            notes: null,
        };

        let result;
        if (this.store.cnEditIdx !== null) {
            const id = this.store.cnData[this.store.cnEditIdx].id
                    || this.store.cnData[this.store.cnEditIdx]._id;
            result = await ApiService.call(`/admin/contributions/${id}`, 'PUT', payLoad);
            if (result) {
                DashboardUtils.showToast(`${fname} ${lname}'s record updated`);
                window.ActivityLog?.push({
                    icon: 'contrib',
                    title: 'Contribution Updated',
                    desc: `${fname} ${lname} - ₱${amount}`  // ← also fixed: was using undefined `period`
                });
            }
        } else {
            result = await ApiService.call('/admin/contributions', 'POST', payLoad);
            if (result) {
                DashboardUtils.showToast(`Contribution for ${fname} ${lname} recorded`);
                window.ActivityLog?.push({
                    icon: 'contrib',
                    title: 'Contribution Recorded',
                    desc: `${fname} ${lname} - ₱${amount}`
                });
            }
        }

        if (result) {
            cache.invalidate('/admin/contributions');
            this.closeModal();
            // Invalidate only the endpoints this save affected
            await this.sync();
            // Don't call syncAll — only sync pages that care about contributions
            this.dashboards?.analysis?.sync();
        }
    }

    openConfirm(idx) {
        this.store.cnDeleteIdx = idx;
        const r = this.store.cnData[idx];
        const subEl = DashboardUtils.getEl('cn-confirm-sub');
        if (subEl) subEl.textContent = `Delete contribution record for ${r.full_name} ${r.last_name}?`;
        DashboardUtils.openModal('cn-confirm');
    }

    closeConfirm() {
        DashboardUtils.closeModal('cn-confirm');
        this.store.cnDeleteIdx = null;
    }

    async confirmDelete() {
        if (this.store.cnDeleteIdx === null) return;
        const record = this.store.cnData[this.store.cnDeleteIdx];
        const id = record.id || record._id;
        const result = await ApiService.call(`/admin/contributions/${id}`, 'DELETE');
        if (result) {
            cache.invalidate('/admin/contributions');
            DashboardUtils.showToast('Record deleted.');
            this.closeConfirm();
            await this.sync();
        }
    }

    init() {
        this.store.cnData = this.store.cnData || [];
        this.store.cnFiltered = [];
        this.store.cnPage = 1;

        this.sync(); // ← move sync after initializing store defaults

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