import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
/* ============================================
   DASHBOARD 1: MEMBER ROSTER
   ============================================ */
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
        }
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
        const modalNameEl = DashboardUtils.getEl('modal-name');
        const modalBodyEl = DashboardUtils.getEl('modal-body');
        const modalContribEl = DashboardUtils.getEl('modal-contrib');
        const modalStatusEl = DashboardUtils.getEl('modal-status');
        if (modalNameEl) modalNameEl.textContent = `${name} (#${id})`;
        if (modalBodyEl) modalBodyEl.value = id;
        if (modalContribEl) modalContribEl.value = contrib;
        if (modalStatusEl) {
            Array.from(modalStatusEl.options).forEach(o => { o.selected = o.text.startsWith(status); });
        }
        DashboardUtils.openModal('edit-modal');
    }

    async save() {
        if (this.editIdx === null) return;
        const contrib = DashboardUtils.getEl('modal-contrib')?.value.trim();
        const statusEl = DashboardUtils.getEl('modal-status');
        const statusVal = statusEl?.value || '';

        const member = this.store.members[this.editIdx];
        if (!member) return;

        const payload = {
            ...member, 
            contrib: contrib ? '₱' + contrib : member.contrib,
            status: statusVal || member.status,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };

        const id = member._id || member.id; 
        const result = await ApiService.call(`/admin/roster/${id}`, 'PUT', payload);

        if (result) {
            DashboardUtils.closeModal('edit-modal');
            DashboardUtils.showToast(`${member.name}'s record updated.`);
            await this.sync(); 
        }
    }

    init() {
        this.sync();
        const searchInput = DashboardUtils.getEl('member-search');
        if (searchInput) {
            searchInput.oninput = () => {
                const q = searchInput.value.toLowerCase();
                this.renderRoster(members.filter(m =>
                    m.name.toLowerCase().includes(q) || String(m.id).includes(q)
                ));
            };
        }

        DashboardUtils.bindOverlayClose('edit-modal', () => DashboardUtils.closeModal('edit-modal'));
    }
}