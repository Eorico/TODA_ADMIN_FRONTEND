import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";
import { CONFIG } from "../api/BASE_URL.js";
/* ============================================
   DASHBOARD 3: DRIVERS REGISTRY
   ============================================
   Endpoints used:
     GET    /admin/riders          → fetch all drivers
     POST   /admin/riders          → create new driver
     PUT    /admin/riders/:id      → update driver
     DELETE /admin/riders/:id      → remove driver
     PUT    /admin/riders/:id/accept  → accept driver (sets status Active, syncs to roster)
     PUT    /admin/riders/:id/reject  → reject driver (sets status Inactive)
     POST   /admin/riders/:id/license → upload license image (multipart/form-data)
   ============================================ */
 
export class DriversDashboard {
    constructor(store) {
        this.store = store;
        this.avatarColors = ['#c0392b', '#e67e22', '#2980b9', '#27ae60', '#8e44ad', '#16a085'];
        this.PER_PAGE = 4;
        this._urlMap = {};
    }
 
    // ─── DATA FETCH ──────────────────────────────────────────────────────────
 
    async sync() {
        const data = await ApiService.call('/admin/riders', 'GET');
        if (data) {
            this.store.drData = data;
            this.render();
        }
    }
 
    // ─── HELPERS ─────────────────────────────────────────────────────────────
 
    statusClass(s) {
        return s === 'Active' ? 'active' : s === 'Inactive' ? 'inactive' : 'suspended';
    }
 
    initials(d) {
        return ((d.full_name?.[0] || '') + (d.last_name?.[0] || '')).toUpperCase();
    }
 
    getData() {
        return this.store.drData || this.store.driverData || [];
    }
 
    // ─── RENDER TABLE ────────────────────────────────────────────────────────
 
