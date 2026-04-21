import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";

export class RosterDashboard {
    constructor(store) {
        this.store = store;
        this.editIdx = null;
    }

    async sync() {
        const data = await ApiService.call('/admin/roster', 'GET');
        if (data) {
            this.store.members = data;
            this.renderRoster(this.store.members);
            this.updateStats(this.store.members); // ← live counts
        }
    }

    updateStats(members) {
        const norm = s => (s||'').toLowerCase();
        const total      = members.length;
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

        // Also keep the roster subtitle in sync
        const sub = DashboardUtils.getEl('roster-sub');
        if (sub) sub.textContent = `Managing ${total} authorized transport personnel.`;
    }

    renderRoster(list) {
        const tbody = DashboardUtils.getEl('roster-body');
        if (!tbody) return;
        tbody.innerHTML = list.map((m, i) => `
            <tr>
                <td><div class="member-name">${m.name}</div><div class="member-id">Member ID · #${m.id}</div></td>
                <td>#${m.id}</td>
                <td><span class="badge ${DashboardUtils.badgeClass(m.status)}">${m.status}</span></td>
                <td>${m.contrib} <span style="color:var(--text-light);font-size:11px">· ${m.date}</span></td>
                <td><button class="btn-edit" onclick="window.openModal('${m.name}', '${m.id}', '${m.status}', '${m.contrib.replace('₱', '')}', ${i})">Edit</button></td>
            </tr>
        `).join('');
    }

    openModal(name, id, status, contrib, idx) {
        this.editIdx = idx !== undefined ? idx : null;
        const modalNameEl    = DashboardUtils.getEl('modal-name');
        const modalBodyEl    = DashboardUtils.getEl('modal-body');
        const modalContribEl = DashboardUtils.getEl('modal-contrib');
        const modalStatusEl  = DashboardUtils.getEl('modal-status');
        if (modalNameEl)    modalNameEl.textContent = `${name} (#${id})`;
        if (modalBodyEl)    modalBodyEl.value = id;
        if (modalContribEl) modalContribEl.value = contrib;
        if (modalStatusEl) {
            Array.from(modalStatusEl.options).forEach(o => { o.selected = o.text.startsWith(status); });
        }
        DashboardUtils.openModal('edit-modal');
    }

    async save() {
        if (this.editIdx === null) return;
        const contrib   = DashboardUtils.getEl('modal-contrib')?.value.trim();
        const statusEl  = DashboardUtils.getEl('modal-status');
        const statusVal = statusEl?.value || '';
        const member    = this.store.members[this.editIdx];
        if (!member) return;

        const payload = {
            ...member,
            contrib: contrib ? '₱' + contrib : member.contrib,
            status:  statusVal || member.status,
            date:    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };

        const id = member._id || member.id;
        const result = await ApiService.call(`/admin/roster/${id}`, 'PUT', payload);

        if (result) {
            DashboardUtils.closeModal('edit-modal');
            DashboardUtils.showToast(`${member.name}'s record updated.`);
            await this.sync(); // re-fetches + re-renders + re-counts
        }

        ActivityLog.push({
            icon: 'User',
            title: 'Member Record Updated',
            desc: `${member.name}'s status set to ${statusVal || member.status}`
        });
    }

    init() {
        this.sync();
        const searchInput = DashboardUtils.getEl('member-search');
        if (searchInput) {
            searchInput.oninput = () => {
                const q = searchInput.value.toLowerCase();
                // ✅ fixed: was referencing undefined `members`
                this.renderRoster(
                    this.store.members.filter(m =>
                        m.name.toLowerCase().includes(q) || String(m.id).includes(q)
                    )
                );
            };
        }
        DashboardUtils.bindOverlayClose('edit-modal', () => DashboardUtils.closeModal('edit-modal'));
    }
}