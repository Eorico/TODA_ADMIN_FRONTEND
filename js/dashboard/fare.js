import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";

/* ============================================
   FARE DASHBOARD
   ============================================ */

export class FaresDashboard {
  constructor(store) {
    this.store = store;
    // Default fare data — extend DashboardStore with this if needed
    this.rates = { base: 15, highway: 25, special: 50, discStudent: 20, discSenior: 20 };
  }

  async sync() {
    const data = await ApiService.call('/admin/fare', 'GET');
    if (data && data.length > 0) {
      this.rates = data[0];
      this._updateFareCard();
    }
  }

  openModal() {
    DashboardUtils.setVal('fm-base',          this.rates.base);
    DashboardUtils.setVal('fm-highway',       this.rates.highway);
    DashboardUtils.setVal('fm-special',       this.rates.special);
    DashboardUtils.setVal('fm-disc-student',  this.rates.discStudent);
    DashboardUtils.setVal('fm-disc-senior',   this.rates.discSenior);
    DashboardUtils.openModal('fare-modal');
  }

  closeModal() { DashboardUtils.closeModal('fare-modal'); }

  async save() {
    const base         = parseFloat(DashboardUtils.getEl('fm-base')?.value) || 0;
    const highway      = parseFloat(DashboardUtils.getEl('fm-highway')?.value) || 0;
    const special      = parseFloat(DashboardUtils.getEl('fm-special')?.value) || 0;
    const discStudent  = parseFloat(DashboardUtils.getEl('fm-disc-student')?.value) || 0;
    const discSenior   = parseFloat(DashboardUtils.getEl('fm-disc-senior')?.value) || 0;

    const payload = { base, highway, special, discStudent, discSenior };

    let result;
    if (this.rates._id || this.rates.id) {
        const id = this.rates._id || this.rates.id;
        result = await ApiService.call(`/admin/fare/${id}`, 'PUT', payload);
    } else {
        result = await ApiService.call('/admin/fare', 'POST', payload);
    }

    if (result) {
        this.closeModal();
        DashboardUtils.showToast('Fare rates updated successfully.');
        ActivityLog.push({
          icon: 'fare',
          ttile: 'Fare List Updated',
          desc: `Base ₱${base}`
        })
        await this.sync(); 
    }
  }

  _updateFareCard() {
    const r = this.rates;
    const prices = document.querySelectorAll('.fare-price-num');
    if (prices[0]) prices[0].textContent = `₱${r.base.toFixed(2)}`;
    if (prices[1]) prices[1].textContent = `₱${r.highway.toFixed(2)}`;
    if (prices[2]) prices[2].textContent = `₱${r.special.toFixed(2)}+`;

    const discEl = document.querySelector('.fare-discount-val');
    if (discEl) discEl.textContent = `-${r.discStudent}% / ${r.discSenior}% Discount`;

    const updatedEl = document.querySelector('.fare-updated');
    if (updatedEl) {
        const dateSource = r.updated_at ? new Date(r.updated_at) : new Date();
        updatedEl.textContent = `Updated ${dateSource.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  }

  init() {
    this.sync()
    DashboardUtils.bindOverlayClose('fare-modal', () => this.closeModal());
  }
}