    render() {
        this._urlMap = {};
        const drData = this.getData();
        const total  = drData.length;
        const pages  = Math.ceil(total / this.PER_PAGE);
        const start  = (this.store.drPage - 1) * this.PER_PAGE;
        const slice  = drData.slice(start, start + this.PER_PAGE);

        const tbody = DashboardUtils.getEl('driver-table-body');
        if (!tbody) return;

        tbody.innerHTML = slice.map((d, i) => {
            const sc    = this.statusClass(d.status);
            const color = this.avatarColors[(start + i) % this.avatarColors.length];
            const idx   = start + i;
            const isApproved = d.member_status === 'approved';

            // ── resolve full URLs ──────────────────────────────────────────
            const resolveUrl = (url) => {
                if (!url) return null;
                if (url.startsWith('data:') || url.startsWith('http')) return url;
                return `${CONFIG.API_URL}/${url}`;
            };

            const fullLicenseUrl = resolveUrl(d.license_url);
            const fullOrcrUrl    = resolveUrl(d.orcr_url);

            // ── store in map, use short keys ───────────────────────────────
            const licKey  = `lic_${idx}`;
            const orcrKey = `orcr_${idx}`;
            if (fullLicenseUrl) this._urlMap[licKey]  = fullLicenseUrl;
            if (fullOrcrUrl)    this._urlMap[orcrKey] = fullOrcrUrl;

            // ── thumb builder ──────────────────────────────────────────────
            const makeThumb = (key, hasUrl, altText) => hasUrl
                ? `<div style="display:flex;align-items:center;justify-content:center;">
                    <div title="View ${altText}"
                        style="width:48px;height:32px;border-radius:4px;overflow:hidden;border:1px solid var(--border);cursor:pointer;background:var(--white);transition:transform var(--t-fast);box-shadow:0 1px 3px rgba(0,0,0,0.05);"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'"
                        onclick="window.driversDashboard.viewFromKey('${key}')">
                        <img src="${this._urlMap[key]}" alt="${altText}"
                            style="width:100%;height:100%;object-fit:cover;display:block;"
                            onerror="this.parentElement.innerHTML='<span style=\\'font-size:8px;color:var(--crimson)\\'>Error</span>'"/>
                    </div>
                </div>`
                : `<div title="No ${altText} uploaded"
                        style="width:48px;height:32px;border-radius:4px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-light);background:var(--bg-light);">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <rect x="2" y="5" width="20" height="14" rx="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                </div>`;
            const licThumb  = makeThumb(licKey,  !!fullLicenseUrl, 'License');
            const orcrThumb = makeThumb(orcrKey, !!fullOrcrUrl,    'OR/CR');
            // ← approved badge shown when approved
            const approvedBadge = isApproved
                ? `<span style="
                    display:inline-flex;align-items:center;gap:4px;
                    background:#e8f5e9;color:#2e7d32;
                    font-size:10px;font-weight:700;letter-spacing:.5px;
                    padding:3px 8px;border-radius:20px;border:1px solid #a5d6a7;">
                    ✓ APPROVED
                </span>`
                : '';

            // ← only show accept/reject when pending
            const actionButtons = isApproved
                ? `<button class="dr-btn-edit" title="Edit Profile" onclick="window.openDriverModal(${idx})">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="dr-btn-del" title="Remove Driver" onclick="window.deleteDriver(${idx})">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                </button>`
                : `<button class="dr-btn-accept" title="Accept Driver" onclick="window.acceptDriver(${idx})">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </button>
                <button class="dr-btn-reject" title="Reject Driver" onclick="window.rejectDriver(${idx})">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <button class="dr-btn-edit" title="Edit Profile" onclick="window.openDriverModal(${idx})">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="dr-btn-del" title="Remove Driver" onclick="window.deleteDriver(${idx})">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                </button>`;

            return `
                <tr>
                <td>
                    <div class="dr-member-cell">
                    <div class="dr-avatar"
                        style="background:${color};color:white;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700">
                        ${this.initials(d)}
                    </div>
                    <div>
                        <div class="dr-member-name">${d.full_name} ${d.last_name}</div>
                        <div class="dr-member-id">${d.id || d._id}</div>
                        ${approvedBadge}
                    </div>
                    </div>
                </td>
                <td><span class="dr-body-tag">#${d.body_number || '—'}</span></td>
                <td>
                    <div class="dr-status">
                    <div class="dr-status-dot ${sc}"></div>
                    <div class="dr-status-label ${sc}">${d.status?.toUpperCase() || 'UNKNOWN'}</div>
                    </div>
                </td>
                <td>
                    <div class="dr-contact-stack">
                    <div class="dr-contact-row">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>${d.email || '—'}</span>
                    </div>
                    <div class="dr-contact-row">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.64 3.38 2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span>${d.contact || '—'}</span>
                    </div>
                    <div class="dr-contact-row">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${d.address || '—'}</span>
                    </div>
                    </div>
                </td>
                <td>${licThumb}</td>
                <td>${orcrThumb}</td>
                <td><div class="dr-actions">${actionButtons}</div></td>
                </tr>`;
        }).join('');
 
        // Showing text
        const showingEl = DashboardUtils.getEl('dr-showing');
        if (showingEl) {
            showingEl.innerHTML = `Showing <strong>${start + 1} – ${Math.min(start + this.PER_PAGE, total)}</strong> of <strong>${total}</strong> total members`;
        }
 
        // Page number buttons
        const pb = DashboardUtils.getEl('dr-page-btns');
        if (pb) {
            pb.innerHTML = '';
            for (let p = 1; p <= pages; p++) {
                const b = document.createElement('button');
                b.className = 'dr-pg-num' + (p === this.store.drPage ? ' current' : '');
                b.textContent = p;
                b.onclick = () => { this.store.drPage = p; this.render(); };
                pb.appendChild(b);
            }
        }
 
        const prevBtn = DashboardUtils.getEl('dr-prev');
        const nextBtn = DashboardUtils.getEl('dr-next');
        if (prevBtn) prevBtn.disabled = this.store.drPage === 1;
        if (nextBtn) nextBtn.disabled = this.store.drPage >= pages;
    }

    viewFromKey(key) {
        const url = this._urlMap?.[key];
        if (!url) return;
        this.viewLicenseModal(url);
    }

