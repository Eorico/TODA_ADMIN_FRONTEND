import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
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
        const data = await ApiService.call('/admin/contributions', 'GET');
        if (data) {
            this.store.cnData = data;
            this.filterRender();
        }
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

    async save() {
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

        const payLoad = {
            full_name: fname, last_name: lname, body: body || '—', driverid: driverid || '—', amount, period, date, status, notes
        };

        let result;
        if (this.store.cnEditIdx !== null) {
            const id = this.store.cnData[this.store.cnEditIdx].id || this.store.cnData[this.store.cnEditIdx]._id;
            result = await ApiService.call(`/admin/contributions`, 'PUT', payLoad);
            if (result) DashboardUtils.showToast(`${fname} ${lname}'s record updated`);
            ActivityLog.push({
                icon: 'contrib',
                title: 'Contribution Updated',
                desc: `${fname} ${lname} - ${period}`
            });
        } else {
            result = await ApiService.call('/admin/contributions', 'POST', payLoad);
            if (result) DashboardUtils.showToast(`Contribution for ${fname} ${lname} recorded`);
            ActivityLog.push({
                icon: 'contrib',
                title: 'Contribution Recorded',
                desc: `${fname} ${lname} - ₱${amount}`
            });
        }

        if (result) {
            this.closeModal();
            await this.sync();
        }

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

    async confirmDelete() {
        if (this.store.cnDeleteIdx === null) return;
        const record = this.store.cnData[this.store.cnDeleteIdx];
        const id = record.id || record._id;
        const result = await ApiService.call(`/admin/contributions/${id}`, 'DELETE');
        if (result) {
            DashboardUtils.showToast('Record deleted.');
            this.closeConfirm();
            await this.sync
        }
    }

    init() {
        this.sync();
        this.store.cnFiltered = [...this.store.cnData];
        this.store.cnPage = 1;

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