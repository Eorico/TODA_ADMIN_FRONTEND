import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";
const ICONS = {
    user:     `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
    contrib:  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    fare:     `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
    announce: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    lost:     `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
    coding:   `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
};

export class MainDashboard {
    constructor(store) {
        this.store = store
    }
    
    async sync() {
        const [constributions, members, lostFound] = await Promise.all([
            ApiService.call('/admin/contributions', 'GET'),
            ApiService.call('/admin/roster', 'GET'),
            ApiService.call('/admin/lost-found', 'GET'),
        ]);

        this.store.members = members || [];

        this.updateContributions(constributions);
        this.updateLostItems(lostFound);
        this.updateActiverDrivers(members);
        this.renderActivity();
    }

    updateContributions(data) {
        if (!data) return;
        const total = data.reduce((sum, r) => sum + Number(r.amount), 0);
        const el = DashboardUtils.getEl('dash-total-contrib');
        if (el) el.textContent = '₱' + total.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    }

    updateActiverDrivers(data) {
        if (!data) return;
        const active = data.filter(m => (m.status || '').toLowerCase() === 'active');
        const el = DashboardUtils.getEl('dash-active-drivers');
        if (el) el.textContent = active.length;  // ✅ .length
    }

    updateLostItems(data) {
        if (!data) return;
        const pending = data.filter(i => (i.status || '').toLowerCase() === 'pending').length;
        const el = DashboardUtils.getEl('dash-lost-items');
        if (el) el.textContent = pending;
    }

    renderActivity() {
        const container = DashboardUtils.getEl('activity-list');
        if (!container) return;

        const log = ActivityLog.get();

        if (!log.length) {
            container.innerHTML = `
                <div class="activity-item">
                    <div class="act-info" style="color:var(--text-muted);font-size:13px">
                        No recent activity yet.
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = log.slice(0, 8).map(entry => `
            <div class="activity-item">
                <div class="act-icon">${ICONS[entry.icon] || ICONS.user}</div>
                <div class="act-info">
                    <div class="act-title">${entry.title}</div>
                    <div class="act-desc">${entry.desc}</div>
                </div>
                <div class="act-time">${entry.time}</div>
            </div>
        `).join('');
    }

    init () {
        this.sync()
    }
}