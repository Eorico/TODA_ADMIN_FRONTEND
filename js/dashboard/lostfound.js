import { DashboardUtils } from "../utils/utils.js";
import { ApiService }     from "../api/api_service.js";
import { ActivityLog }    from "../utils/activity_log.js";
import { cache }          from "../utils/data_cache.js";

export class LostFoundDashboard {
    constructor(store) {
        this.store      = store;
        this._editIdx   = null;
        this._editId    = null;
    }

    async sync() {
        const data = await cache.fetch('/admin/lost-found');
        if (Array.isArray(data)) {
            this.store.lfItems = data;
            this.renderItems();
        }
    }

    // ── Status helpers ─────────────────────────────────────────
    _statusColor(status) {
        switch ((status || '').toLowerCase()) {
            case 'claimed':  return { bg: '#dcfce7', color: '#15803d', dot: '#16a34a' };
            case 'resolved': return { bg: '#e0f2fe', color: '#0369a1', dot: '#0284c7' };
            default:         return { bg: '#fef3c7', color: '#92400e', dot: '#d97706' };
        }
    }

    _itemIcon(name) {
        const n = (name || '').toLowerCase();
        if (n.includes('phone') || n.includes('samsung') || n.includes('iphone'))
            return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
        if (n.includes('wallet') || n.includes('purse'))
            return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`;
        if (n.includes('bag') || n.includes('backpack'))
            return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
        if (n.includes('key'))
            return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/></svg>`;
        if (n.includes('watch'))
            return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M12 9v3l1.5 1.5"/><path d="M9 3h6M9 21h6"/></svg>`;
        return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
    }

    // ── Render grid ────────────────────────────────────────────
    renderItems() {
        const container = DashboardUtils.getEl('lf-items-container');
        if (!container) return;

        const items = this.store.lfItems || [];
 

        if (!items.length) {
            container.innerHTML = `
                <div class="lf-empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor"
                        stroke-width="1.5" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <p>No items posted yet.</p>
                    <span style="font-size:12px;color:var(--text-light)">
                        Use the form on the left to post a recovered item.
                    </span>
                </div>`;
            return;
        }

        container.innerHTML = items.map((item, idx) => {
            const sc   = this._statusColor(item.status);
            const icon = this._itemIcon(item.name);

            return `
            <div class="lf-card" data-idx="${idx}">
                <div class="lf-card-thumb">
                    ${item.image
                        ? `<img src="${item.image}" alt="${item.name}"
                                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
                        <div class="lf-card-icon" style="display:none">${icon}</div>`
                        : `<div class="lf-card-icon">${icon}</div>`
                    }
                    <div class="lf-card-status-dot" style="background:${sc.dot}"></div>
                </div>

                <div class="lf-card-body">
                    <div class="lf-card-name">${item.name}</div>
                    <div class="lf-card-meta">
                        <svg width="11" height="11" fill="none" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${item.date}
                    </div>
                    <div class="lf-card-meta">
                        <svg width="11" height="11" fill="none" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <rect x="2" y="7" width="20" height="14" rx="2"/>
                            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        </svg>
                        Body #${item.body}
                    </div>
                    <div class="lf-card-badge"
                        style="background:${sc.bg};color:${sc.color}">
                        ${item.status}
                    </div>
                </div>

                <div class="lf-card-actions">
                    <button class="lf-action-btn lf-edit-btn"
                        onclick="window.lfDashboard.openEditModal(${idx})"
                        title="Edit item">
                        <svg width="13" height="13" fill="none" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                    </button>
                    <button class="lf-action-btn lf-del-btn"
                        onclick="window.lfDashboard.confirmDelete(${idx})"
                        title="Delete item">
                        <svg width="13" height="13" fill="none" stroke="currentColor"
                            stroke-width="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                        </svg>
                        Del
                    </button>
                </div>
            </div>`;
        }).join('');

        // Update count badge
        const countEl = DashboardUtils.getEl('lf-count');
        if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
    }

