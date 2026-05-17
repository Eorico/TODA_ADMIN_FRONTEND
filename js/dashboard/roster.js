import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";
import { cache } from "../utils/data_cache.js";

export class RosterDashboard {
    constructor(store) {
        this.store   = store;
        this.editIdx = null;
    }

    async sync() {
        const data = await cache.fetch('/admin/roster');
        const members = Array.isArray(data) ? data : (this.store.members || []);
        this.store.members = members;
        this.renderRoster(members);
        this.updateStats(members);
    }

    updateStats(members) {
        const norm      = s => (s || '').toLowerCase();
        const total     = members.length;
        const active    = members.filter(m => norm(m.status) === 'active').length;
        const inactive  = members.filter(m => norm(m.status) === 'inactive').length;
        const suspended = members.filter(m => norm(m.status) === 'suspended').length;

        const set = (id, val) => {
            const el = DashboardUtils.getEl(id);
            if (el) el.textContent = val;
        };
        set('stat-total',     total);
        set('stat-active',    active);
        set('stat-inactive',  inactive);
        set('stat-suspended', suspended);
    }

    renderRoster(list) {
        const tbody = DashboardUtils.getEl('roster-body');
        if (!tbody) return;

        if (!list || !list.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">
                        No members found.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = list.map((m, i) => {
            const displayName = m.full_name || '';
            const memberId    = m.id || m._id || '—';
            const bodyNo      = m.body_number || memberId;
            const email       = m.email   || '—';
            const contact     = m.contact || '—';

            return `
                <tr>
                <td>
                    <div class="member-name">${displayName}</div>
                    <div class="member-id">Member ID · #${memberId}</div>
                </td>
                <td>#${bodyNo}</td>
                <td>
                    <span class="badge ${DashboardUtils.badgeClass(m.status)}">${m.status}</span>
                </td>
                <td>
                    <div style="font-size:12px">${email}</div>
                    <div style="font-size:12px;color:var(--text-light)">${contact}</div>
                </td>
                <td>
                    <button class="btn-edit"
                    onclick="window.openModal('${displayName}', '${memberId}', '${bodyNo}', '${m.status}', '', ${i})">
                    Edit
                    </button>
                </td>
                </tr>`;
        }).join('');
    }

    openModal(name, id, body_number, status, contrib, idx) {
        this.editIdx = idx !== undefined ? idx : null;

        const modalNameEl   = DashboardUtils.getEl('modal-name');
        const modalBodyEl   = DashboardUtils.getEl('modal-body');
        const modalStatusEl = DashboardUtils.getEl('modal-status');

        if (modalNameEl)  modalNameEl.textContent = `${name} (#${id})`;
        if (modalBodyEl)  modalBodyEl.value       = body_number;
        if (modalStatusEl) {
            Array.from(modalStatusEl.options).forEach(o => {
                o.selected = o.text.startsWith(status);
            });
        }

        DashboardUtils.openModal('edit-modal');
    }

    async save() {
        if (this.editIdx === null) return;

        const statusEl  = DashboardUtils.getEl('modal-status');
        const statusVal = statusEl?.value || '';
        const member    = this.store.members[this.editIdx];
        if (!member) return;

        const payload = {
            ...member,
            status: statusVal || member.status,
        };

        // ── 1. Close modal immediately ───────────────────────────────
        DashboardUtils.closeModal('edit-modal');

        // ── 2. Optimistic update ─────────────────────────────────────
        this.store.members[this.editIdx] = {
            ...member,
            status: statusVal || member.status,
        };
        this.renderRoster(this.store.members);
        this.updateStats(this.store.members);

        DashboardUtils.showToast(`${member.full_name}'s record updated.`);
        ActivityLog.push({
            icon:  'User',
            title: 'Member Record Updated',
            desc:  `${member.full_name}'s status set to ${statusVal || member.status}`,
        });

        // ── 3. Send to server in background ─────────────────────────
        const id     = member._id || member.id;
        const result = await ApiService.call(`/admin/roster/${id}`, 'PUT', payload);

        if (result) {
            cache.invalidate('/admin/roster');
            await this.sync();
        } else {
            // Revert on failure
            this.store.members[this.editIdx] = member;
            this.renderRoster(this.store.members);
            DashboardUtils.showToast('Update failed — changes reverted.');
        }
    }

    init() {
        this.sync();
        const searchInput = DashboardUtils.getEl('member-search');
        if (searchInput) {
            searchInput.oninput = () => {
                const q = searchInput.value.toLowerCase();
                this.renderRoster(
                    this.store.members.filter(m => {
                        const name = (`${m.full_name} ${m.last_name || ''}`).toLowerCase();
                        return name.includes(q)
                            || String(m.id || '').includes(q)
                            || String(m.body_number || '').includes(q);
                    })
                );
            };
        }
        DashboardUtils.bindOverlayClose('edit-modal', () => DashboardUtils.closeModal('edit-modal'));
    }
}