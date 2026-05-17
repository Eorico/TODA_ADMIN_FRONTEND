import { DashboardUtils }         from './utils/utils.js';
import { DashboardStore }         from './utils/store.js';
import { MainDashboard }          from './dashboard/main_dashboard.js';
import { RosterDashboard }        from './dashboard/roster.js';
import { AnnouncementsDashboard } from './dashboard/announcements.js';
import { CodingDashboard }        from './dashboard/coding.js';
import { ContributionsDashboard } from './dashboard/contributions.js';
import { DriversDashboard }       from './dashboard/drivers.js';
import { FaresDashboard }         from './dashboard/fare.js';
import { LostFoundDashboard }     from './dashboard/lostfound.js';
import { OfficersDashboard }      from './dashboard/officers.js';
import { AnalysisDashboard }      from './dashboard/analysis.js';
import { AdminLogin }             from './auth/admin_login.js';
import { cache }                  from './utils/data_cache.js';

const AUTO_REFRESH_MS = 30_000;

// All endpoints the dashboard ever reads — prefetched on load
const ALL_ENDPOINTS = [
    '/admin/contributions',
    '/admin/roster',
    '/admin/lost-found',
    '/admin/riders',
    '/admin/announcements',
    '/admin/officers',
    '/admin/coding',
    '/admin/violations',
    '/admin/fare',
];

class DashboardApp {
    constructor() {
        this.store = new DashboardStore();
        this.dashboards = {
            dashboard:     new MainDashboard(this.store),
            members:       new RosterDashboard(this.store),
            lostfound:     new LostFoundDashboard(this.store),
            drivers:       new DriversDashboard(this.store),
            announcements: new AnnouncementsDashboard(this.store),
            officers:      new OfficersDashboard(this.store),
            coding:        new CodingDashboard(this.store),
            contributions: new ContributionsDashboard(this.store),
            fares:         new FaresDashboard(this.store),
            analysis:      new AnalysisDashboard(this.store),
        };
        this._activePage      = 'dashboard';
        this._refreshInterval = null;
        this._initialised     = new Set();
        this._prefetchDone    = false;
    }

    // ── Warm the cache for every endpoint in parallel ──────────────
    // Called once on load — by the time the user clicks a nav item,
    // the data is already in cache and renders instantly.
    async _prefetchAll() {
        const token = localStorage.getItem('access_token');
        if (!token || this._prefetchDone) return;

        // Fire all fetches simultaneously — cache.fetch deduplicates
        await Promise.allSettled(
            ALL_ENDPOINTS.map(ep => cache.fetch(ep).catch(() => null))
        );
        this._prefetchDone = true;
    }

    // ── Sync only the active page ──────────────────────────────────
    async _syncActive() {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const db = this.dashboards[this._activePage];
        if (db && typeof db.sync === 'function') {
            await db.sync().catch(err => console.warn('Sync error:', err));
        }
    }

    // ── Refresh all cache then sync active page ────────────────────
    // Only called on tab re-focus or explicit window.syncAll()
    async _syncAll() {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        cache.invalidateAll();
        this._prefetchDone = false;
        // Prefetch all in background, sync active page immediately
        this._prefetchAll();           // ← fire and forget
        await this._syncActive();      // ← active page gets fresh data now
    }

    startAutoRefresh() {
        if (this._refreshInterval) clearInterval(this._refreshInterval);
        this._refreshInterval = setInterval(async () => {
            // Every 30s: invalidate all, prefetch silently in background,
            // then update the visible page
            cache.invalidateAll();
            this._prefetchDone = false;
            this._prefetchAll();      // ← warms cache in background
            await this._syncActive(); // ← visible page re-renders with fresh data
        }, AUTO_REFRESH_MS);
    }

