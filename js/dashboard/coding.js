import { DashboardUtils } from "../utils/utils.js";

/* ============================================
   DASHBOARD 6: TRICYCLE CODING
   ============================================ */
export class CodingDashboard {
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