    // ── Edit modal ─────────────────────────────────────────────
    openEditModal(idx) {
        this._editIdx = idx;
        const item    = this.store.lfItems[idx];
        this._editId  = item.id || item._id;

        DashboardUtils.setVal('lf-edit-name',   item.name);
        DashboardUtils.setVal('lf-edit-body',   item.body);
        DashboardUtils.setVal('lf-edit-date',   item.date);

        const statusEl = DashboardUtils.getEl('lf-edit-status');
        if (statusEl) statusEl.value = item.status;

        // Show existing image preview
        const preview = DashboardUtils.getEl('lf-edit-img-preview');
        if (preview) {
            if (item.image) {
                preview.src   = item.image;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }

        DashboardUtils.openModal('lf-edit-modal');
    }

    closeEditModal() {
        DashboardUtils.closeModal('lf-edit-modal');
        this._editIdx = null;
        this._editId  = null;
    }

    async saveEdit() {
        if (this._editIdx === null) return;

        const name   = DashboardUtils.getEl('lf-edit-name')?.value.trim();
        const body   = DashboardUtils.getEl('lf-edit-body')?.value.trim();
        const date   = DashboardUtils.getEl('lf-edit-date')?.value.trim();
        const status = DashboardUtils.getEl('lf-edit-status')?.value;

        if (!name) { DashboardUtils.getEl('lf-edit-name')?.focus(); return; }

        const existing = this.store.lfItems[this._editIdx];

        // Check if new image was selected
        const fileInput = DashboardUtils.getEl('lf-edit-file');
        let image = existing.image;
        if (fileInput?.files?.[0]) {
            image = await this._readFileAsBase64(fileInput.files[0]);
        }

        const payload = { name, body: body || '—', date: date || existing.date, status, image };

        // ── 1. Close modal immediately ────────────────────────
        this.closeEditModal();

        // ── 2. Optimistic update ──────────────────────────────
        this.store.lfItems[this._editIdx ?? 0] = { ...existing, ...payload };
        this.renderItems();
        DashboardUtils.showToast(`"${name}" updated.`);

        // ── 3. Send to server ────────────────────────────────
        const result = await ApiService.call(`/admin/lost-found/${this._editId}`, 'PUT', payload);
        if (result) {
            ActivityLog.push({ icon: 'lost', title: 'Lost Item Updated', desc: `"${name}"` });
            cache.invalidate('/admin/lost-found');
            await this.sync();
        } else {
            // Revert on failure
            this.store.lfItems[this._editIdx ?? 0] = existing;
            this.renderItems();
            DashboardUtils.showToast('Update failed — changes reverted.');
        }
    }

    // ── Delete ─────────────────────────────────────────────────
    confirmDelete(idx) {
        const item = this.store.lfItems[idx];
        if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        this.deleteItem(idx);
    }

    async deleteItem(idx) {
        const item = this.store.lfItems[idx];
        const id   = item.id || item._id;

        // Optimistic — remove from list immediately
        const backup = [...this.store.lfItems];
        this.store.lfItems.splice(idx, 1);
        this.renderItems();
        DashboardUtils.showToast(`"${item.name}" removed.`);

        const result = await ApiService.call(`/admin/lost-found/${id}`, 'DELETE');
        if (result) {
            ActivityLog.push({ icon: 'lost', title: 'Lost Item Deleted', desc: `"${item.name}"` });
            cache.invalidate('/admin/lost-found');
            await this.sync();
        } else {
            // Revert
            this.store.lfItems = backup;
            this.renderItems();
            DashboardUtils.showToast('Delete failed — item restored.');
        }
    }

    // ── Submit new ─────────────────────────────────────────────
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

    _readFileAsBase64(file) {
        return new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload  = e => res(e.target.result);
            reader.onerror = rej;
            reader.readAsDataURL(file);
        });
    }

    async submit() {
        const name     = DashboardUtils.getEl('lf-item-name')?.value.trim();
        const bodyNum  = DashboardUtils.getEl('lf-body-num')?.value.trim();
        const dateInput = DashboardUtils.getEl('lf-date')?.value;

        if (!name) { DashboardUtils.getEl('lf-item-name')?.focus(); return; }

        const img = DashboardUtils.getEl('lf-photo-area')?.querySelector('img');
        const dateLabel = dateInput
            ? new Date(dateInput + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Today';

        const payload = {
            name, body: bodyNum || '—', date: dateLabel,
            status: 'Pending', image: img ? img.src : null,
        };

        const result = await ApiService.call('/admin/lost-found', 'POST', payload);
        if (result) {
            this.resetForm();
            DashboardUtils.showToast(`"${name}" posted to bulletin.`);
            ActivityLog.push({ icon: 'lost', title: 'Lost Item Posted', desc: `"${name}" · Body #${bodyNum || '—'}` });
            cache.invalidate('/admin/lost-found');
            await this.sync();
        }
    }

    resetForm() {
        DashboardUtils.clearFields(['lf-item-name', 'lf-body-num', 'lf-date']);
        const area = DashboardUtils.getEl('lf-photo-area');
        if (area) {
            area.classList.remove('has-image');
            area.querySelector('img')?.remove();
            area.querySelectorAll('.photo-icon,.photo-tap,.photo-hint').forEach(el => el.style.display = '');
        }
        const fi = DashboardUtils.getEl('lf-file-input');
        if (fi) fi.value = '';
    }

    init() {
        this.sync();
        this.bindPhotoUpload();
        window.lfDashboard = this;
        DashboardUtils.bindOverlayClose('lf-edit-modal', () => this.closeEditModal());
    }
}