    stopAutoRefresh() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            this._refreshInterval = null;
        }
    }

    switchPage(page) {
        document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.remove('active'));
        const targetPage = document.getElementById('page-' + page);
        if (targetPage) targetPage.classList.add('active');
        this._activePage = page;

        const delay = page === 'analysis' ? 150 : 50;
        setTimeout(() => {
            const db = this.dashboards[page];
            if (!db) return;

            if (!this._initialised.has(page)) {
                // First visit — bind events + sync
                // Data is likely already in cache from _prefetchAll
                db.init();
                this._initialised.add(page);
            } else {
                // Subsequent visits — just re-render from cache
                // (cache.fetch returns instantly if data is fresh)
                db.sync?.();
            }
        }, delay);
    }

    initNavigation() {
        document.querySelectorAll('.nav-item').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.onclick = (e) => {
                e.preventDefault();
                const pageId = newButton.getAttribute('data-page');
                if (!pageId) return;
                document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
                newButton.classList.add('active');
                this.switchPage(pageId);
            };
        });
    }

    initActiveDashboards() {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const activePage = document.querySelector('[id^="page-"].active');
        const pageId = activePage
            ? activePage.id.replace('page-', '')
            : 'dashboard';

        this._activePage = pageId;
        const db = this.dashboards[pageId];

        // Step 1: prefetch all endpoints in background immediately
        // Step 2: init the active page (will hit cache, not server)
        this._prefetchAll().then(() => {
            if (db) {
                db.init();
                this._initialised.add(pageId);
            }
        });
    }

    initModalOverlayClose() {
        ['edit-modal', 'driver-modal', 'officer-modal', 'officer-confirm',
         'coding-modal', 'coding-confirm', 'cn-modal', 'cn-confirm',
         'fare-modal', 'vio-confirm']
            .forEach(id => {
                const modal = document.getElementById(id);
                if (modal) modal.onclick = function(e) {
                    if (e.target === this) this.classList.remove('open');
                };
            });
    }

    exposeGlobals() {
        window.showToast = (msg) => DashboardUtils.showToast(msg);

        window.openModal      = (name, id, bodyNo, status, contrib, idx) => this.dashboards.members.openModal(name, id, bodyNo, status, contrib, idx);
        window.saveMember     = () => this.dashboards.members.save();
        window.closeEditModal = () => DashboardUtils.closeModal('edit-modal');

        window.submitLostFound = () => this.dashboards.lostfound.submit();

        window.openDriverModal      = (idx) => this.dashboards.drivers.openModal(idx);
        window.openAddDriverModal   = ()    => this.dashboards.drivers.openModal();
        window.closeDriverModal     = ()    => DashboardUtils.closeModal('driver-modal');
        window.saveDriver           = ()    => this.dashboards.drivers.save();
        window.deleteDriver         = (idx) => this.dashboards.drivers.delete(idx);
        window.drChangePage         = (dir) => this.dashboards.drivers.changePage(dir);
        window.acceptDriver         = (idx) => this.dashboards.drivers.accept(idx);
        window.rejectDriver         = (idx) => this.dashboards.drivers.reject(idx);
        window.previewDriverLicense = (e)   => this.dashboards.drivers.previewLicense(e);
        window.clearDriverLicense   = ()    => this.dashboards.drivers._clearLicensePreview();
        window.previewDriverOrcr    = (e)   => this.dashboards.drivers.previewOrcr(e);
        window.clearDriverOrcr      = ()    => this.dashboards.drivers._clearOrcrPreview();
        window.viewLicense = (url) => {
            const w = window.open();
            w.document.write(`<img src="${url}" style="max-width:100%;height:auto"/>`);
        };

        window.deleteAnnouncement = (id) => this.dashboards.announcements.delete(id);
        window.postAnnouncement   = ()   => this.dashboards.announcements.post();
        window.openFareModal  = async () => await this.dashboards.fares.openModal();
        window.closeFareModal     = ()   => this.dashboards.fares.closeModal();
        window.saveFareRates      = ()   => this.dashboards.fares.save();

        window.openOfficerModal     = (idx) => this.dashboards.officers.openModal(idx);
        window.openAddOfficerModal  = ()    => this.dashboards.officers.openModal();
        window.closeOfficerModal    = ()    => this.dashboards.officers.closeModal();
        window.saveOfficer          = ()    => this.dashboards.officers.save();
        window.openOfficerConfirm   = (idx) => this.dashboards.officers.openConfirm(idx);
        window.closeOfficerConfirm  = ()    => this.dashboards.officers.closeConfirm();
        window.confirmDeleteOfficer = ()    => this.dashboards.officers.confirmDelete();
        window.setOfficerView       = (v)   => this.dashboards.officers.setView(v);

        window.openCodingModal     = (idx) => this.dashboards.coding.openModal(idx);
        window.openAddCodingModal  = ()    => this.dashboards.coding.openModal();
        window.closeCodingModal    = ()    => this.dashboards.coding.closeModal();
        window.saveCodingSchedule  = ()    => this.dashboards.coding.save();
        window.openCodingConfirm   = (idx) => this.dashboards.coding.openConfirm(idx);
        window.closeCodingConfirm  = ()    => this.dashboards.coding.closeConfirm();
        window.confirmDeleteCoding = ()    => this.dashboards.coding.confirmDelete();
        window.openVioModal        = ()    => this.dashboards.coding.openVioModal();
        window.closeVioModal       = ()    => this.dashboards.coding.closeVioModal();
        window.saveViolation       = ()    => this.dashboards.coding.saveViolation();
        window.toggleVioPenalty    = ()    => this.dashboards.coding.togglePenaltyAmount();
        window.openVioConfirm      = (idx) => this.dashboards.coding.openVioConfirm(idx);
        window.closeVioConfirm     = ()    => this.dashboards.coding.closeVioConfirm();
        window.confirmDeleteVio    = ()    => this.dashboards.coding.confirmDeleteVio();
        window.announcementsDashboard = this.dashboards.announcements;

        window.openCnModal     = (idx) => this.dashboards.contributions.openModal(idx);
        window.openAddCnModal  = ()    => this.dashboards.contributions.openModal();
        window.closeCnModal    = ()    => this.dashboards.contributions.closeModal();
        window.saveCnRecord    = ()    => this.dashboards.contributions.save();
        window.openCnConfirm   = (idx) => this.dashboards.contributions.openConfirm(idx);
        window.closeCnConfirm  = ()    => this.dashboards.contributions.closeConfirm();
        window.confirmDeleteCn = ()    => this.dashboards.contributions.confirmDelete();
        window.cnChangePage    = (dir) => this.dashboards.contributions.changePage(dir);
        window.cnFilterRender  = ()    => this.dashboards.contributions.filterRender();

        window.analysisDashboard = this.dashboards.analysis;
        window.switchPage        = (page) => this.switchPage(page);
        window.logout            = () => this.logout();
        window.syncAll           = () => this._syncAll();
    }

    async IncludeHTML() {
        const base = document.querySelector('[data-base-path]')?.dataset.basePath ?? '';
        const elements = document.querySelectorAll('[data-include]');
        const tasks = Array.from(elements).map(async (el) => {
            const file = el.getAttribute('data-include');
            if (!file) return;
            try {
                const res = await fetch(base + '/' + file);
                if (res.ok) el.innerHTML = await res.text();
                else console.error(`Failed to load ${file}: ${res.status}`);
            } catch (err) {
                console.error('Error loading component:', err);
            }
        });
        await Promise.all(tasks);
        this.initNavigation();
        this.initActiveDashboards(); // prefetch + init active page
        this.initModalOverlayClose();
        this.startAutoRefresh();
    }

    logout() {
        const confirmed = confirm('Are you sure you want to logout?');
        if (!confirmed) return;
        this.stopAutoRefresh();
        cache.invalidateAll();
        localStorage.removeItem('access_token');
        localStorage.removeItem('isLoggedIn');
        DashboardUtils.showToast('Logging out...');
        setTimeout(() => {
            window.location.href = '/frontend/web/html/admin_login.html';
        }, 1000);
    }

    start() {
        this.exposeGlobals();
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoRefresh();
            } else {
                // Tab refocused — refresh everything silently
                this._syncAll();
                this.startAutoRefresh();
            }
        });
        window.addEventListener('beforeunload', () => this.stopAutoRefresh());
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.IncludeHTML());
        } else {
            this.IncludeHTML();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    AdminLogin.requireAuth();
    const app = new DashboardApp();
    app.start();
});