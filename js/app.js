// js/app.js
import { DashboardUtils }         from './utils/utils.js';
import { DashboardStore }         from './utils/store.js';
import { RosterDashboard }        from './dashboard/roster.js';
import { AnnouncementsDashboard } from './dashboard/announcements.js';
import { CodingDashboard }        from './dashboard/coding.js';
import { ContributionsDashboard } from './dashboard/contributions.js';
import { DriversDashboard }       from './dashboard/drivers.js';
import { FaresDashboard }         from './dashboard/fare.js';
import { LostFoundDashboard }     from './dashboard/lostfound.js';
import { OfficersDashboard }      from './dashboard/officers.js';
import { AdminLogin }             from './auth/admin_login.js';

/* ============================================
   MAIN APP CONTROLLER
   ============================================ */
class DashboardApp {
    constructor() {
        this.store = new DashboardStore();
        this.dashboards = {
            roster:        new RosterDashboard(this.store),
            lostfound:     new LostFoundDashboard(this.store),
            drivers:       new DriversDashboard(this.store),
            announcements: new AnnouncementsDashboard(this.store),
            officers:      new OfficersDashboard(this.store),
            coding:        new CodingDashboard(this.store),
            contributions: new ContributionsDashboard(this.store),
            fares:         new FaresDashboard(this.store),
        };
    }

    switchPage(page) {
        document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.remove('active'));
        const targetPage = document.getElementById('page-' + page);
        if (targetPage) targetPage.classList.add('active');

        setTimeout(() => {
            const db = this.dashboards[page];
            if (db) db.init();
        }, 50);
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
        const activePage = document.querySelector('[id^="page-"].active');
        if (activePage) {
            const pageId = activePage.id.replace('page-', '');
            const db = this.dashboards[pageId];
            if (db) { db.init(); return; }
        }
        // Fallback: init all that exist
        Object.entries(this.dashboards).forEach(([key, db]) => {
            const exists = {
                roster:        'roster-body',
                lostfound:     'lf-items-container',
                drivers:       'driver-table-body',
                announcements: 'ann-posts-list',
                officers:      'off-grid-container',
                coding:        'tc-table-body',
                contributions: 'cn-table-body',
            };
            if (document.getElementById(exists[key])) db.init();
        });
    }

    initModalOverlayClose() {
        ['edit-modal', 'driver-modal', 'officer-modal', 'officer-confirm', 'coding-modal', 'coding-confirm', 'cn-modal', 'cn-confirm', 'fare-modal']
            .forEach(id => {
                const modal = document.getElementById(id);
                if (modal) modal.onclick = function (e) {
                    if (e.target === this) this.classList.remove('open');
                };
            });
    }

    exposeGlobals() {
        window.showToast = (msg) => DashboardUtils.showToast(msg);

        // Member roster
        window.openModal      = (name, id, status, contrib, idx) => this.dashboards.roster.openModal(name, id, status, contrib, idx);
        window.saveMember     = () => this.dashboards.roster.save();
        window.closeEditModal = () => DashboardUtils.closeModal('edit-modal');

        // Lost & Found
        window.submitLostFound = () => this.dashboards.lostfound.submit();

        // Drivers
        window.openDriverModal    = (idx) => this.dashboards.drivers.openModal(idx);
        window.openAddDriverModal = ()    => this.dashboards.drivers.openModal();
        window.closeDriverModal   = ()    => DashboardUtils.closeModal('driver-modal');
        window.saveDriver         = ()    => this.dashboards.drivers.save();
        window.deleteDriver       = (idx) => this.dashboards.drivers.delete(idx);
        window.drChangePage       = (dir) => this.dashboards.drivers.changePage(dir);

        // Announcements
        window.deleteAnnouncement = (id) => this.dashboards.announcements.delete(id);
        window.postAnnouncement   = ()   => this.dashboards.announcements.post();
        window.openFareModal      = ()   => this.dashboards.fares.openModal();
        window.closeFareModal     = ()   => this.dashboards.fares.closeModal();
        window.saveFareRates      = ()   => this.dashboards.fares.save();

        // Officers
        window.openOfficerModal     = (idx) => this.dashboards.officers.openModal(idx);
        window.openAddOfficerModal  = ()    => this.dashboards.officers.openModal();
        window.closeOfficerModal    = ()    => this.dashboards.officers.closeModal();
        window.saveOfficer          = ()    => this.dashboards.officers.save();
        window.openOfficerConfirm   = (idx) => this.dashboards.officers.openConfirm(idx);
        window.closeOfficerConfirm  = ()    => this.dashboards.officers.closeConfirm();
        window.confirmDeleteOfficer = ()    => this.dashboards.officers.confirmDelete();
        window.setOfficerView       = (v)   => this.dashboards.officers.setView(v);

        // Coding
        window.openCodingModal     = (idx) => this.dashboards.coding.openModal(idx);
        window.openAddCodingModal  = ()    => this.dashboards.coding.openModal();
        window.closeCodingModal    = ()    => this.dashboards.coding.closeModal();
        window.saveCodingSchedule  = ()    => this.dashboards.coding.save();
        window.openCodingConfirm   = (idx) => this.dashboards.coding.openConfirm(idx);
        window.closeCodingConfirm  = ()    => this.dashboards.coding.closeConfirm();
        window.confirmDeleteCoding = ()    => this.dashboards.coding.confirmDelete();

        // Contributions
        window.openCnModal     = (idx) => this.dashboards.contributions.openModal(idx);
        window.openAddCnModal  = ()    => this.dashboards.contributions.openModal();
        window.closeCnModal    = ()    => this.dashboards.contributions.closeModal();
        window.saveCnRecord    = ()    => this.dashboards.contributions.save();
        window.openCnConfirm   = (idx) => this.dashboards.contributions.openConfirm(idx);
        window.closeCnConfirm  = ()    => this.dashboards.contributions.closeConfirm();
        window.confirmDeleteCn = ()    => this.dashboards.contributions.confirmDelete();
        window.cnChangePage    = (dir) => this.dashboards.contributions.changePage(dir);
        window.cnFilterRender  = ()    => this.dashboards.contributions.filterRender();

        // Page switching
        window.switchPage = (page) => this.switchPage(page);

        window.logout = () => this.logout();
    }

    async IncludeHTML() {
        // ← detect base path dynamically so you never have to hardcode it
        const base = document.querySelector('[data-base-path]')?.dataset.basePath ?? '';

        const elements = document.querySelectorAll('[data-include]');
        const tasks = Array.from(elements).map(async (el) => {
            const file = el.getAttribute('data-include');
            if (!file) return;
            try {
                const res = await fetch(base + '/' + file);
                if (res.ok) {
                    el.innerHTML = await res.text();
                } else {
                    console.error(`Failed to load ${file}: ${res.status}`);
                }
            } catch (err) {
                console.error('Error loading component:', err);
            }
        });

        await Promise.all(tasks);

        this.initNavigation();
        this.initActiveDashboards();
        this.initModalOverlayClose();
    }

    logout() {
        const confirmed = confirm('Are you sure you want to logout?');
        if (!confirmed) return;

        DashboardUtils.showToast('Logging out...');
        setTimeout(() => {
            window.location.href = '/frontend/web/html/admin_login.html';
        }, 1000);
    }

    start() {
        this.exposeGlobals();
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => this.IncludeHTML());
        } else {
            this.IncludeHTML();
        }
    }
}

/* ============================================
   BOOTSTRAP
   ============================================ */
AdminLogin.requireAuth();
const app = new DashboardApp();
app.start();