import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";
 
/* ============================================
   DASHBOARD: MEMBERS / ROSTER
   ============================================
   Endpoints used:
     GET /admin/roster         → fetch all members
     PUT /admin/roster/:id     → update a member record
   ============================================
   Members are added here automatically when a
   driver is Accepted via DriversDashboard.
   The backend's PUT /admin/riders/:id/accept
   should create or update the corresponding
   roster entry so this page reflects it on sync.
   ============================================ */
 
export class RosterDashboard {
    constructor(store) {
        this.store   = store;
        this.editIdx = null;
    }
 
    // ─── DATA FETCH ──────────────────────────────────────────────────────────
 
    async sync() {
        const data = await ApiService.call('/admin/roster', 'GET');
        
        // Accept empty arrays too, fall back to store if fetch fails
        const members = Array.isArray(data) ? data : (this.store.members || []);
        
        this.store.members = members;
        this.renderRoster(members);
        this.updateStats(members);
    }
 
    // ─── STATS ───────────────────────────────────────────────────────────────
 
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
 
        const sub = DashboardUtils.getEl('roster-sub');
        if (sub) sub.textContent = `Managing ${total} authorized transport personnel.`;
        const subInner = DashboardUtils.getEl('roster-sub-inner');
        if (subInner) subInner.textContent = `Managing ${total} authorized transport personnel.`;
    }
 
    // ─── RENDER TABLE ────────────────────────────────────────────────────────
 
    renderRoster(list) {
        const tbody = DashboardUtils.getEl('roster-body');
        if (!tbody) return;

        if (!list || !list.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">
                        No members found.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = list.map((m, i) => {
            const displayName = m.full_name || '';
            const memberId    = m.id || m._id || '—';
            const bodyNo      = m.body_number || memberId;
            const contrib     = m.contrib || '—';
            const date        = m.date || '';
            const email       = m.email || '—';
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
                    ${contrib}
                    <span style="color:var(--text-light);font-size:11px">· ${date}</span>
                </td>
                <td>
                    <button class="btn-edit"
                    onclick="window.openModal('${displayName}', '${memberId}', '${m.status}', '${contrib.replace('₱', '')}', ${i})">
                    Edit
                    </button>
                </td>
                </tr>`;
        }).join('');
    }
 
    // ─── MODAL ───────────────────────────────────────────────────────────────
 
    openModal(name, id, status, contrib, idx) {
        this.editIdx = idx !== undefined ? idx : null;
 
        const modalNameEl    = DashboardUtils.getEl('modal-name');
        const modalBodyEl    = DashboardUtils.getEl('modal-body');
        const modalContribEl = DashboardUtils.getEl('modal-contrib');
        const modalStatusEl  = DashboardUtils.getEl('modal-status');
 
        if (modalNameEl)    modalNameEl.textContent = `${name} (#${id})`;
        if (modalBodyEl)    modalBodyEl.value       = id;
        if (modalContribEl) modalContribEl.value    = contrib;
        if (modalStatusEl) {
            Array.from(modalStatusEl.options).forEach(o => {
                o.selected = o.text.startsWith(status);
            });
        }
 
        DashboardUtils.openModal('edit-modal');
    }
 
    // ─── SAVE ────────────────────────────────────────────────────────────────
 
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
 
        const id     = member._id || member.id;
        const result = await ApiService.call(`/admin/roster/${id}`, 'PUT', payload);
 
        if (result) {
            DashboardUtils.closeModal('edit-modal');
            DashboardUtils.showToast(`${member.full_name}'s record updated.`);
            await this.sync();
        }
 
        ActivityLog.push({
            icon:  'User',
            title: 'Member Record Updated',
            desc:  `${member.full_name}'s status set to ${statusVal || member.status}`
        });
    }

    init() {
        this.sync();
        const searchInput = DashboardUtils.getEl('member-search');
        if (searchInput) {
            searchInput.oninput = () => {
                const q = searchInput.value.toLowerCase();
                this.renderRoster(
                    this.store.members.filter(m => {
                        const name = (`${m.full_name} ${m.last_name}`).toLowerCase();
                        return name.includes(q) || String(m.id).includes(q) || String(m.body || '').includes(q);
                    })
                );
            };
        }
        DashboardUtils.bindOverlayClose('edit-modal', () => DashboardUtils.closeModal('edit-modal'));
    }
}