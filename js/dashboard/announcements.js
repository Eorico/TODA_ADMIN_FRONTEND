import { DashboardUtils } from "../utils/utils.js";

/* ============================================
   DASHBOARD 4: ANNOUNCEMENTS
   ============================================ */
export class AnnouncementsDashboard {
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