    // ─── LICENSE VIEW MODAL ──────────────────────────────────────────────────
    viewLicenseModal(url) {
        // Create the modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'license-view-modal';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 9999; cursor: zoom-out;
            backdrop-filter: blur(4px); opacity: 0; transition: opacity var(--t-fast);
        `;

        // Create the image container
        const img = document.createElement('img');
        img.src = url;
        img.style = `
            max-width: 90%; max-height: 80%; border-radius: var(--radius-md);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5); cursor: default;
            transform: scale(0.9); transition: transform var(--t-fast);
        `;

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // Trigger animations
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            img.style.transform = 'scale(1)';
        });

        // Close on click
        overlay.onclick = () => {
            overlay.style.opacity = '0';
            img.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 200);
        };
    }
    
    changePage(dir) {
        const pages = Math.ceil(this.getData().length / this.PER_PAGE);
        this.store.drPage = Math.max(1, Math.min(pages, this.store.drPage + dir));
        this.render();
    }
 
    // ─── ACCEPT / REJECT ─────────────────────────────────────────────────────
 
    /**
     * Accept a driver:
     *   - Calls PUT /admin/riders/:id/accept on the backend
     *   - Backend should set status = 'Active' AND create/update a member record
     *     in the roster so it shows on the Members page automatically.
     *   - We then re-sync both Drivers Registry AND Members page.
     */
    async accept(idx) {
        const driver = this.store.drData[idx];
        const id     = driver._id || driver.id;
 
        const result = await ApiService.call(`/admin/riders/${id}/accept`, 'PUT');
        if (result) {
            DashboardUtils.showToast(`${driver.full_name} ${driver.last_name} accepted and added to roster.`);
            ActivityLog.push({
                icon: 'UserCheck',
                title: 'Driver Accepted',
                desc: `${driver.full_name} ${driver.last_name} · Body #${driver.body_number} is now an active member.`
            });
            // Re-sync drivers list
            await this.sync();
            // Re-sync the Members / Roster page so the new member appears there too
            await this._syncRoster();
        }
    }
 
    /**
     * Reject a driver:
     *   - Calls PUT /admin/riders/:id/reject on the backend
     *   - Backend sets status = 'Inactive' (or removes from roster if needed)
     */
    async reject(idx) {
        const driver = this.store.drData[idx];
        const id     = driver._id || driver.id;
 
        if (!confirm(`Reject ${driver.full_name} ${driver.last_name}? This will mark them as Inactive.`)) return;
 
        const result = await ApiService.call(`/admin/riders/${id}/reject`, 'PUT');
        if (result) {
            DashboardUtils.showToast(`${driver.full_name} ${driver.last_name} has been rejected.`);
            ActivityLog.push({
                icon: 'UserX',
                title: 'Driver Rejected',
                desc: `${driver.full_name} ${driver.last_name} set to Inactive.`
            });
            await this.sync();
        }
    }
 
    // ─── DELETE ──────────────────────────────────────────────────────────────
 
    async delete(idx) {
        const driver = this.store.drData[idx];
        const id     = driver._id || driver.id;
 
        if (!confirm(`Remove ${driver.full_name} ${driver.last_name} from the registry?`)) return;
 
        const result = await ApiService.call(`/admin/riders/${id}`, 'DELETE');
        if (result) {

            await ApiService.call(`/admin/roster/${id}`, 'DELETE')
                    .catch(err => { console.log("Member record might not exist or already deleted", err); })

            DashboardUtils.showToast('Driver removed from registry.');
            ActivityLog.push({
                icon: 'user',
                title: 'Driver Removed',
                desc: `${driver.full_name} ${driver.last_name}`
            });
            await this.sync();
            // Also refresh Members page in case they had a roster entry
            await this._syncRoster();
        }
    }
 
    // ─── MODAL (ADD / EDIT) ──────────────────────────────────────────────────
 
    openModal(idx) {
        this.store.drEditIdx = idx !== undefined ? idx : null;
        const drData = this.getData();
        const isEdit = this.store.drEditIdx !== null;

        const titleEl = DashboardUtils.getEl('driver-modal-title');
        const subEl   = DashboardUtils.getEl('driver-modal-sub');
        if (titleEl) titleEl.textContent = isEdit ? 'Edit Driver Profile' : 'Add New Driver';
        if (subEl) {
            subEl.textContent = isEdit
                ? `Editing record for ${drData[idx].full_name} ${drData[idx].last_name}.` // ← was d.fname
                : 'Fill in the details to register a new fleet member.';
        }

        this._clearLicensePreview();
        this._clearOrcrPreview();

        if (isEdit) {
            const d = drData[idx];
            DashboardUtils.setVal('drv-fname',   d.full_name);
            DashboardUtils.setVal('drv-lname',   d.last_name);
            DashboardUtils.setVal('drv-body',    d.body_number);  // ← was d.body
            DashboardUtils.setVal('drv-contact', (d.contact || '').replace('+63 ', ''));
            DashboardUtils.setVal('drv-email',   d.email || '');
            const statusSelect = DashboardUtils.getEl('drv-status');
            if (statusSelect) {
                Array.from(statusSelect.options).forEach(o => o.selected = o.text === d.status);
            }
            if (d.license_url) {
                const fullUrl = d.license_url.startsWith('data:')  // base64 already full
                    ? d.license_url
                    : d.license_url.startsWith('http')
                        ? d.license_url
                        : `${CONFIG.API_URL}/${d.license_url}`;
                this._showLicensePreview(fullUrl, 'Existing license', '');
            }

            if (d.orcr_url) {
            const fullOrcrUrl = d.orcr_url.startsWith('data:')
                ? d.orcr_url
                : d.orcr_url.startsWith('http')
                    ? d.orcr_url
                    : `${CONFIG.API_URL}/${d.orcr_url}`;
            this._showOrcrPreview(fullOrcrUrl, 'Existing OR/CR', '');
            }
        } else {
            DashboardUtils.clearFields(['drv-fname', 'drv-lname', 'drv-body', 'drv-contact', 'drv-email']);
            const statusSelect = DashboardUtils.getEl('drv-status');
            if (statusSelect) statusSelect.selectedIndex = 0;
        }

        DashboardUtils.openModal('driver-modal');
    }
 
    // ─── SAVE (CREATE or UPDATE) ──────────────────────────────────────────────
 
    async save() {
        const fname   = DashboardUtils.getEl('drv-fname')?.value.trim();
        const lname   = DashboardUtils.getEl('drv-lname')?.value.trim();
        const body    = DashboardUtils.getEl('drv-body')?.value.trim();
        const contact = DashboardUtils.getEl('drv-contact')?.value.trim();
        const email   = DashboardUtils.getEl('drv-email')?.value.trim();
        const status  = DashboardUtils.getEl('drv-status')?.value;

        if (!fname || !lname) {
            DashboardUtils.getEl('drv-fname')?.focus();
            return;
        }

        const payload = {
            full_name: fname,
            last_name: lname,
            body_number:    body    || '---',
            contact: contact ? `+63 ${contact}` : '-',
            email:   email   || '',
            status:  status  || 'Active'
        };

        let result;
        let driverId;

        if (this.store.drEditIdx !== null) {
            driverId = this.store.drData[this.store.drEditIdx]._id
                    || this.store.drData[this.store.drEditIdx].id;
            result = await ApiService.call(`/admin/riders/${driverId}`, 'PUT', payload);
        } else {
            result = await ApiService.call('/admin/riders', 'POST', payload);
            driverId = result?._id || result?.id;
            console.log('New driver ID:', driverId); // ← confirm this is not undefined
        }

        if (!result) return;
        const orcrFile = DashboardUtils.getEl('drv-orcr-input')?.files?.[0];
        if (orcrFile && driverId) {
            await this._uploadOrcr(driverId, orcrFile);
        }

        // ✅ Upload first, then close modal, then sync
        const licenseFile = DashboardUtils.getEl('drv-license-input')?.files?.[0];
        if (licenseFile && driverId) {
            const uploadResult = await this._uploadLicense(driverId, licenseFile);
            // ✅ Patch the local store immediately so render shows the image right away
            if (uploadResult?.license_url) {
                const idx = this.store.drData.findIndex(d => (d._id || d.id) === driverId);
                if (idx !== -1) this.store.drData[idx].license_url = uploadResult.license_url;
            }
        }

        DashboardUtils.closeModal('driver-modal');
        DashboardUtils.showToast(
            this.store.drEditIdx !== null ? 'Driver profile updated.' : 'New driver registered.'
        );
        ActivityLog.push({
            icon: 'user',
            title: this.store.drEditIdx !== null ? 'Driver Profile Updated' : 'New Driver Registered',
            desc: `${fname} ${lname} · Body #${body}`
        });

        await this.sync(); // ← final sync from DB, now licenseUrl is already saved
        if ((status || 'Active') === 'Active') {
            await this._syncRoster();
        }
    }
 
    // ─── LICENSE UPLOAD ───────────────────────────────────────────────────────
 
    /**
     * Uploads the license image file to the backend.
     * Endpoint: POST /admin/riders/:id/license (multipart/form-data)
     * The backend should store the file and update the driver's licenseUrl field.
     */
    async _uploadLicense(driverId, file) {

        const formData = new FormData();
        formData.append('license', file);

        try {

            const data = await ApiService.call(`/admin/riders/${driverId}/license`, 'POST', formData);
            
            if (data?.path) {
                console.log("License uploaded:", data.path);
            } else {
                console.error("Upload failed:", data);
            }
            
            return data;
        } catch (err) {
            console.error('Network error during upload:', err);
            return null;
        }
    }
 
    // ─── ROSTER CROSS-SYNC ────────────────────────────────────────────────────
 
    /**
     * Re-fetches /admin/roster and updates the Members page stats + table.
     * Called after accept / reject / create / delete so the Members page
     * always stays in sync without a manual page refresh.
     */
    async _syncRoster() {
        try {
            const data = await ApiService.call('/admin/roster', 'GET');
            const members = Array.isArray(data) ? data : []
            this._updateMemberStats(members);
            this._renderRosterTable(members);
        } catch (err) {
            console.warn('Roster sync failed:', err);
        }
    }
 
    _updateMemberStats(members) {
        const norm = s => (s || '').toLowerCase();
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
 
    _renderRosterTable(list) {
        const tbody = DashboardUtils.getEl('roster-body');
        if (!tbody) return;
        tbody.innerHTML = list.map((m, i) => `
            <tr>
            <td>
                <div class="member-name">${m.full_name || '—'}</div>
                <div class="member-id">Member ID · #${m.id || m._id}</div>
            </td>
            <td>#${m.id || '—'}</td>
            <td><span class="badge ${DashboardUtils.badgeClass(m.status)}">${m.status}</span></td>
            <td>
                <div style="font-size:12px">${m.email || '—'}</div>
                <div style="font-size:12px;color:var(--text-light)">${m.contact || '—'}</div>
            </td>
            <td>${m.contrib || '—'} <span style="color:var(--text-light);font-size:11px">· ${m.date || ''}</span></td>
            <td>
                <button class="btn-edit"
                onclick="window.openModal('${m.full_name}', '${m.id || m._id}', '${m.status}', '${(m.contrib || '').replace('₱', '')}', ${i})">
                Edit
                </button>
            </td>
            </tr>
        `).join('');
    }
 
    // ─── LICENSE PREVIEW HELPERS (called from HTML onclick) ──────────────────
 
    previewLicense(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this._showLicensePreview(e.target.result, file.name, (file.size / 1024).toFixed(1) + ' KB');
        };
        reader.readAsDataURL(file);
    }
 
    _showLicensePreview(src, name, size) {
        const img      = DashboardUtils.getEl('drv-license-img');
        const fname    = DashboardUtils.getEl('drv-license-filename');
        const fsize    = DashboardUtils.getEl('drv-license-filesize');
        const preview  = DashboardUtils.getEl('drv-license-preview');
        if (img)     img.src           = src;
        if (fname)   fname.textContent = name;
        if (fsize)   fsize.textContent = size;
        if (preview) preview.style.display = 'flex';
    }
 
    _clearLicensePreview() {
        const preview = DashboardUtils.getEl('drv-license-preview');
        const input   = DashboardUtils.getEl('drv-license-input');
        const img     = DashboardUtils.getEl('drv-license-img');
        if (preview) preview.style.display = 'none';
        if (input)   input.value = '';
        if (img)     img.src = '';
    }

    async _uploadOrcr(driverId, file) {
        const formData = new FormData();
        formData.append('orcr', file);
        try {
            return await ApiService.call(`/admin/riders/${driverId}/orcr`, 'POST', formData);
        } catch (err) {
            console.error('OR/CR upload error:', err);
            return null;
        }
    }

    previewOrcr(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this._showOrcrPreview(e.target.result, file.name, (file.size / 1024).toFixed(1) + ' KB');
        };
        reader.readAsDataURL(file);
    }

    _showOrcrPreview(src, name, size) {
        const img     = DashboardUtils.getEl('drv-orcr-img');
        const fname   = DashboardUtils.getEl('drv-orcr-filename');
        const fsize   = DashboardUtils.getEl('drv-orcr-filesize');
        const preview = DashboardUtils.getEl('drv-orcr-preview');
        if (img)     img.src           = src;
        if (fname)   fname.textContent = name;
        if (fsize)   fsize.textContent = size;
        if (preview) preview.style.display = 'flex';
    }

    _clearOrcrPreview() {
        const preview = DashboardUtils.getEl('drv-orcr-preview');
        const input   = DashboardUtils.getEl('drv-orcr-input');
        const img     = DashboardUtils.getEl('drv-orcr-img');
        if (preview) preview.style.display = 'none';
        if (input)   input.value = '';
        if (img)     img.src = '';
    }

    init() {
        this.sync();
        window.driversDashboard = this;
        if (!this.store.drData) this.store.drData = [...this.store.driverData];
        this.store.drPage = 1;
        DashboardUtils.bindOverlayClose('driver-modal', () => DashboardUtils.closeModal('driver-modal'));
    }
}