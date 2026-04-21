import { DashboardUtils } from "../utils/utils.js";
import { ApiService }     from "../api/api_service.js";
import { ActivityLog }    from "../utils/activity_log.js";

export class CodingDashboard {
    constructor(store) {
        this.store = store;
        this.statusLabels = { active: 'Active', suspended: 'Suspended', 'open-win': 'Open Window' };
    }

    // ── sync: fetch coding + violations + riders in parallel ──────
    async sync() {
        const [codingData, violationData, riderData] = await Promise.all([
            ApiService.call('/admin/coding',     'GET'),
            ApiService.call('/admin/violations', 'GET'),
            ApiService.call('/admin/riders',     'GET'),
        ]);

        if (codingData) {
            this.store.tcData = codingData;
            this.render();
            if (window.announcementsDashboard) {
                window.announcementsDashboard.renderCodingGrid();
            }
        }
        if (violationData) {
            this.store.vioData = violationData;
            this.renderViolations();
        }
        if (riderData) {
            this.store.drData = riderData;
        }
    }

    // ── Coding schedule render ─────────────────────────────────────
    render() {
        const tbody = DashboardUtils.getEl('tc-table-body');
        if (!tbody) return;

        const dataList = this.store.tcData || [];
        const totalEl  = DashboardUtils.getEl('tc-total');
        if (totalEl) totalEl.textContent = dataList.length;

        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const today    = dayNames[new Date().getDay()];
        const todaySchedules = dataList.filter(t =>
            t.day === today || t.day.includes(today.substring(0, 3))
        );

        const todayEl    = DashboardUtils.getEl('tc-today-label');
        const todayDetail = DashboardUtils.getEl('tc-today-detail');
        const todayTime  = DashboardUtils.getEl('tc-today-time');
        const activeToday = DashboardUtils.getEl('tc-active-today');

        if (todayEl) {
            if (todaySchedules.length) {
                todayEl.textContent = `Today (${today}) — Restricted Body Numbers:`;
                if (todayDetail)  todayDetail.textContent  = todaySchedules.map(t => t.bodyRange).join(', ');
                if (todayTime)    todayTime.textContent    = todaySchedules[0].time;
                if (activeToday)  activeToday.textContent  = todaySchedules.map(t => t.bodyRange).join(', ');
            } else {
                todayEl.textContent = `Today (${today})`;
                if (todayDetail)  todayDetail.textContent  = 'No Restriction';
                if (todayTime)    todayTime.textContent    = 'All body numbers may operate freely';
                if (activeToday)  activeToday.textContent  = 'None';
            }
        }

        tbody.innerHTML = dataList.map((t, i) => {
            const isToday     = t.day === today || t.day.includes(today.substring(0, 3));
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

    // ── Violation render ───────────────────────────────────────────
    renderViolations() {
        const tbody  = DashboardUtils.getEl('vio-table-body');
        if (!tbody) return;

        const data   = this.store.vioData || [];
        const countEl = DashboardUtils.getEl('tc-vio-count');
        if (countEl) countEl.textContent = data.length;

        if (!data.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;font-size:13px">
                        No violations recorded.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = data.map((v, i) => `
            <tr>
                <td>
                    <div class="tc-vio-name">${v.driver_name}</div>
                    <div class="tc-vio-body">${v.driver_id}</div>
                </td>
                <td><strong>#${v.body}</strong></td>
                <td>${v.date}</td>
                <td>${v.violation}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="tc-penalty ${v.penalty}">
                            ${v.penalty === 'fine'
                                ? (v.penalty_amount || '₱500.00') + ' Fine'
                                : 'Warning'}
                        </span>
                        <button class="tc-btn-del" onclick="window.openVioConfirm(${i})" title="Delete" style="width:26px;height:26px">
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                    </div>
                </td>
            </tr>`
        ).join('');
    }

    // ── Coding modal ───────────────────────────────────────────────
    openModal(idx) {
        this.store.tcEditIdx = idx !== undefined ? idx : null;
        const isEdit    = this.store.tcEditIdx !== null;
        const titleEl   = DashboardUtils.getEl('tc-modal-title');
        const subEl     = DashboardUtils.getEl('tc-modal-sub');
        const saveLabel = DashboardUtils.getEl('tc-save-label');
        if (titleEl)   titleEl.textContent   = isEdit ? 'Edit Coding Schedule' : 'Add Coding Schedule';
        if (subEl)     subEl.textContent     = isEdit ? 'Update this coding window.' : 'Define an operational window for a body number range.';
        if (saveLabel) saveLabel.textContent = isEdit ? 'Save Changes' : 'Add Schedule';

        if (isEdit) {
            const t = this.store.tcData[idx];
            const daySelect    = DashboardUtils.getEl('tc-day');
            const statusSelect = DashboardUtils.getEl('tc-status');
            if (daySelect)    daySelect.value    = t.day;
            if (statusSelect) statusSelect.value = t.status;
            DashboardUtils.setVal('tc-body-range',  t.bodyRange);
            DashboardUtils.setVal('tc-time',        t.time);
            DashboardUtils.setVal('tc-route',       t.route);
            DashboardUtils.setVal('tc-effectivity', t.effectivity);
        } else {
            const daySelect    = DashboardUtils.getEl('tc-day');
            const statusSelect = DashboardUtils.getEl('tc-status');
            if (daySelect)    daySelect.selectedIndex    = 0;
            if (statusSelect) statusSelect.selectedIndex = 0;
            DashboardUtils.clearFields(['tc-body-range','tc-time','tc-route','tc-effectivity']);
        }
        DashboardUtils.openModal('coding-modal');
    }

    closeModal() { DashboardUtils.closeModal('coding-modal'); }

    async save() {
        const day        = DashboardUtils.getEl('tc-day')?.value;
        const status     = DashboardUtils.getEl('tc-status')?.value;
        const bodyRange  = DashboardUtils.getEl('tc-body-range')?.value.trim();
        const time       = DashboardUtils.getEl('tc-time')?.value.trim();
        const route      = DashboardUtils.getEl('tc-route')?.value.trim();
        const effectivity = DashboardUtils.getEl('tc-effectivity')?.value;
        if (!bodyRange) { DashboardUtils.getEl('tc-body-range')?.focus(); return; }

        const payLoad = { day, bodyRange, time: time || 'Not specified', status, route: route || 'All Routes', effectivity };
        const isEdit  = this.store.tcEditIdx !== null;
        let result;

        if (isEdit) {
            const id = this.store.tcData[this.store.tcEditIdx].id || this.store.tcData[this.store.tcEditIdx]._id;
            result = await ApiService.call(`/admin/coding/${id}`, 'PUT', payLoad);
        } else {
            result = await ApiService.call('/admin/coding', 'POST', payLoad);
        }

        if (result) {
            DashboardUtils.showToast(isEdit ? 'Coding schedule updated' : `Coding schedule for ${day} added.`);
            ActivityLog.push({
                icon: 'coding',
                title: isEdit ? 'Coding Schedule Updated' : 'Coding Schedule Added',
                desc: `${day} · Body Nos. ${bodyRange}`
            });
            this.closeModal();
            await this.sync();
        }
    }

    openConfirm(idx) {
        this.store.tcDeleteIdx = idx;
        const subEl = DashboardUtils.getEl('coding-confirm-sub');
        if (subEl) subEl.textContent = `Delete the coding schedule for ${this.store.tcData[idx].day} (Body Nos. ${this.store.tcData[idx].bodyRange})?`;
        DashboardUtils.openModal('coding-confirm');
    }

    closeConfirm() {
        DashboardUtils.closeModal('coding-confirm');
        this.store.tcDeleteIdx = null;
    }

    async confirmDelete() {
        if (this.store.tcDeleteIdx === null) return;
        const entry  = this.store.tcData[this.store.tcDeleteIdx];
        const id     = entry.id || entry._id;
        const result = await ApiService.call(`/admin/coding/${id}`, 'DELETE');
        if (result) {
            DashboardUtils.showToast('Schedule deleted.');
            ActivityLog.push({ icon: 'coding', title: 'Coding Schedule Deleted', desc: `${entry.day} · ${entry.bodyRange}` });
            this.closeConfirm();
            await this.sync();
        }
    }

    // ── Violation modal ────────────────────────────────────────────
    openVioModal() {
        const driverSelect = DashboardUtils.getEl('vio-driver-select');
        if (driverSelect) {
            const riders = this.store.drData || [];
            driverSelect.innerHTML = `<option value="">— Select Driver —</option>` +
                riders.map(d =>
                    `<option value="${d.id}|${d.fname} ${d.lname}|${d.body}">${d.fname} ${d.lname} · #${d.body}</option>`
                ).join('');
        }
        const dateInput = DashboardUtils.getEl('vio-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        this.togglePenaltyAmount();
        DashboardUtils.openModal('vio-modal');
    }

    closeVioModal() {
        DashboardUtils.closeModal('vio-modal');
        DashboardUtils.clearFields(['vio-violation', 'vio-amount']);
    }

    togglePenaltyAmount() {
        const penalty = DashboardUtils.getEl('vio-penalty')?.value;
        const amtRow  = DashboardUtils.getEl('vio-amount-row');
        if (amtRow) amtRow.style.display = penalty === 'fine' ? 'grid' : 'none';
    }

    async saveViolation() {
        const driverVal = DashboardUtils.getEl('vio-driver-select')?.value;
        const dateRaw   = DashboardUtils.getEl('vio-date')?.value;
        const violation = DashboardUtils.getEl('vio-violation')?.value.trim();
        const penalty   = DashboardUtils.getEl('vio-penalty')?.value;
        const amount    = DashboardUtils.getEl('vio-amount')?.value.trim();

        if (!driverVal) { DashboardUtils.getEl('vio-driver-select')?.focus(); return; }
        if (!violation) { DashboardUtils.getEl('vio-violation')?.focus(); return; }

        const [driver_id, driver_name, body] = driverVal.split('|');
        const date = dateRaw
            ? new Date(dateRaw + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Today';

        const payload = {
            driver_id, driver_name, body, date, violation, penalty,
            penalty_amount: penalty === 'fine' ? (amount ? `₱${amount}` : '₱500.00') : null
        };

        const result = await ApiService.call('/admin/violations', 'POST', payload);
        if (result) {
            DashboardUtils.showToast(`Violation recorded for ${driver_name}.`);
            ActivityLog.push({
                icon: 'coding',
                title: 'Violation Recorded',
                desc: `${driver_name} · #${body} · ${penalty === 'fine' ? payload.penalty_amount + ' Fine' : 'Warning'}`
            });
            this.closeVioModal();
            await this.sync();
        }
    }

    // ── Violation delete ───────────────────────────────────────────
    openVioConfirm(idx) {
        this.store.vioDeleteIdx = idx;
        const v     = this.store.vioData[idx];
        const subEl = DashboardUtils.getEl('vio-confirm-sub');
        if (subEl) subEl.textContent = `Delete violation record for ${v.driver_name} on ${v.date}?`;
        DashboardUtils.openModal('vio-confirm');
    }

    closeVioConfirm() {
        DashboardUtils.closeModal('vio-confirm');
        this.store.vioDeleteIdx = null;
    }

    async confirmDeleteVio() {
        if (this.store.vioDeleteIdx == null) return;
        const v      = this.store.vioData[this.store.vioDeleteIdx];
        const id     = v.id || v._id;
        const result = await ApiService.call(`/admin/violations/${id}`, 'DELETE');
        if (result) {
            DashboardUtils.showToast('Violation removed.');
            ActivityLog.push({ icon: 'coding', title: 'Violation Deleted', desc: `${v.driver_name} · ${v.date}` });
            this.closeVioConfirm();
            await this.sync();
        }
    }

    // ── init ───────────────────────────────────────────────────────
    init() {
        this.sync();
        DashboardUtils.bindOverlayClose('coding-modal',  () => this.closeModal());
        DashboardUtils.bindOverlayClose('coding-confirm',() => this.closeConfirm());
        DashboardUtils.bindOverlayClose('vio-modal',     () => this.closeVioModal());
        DashboardUtils.bindOverlayClose('vio-confirm',   () => this.closeVioConfirm());
    }
}