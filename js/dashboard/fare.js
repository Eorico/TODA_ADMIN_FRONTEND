import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
import { ActivityLog } from "../utils/activity_log.js";
import { cache } from "../utils/data_cache.js";

export class FaresDashboard {
  constructor(store) {
    this.store = store;
    this.rates = null; // ← null instead of hardcoded defaults
  }

  async sync() {
    const data = await cache.fetch('/admin/fare');
    if (Array.isArray(data) && data.length > 0) {
      this.rates = data[0];
      this._updateFareCard();
    }
  }

  async openModal() {
      // If rates not loaded yet, fetch them on-demand before opening
      if (!this.rates) {
          await this.sync();
      }

      // After sync, if still null (no fare data in DB yet), open empty modal
      DashboardUtils.setVal('fm-base',         this.rates?.base        ?? '');
      DashboardUtils.setVal('fm-highway',      this.rates?.highway     ?? '');
      DashboardUtils.setVal('fm-special',      this.rates?.special     ?? '');
      DashboardUtils.setVal('fm-disc-student', this.rates?.discStudent ?? '');
      DashboardUtils.setVal('fm-disc-senior',  this.rates?.discSenior  ?? '');
      DashboardUtils.openModal('fare-modal');
  }

  closeModal() { DashboardUtils.closeModal('fare-modal'); }

  async save() {
    const base        = parseFloat(DashboardUtils.getEl('fm-base')?.value)         || 0;
    const highway     = parseFloat(DashboardUtils.getEl('fm-highway')?.value)      || 0;
    const special     = parseFloat(DashboardUtils.getEl('fm-special')?.value)      || 0;
    const discStudent = parseFloat(DashboardUtils.getEl('fm-disc-student')?.value) || 0;
    const discSenior  = parseFloat(DashboardUtils.getEl('fm-disc-senior')?.value)  || 0;

    const payload = { base, highway, special, discStudent, discSenior };

    let result;
    if (this.rates?._id || this.rates?.id) {
      const id = this.rates._id || this.rates.id;
      result = await ApiService.call(`/admin/fare/${id}`, 'PUT', payload);
    } else {
      result = await ApiService.call('/admin/fare', 'POST', payload);
    }

    if (result) {
      this.closeModal();

      // Optimistic update — show new values immediately, preserves _id/id
      this.rates = {
        ...this.rates,
        base, highway, special, discStudent, discSenior,
        updated_at: new Date().toISOString(),
      };
      this._updateFareCard();

      DashboardUtils.showToast('Fare rates updated successfully.');
      ActivityLog.push({
        icon:  'fare',
        title: 'Fare List Updated', // ← fixed typo 'ttile'
        desc:  `Base ₱${base}`,
      });

      // Invalidate then sync to confirm from server
      cache.invalidate('/admin/fare');
      await this.sync();
    }
  }

  _updateFareCard() {
    if (!this.rates) return; // ← guard against null
    const r = this.rates;

    const prices = document.querySelectorAll('.fare-price-num');
    if (prices[0]) prices[0].textContent = `₱${Number(r.base).toFixed(2)}`;
    if (prices[1]) prices[1].textContent = `₱${Number(r.highway).toFixed(2)}`;
    if (prices[2]) prices[2].textContent = `₱${Number(r.special).toFixed(2)}+`;

    const discEl = document.querySelector('.fare-discount-val');
    if (discEl) discEl.textContent = `-${r.discStudent}% / ${r.discSenior}% Discount`;

    const updatedEl = document.querySelector('.fare-updated');
    if (updatedEl) {
      const dateSource = r.updated_at ? new Date(r.updated_at) : new Date();
      updatedEl.textContent = `Updated ${dateSource.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      })}`;
    }
  }

  init() {
    this.sync();
    DashboardUtils.bindOverlayClose('fare-modal', () => this.closeModal());
  }
}