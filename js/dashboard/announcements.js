import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";

/* ============================================
   DASHBOARD 4: ANNOUNCEMENTS
   ============================================ */
export class AnnouncementsDashboard {
    constructor(store) {
        this.store = store;
    }

    async sync() {
        try {
            const data = await ApiService.call('/admin/announcements', 'GET');
            if (data) {
                this.store.annPosts = data;
                this.render();
            }
        } catch (error) {
            DashboardUtils.showToast('Failed to load announcements', 'error');
        }
    }

    renderCodingGrid() {
        const grid = DashboardUtils.getEl('ann-coding-grid');
        if (!grid) return;

        const tcData = this.store.tcData || [];
        if (!tcData.length) {
            grid.innerHTML = `<div style="color:var(--text-muted);font-size:13px;padding:12px">No coding schedules defined yet.</div>`;
            return;
        }

        grid.innerHTML = tcData.map(t => {
            const isOpen = t.bodyRange === 'ALL' || t.status === 'open-win';
            return `
                <div class="coding-day ${isOpen ? 'open-win' : ''}">
                    <div class="coding-day-label">${t.day}</div>
                    <div class="coding-day-nums">${t.bodyRange}</div>
                    <div class="coding-day-foot" style="${isOpen ? 'color:#7a6000' : ''}">
                        ${isOpen ? 'Open Window' : 'Ending Body No.'}
                    </div>
                </div>
            `;
        }).join('');

        const countEl = DashboardUtils.getEl('ann-count');
        if (countEl) countEl.textContent = `${this.store.annPosts.length} active`;

        // ✅ Always re-render the coding grid alongside announcements
        this.renderCodingGrid();
    }

    render() {
        const container = DashboardUtils.getEl('ann-posts-list');
        if (!container) return;

        // Note: Change p.id to p.id or p._id depending on your FastAPI return
        container.innerHTML = this.store.annPosts.map(p => `
            <div class="ann-post-item" id="ann-post-${p.id}">
                <div class="ann-post-top">
                    <span class="ann-post-badge ${p.type}">${p.type.charAt(0).toUpperCase() + p.type.slice(1)}</span>
                    <button class="ann-post-del" onclick="window.deleteAnnouncement('${p.id}')" title="Delete">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                </div>
                <div class="ann-post-title">${p.title}</div>
                <div class="ann-post-body">${p.body}</div>
                <div class="ann-post-foot">
                    <div class="ann-post-time">${p.time}</div>
                    <div class="ann-post-author">by ${p.author || 'Admin'}</div>
                </div>
            </div>
        `).join('');

        const countEl = DashboardUtils.getEl('ann-count');
        if (countEl) countEl.textContent = `${this.store.annPosts.length} active`;
    }

    async delete(id) {
        if (!confirm("Delete this announcement?")) return;

        // Line 53 is likely around here
        const result = await ApiService.call(`/admin/announcements/${id}`, 'DELETE');
        
        if (result) {
            this.store.annPosts = this.store.annPosts.filter(p => p.id !== id);
            this.render();
            DashboardUtils.showToast('Announcement removed.');
        }
    }

    async post() {
        const title = DashboardUtils.getEl('ann-new-title')?.value.trim();
        const body = DashboardUtils.getEl('ann-new-body')?.value.trim();
        const type = DashboardUtils.getEl('ann-new-type')?.value;

        if (!title) return;

        const payload = { 
            type, 
            title, 
            body: body || '—', 
            time: new Date().toLocaleString(), 
            author: 'Admin' 
        };

        const newPost = await ApiService.call('/admin/announcements', 'POST', payload);
        
        if (newPost) {
            await this.sync();  
            DashboardUtils.setVal('ann-new-title', '');
            DashboardUtils.setVal('ann-new-body', '');
            DashboardUtils.showToast(`Posted: ${title}`);
        }
    }

    init() {
        this.sync();
    }
}