import { DashboardUtils } from "../utils/utils.js";


/* ============================================
   FARE DASHBOARD
   ============================================ */

export class FaresDashboard {
  constructor(store) {
    this.store = store;
    // Default fare data — extend DashboardStore with this if needed
    this.rates = { base: 15, highway: 25, special: 50, discStudent: 20, discSenior: 20 };
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

  save() {
    const base         = parseFloat(DashboardUtils.getEl('fm-base')?.value) || 0;
    const highway      = parseFloat(DashboardUtils.getEl('fm-highway')?.value) || 0;
    const special      = parseFloat(DashboardUtils.getEl('fm-special')?.value) || 0;
    const discStudent  = parseFloat(DashboardUtils.getEl('fm-disc-student')?.value) || 0;
    const discSenior   = parseFloat(DashboardUtils.getEl('fm-disc-senior')?.value) || 0;

    this.rates = { base, highway, special, discStudent, discSenior };

    // Update the Fare Guide card in the sidebar
    this._updateFareCard();

    this.closeModal();
    DashboardUtils.showToast('Fare rates updated successfully.');
  }

  _updateFareCard() {
    const r = this.rates;
    const setText = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = text;
    };
    // Update visible price numbers in .fare-item-price elements
    const prices = document.querySelectorAll('.fare-price-num');
    if (prices[0]) prices[0].textContent = `₱${r.base.toFixed(2)}`;
    if (prices[1]) prices[1].textContent = `₱${r.highway.toFixed(2)}`;
    if (prices[2]) prices[2].textContent = `₱${r.special.toFixed(2)}+`;

    const discEl = document.querySelector('.fare-discount-val');
    if (discEl) discEl.textContent = `-${r.discStudent}% / ${r.discSenior}% Discount`;

    const updatedEl = document.querySelector('.fare-updated');
    const now = new Date();
    if (updatedEl) updatedEl.textContent = `Updated ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  init() {
    DashboardUtils.bindOverlayClose('fare-modal', () => this.closeModal());
  }
}