import { DashboardUtils } from "../utils/utils.js";
import { ApiService } from "../api/api_service.js";
/* ============================================
   DASHBOARD 2: LOST & FOUND
   ============================================ */
export class LostFoundDashboard {
    constructor(store) {
        this.store = store;
        this.itemIcons = [
            `<svg width="22" height="22" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
            `<svg width="22" height="22" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
        ];
    }

    async sync() {
        const data = await ApiService.call('/admin/lost-found', 'GET');
        if (data) {
            this.store.lfItems = data;
            this.renderItems();
        } 
    }

    randomIcon() {
        return this.itemIcons[Math.floor(Math.random() * this.itemIcons.length)];
    }

    renderItems() {
        const container = DashboardUtils.getEl('lf-items-container');
        if (!container) return;
        container.innerHTML = '';
        
        this.store.lfItems.forEach(item => {
            const sc = item.status.toLowerCase();
            // Check if item has a saved image, else use icon
            const thumb = item.image 
                ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>`
                : this.randomIcon();

            const row = document.createElement('div');
            row.className = 'lf-item-row';
            row.innerHTML = `
                <div class="lf-item-thumb">${thumb}</div>
                <div class="lf-item-info">
                    <div class="lf-item-name">${item.name}</div>
                    <div class="lf-item-meta">Body #${item.body} &nbsp;•&nbsp; Found ${item.date}</div>
                </div>
                <div class="lf-item-status status-${sc}">${item.status}</div>
            `;
            container.appendChild(row);
        });
    }

    bindPhotoUpload() {
        const fileInput = DashboardUtils.getEl('lf-file-input');
        if (!fileInput) return;
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                const area = DashboardUtils.getEl('lf-photo-area');
                if (!area) return;
                let img = area.querySelector('img');
                if (!img) { img = document.createElement('img'); area.appendChild(img); }
                img.src = e.target.result;
                area.classList.add('has-image');
                area.querySelectorAll('.photo-icon,.photo-tap,.photo-hint').forEach(el => el.style.display = 'none');
            };
            reader.readAsDataURL(file);
        });
    }

    async submit() {
        const name = DashboardUtils.getEl('lf-item-name')?.value.trim();
        const bodyNum = DashboardUtils.getEl('lf-body-num')?.value.trim();
        const dateInput = DashboardUtils.getEl('lf-date')?.value;
        
        if (!name) { DashboardUtils.getEl('lf-item-name')?.focus(); return; }

        const img = DashboardUtils.getEl('lf-photo-area')?.querySelector('img');
        
        const dateLabel = dateInput
            ? new Date(dateInput + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Today';

        const payload = {
            name: name,
            body: bodyNum || '—',
            date: dateLabel,
            status: 'Pending',
            image: img ? img.src : null  
        };

        const result = await ApiService.call('/admin/lost-found', 'POST', payload);

        if (result) {
            this.resetForm();
            DashboardUtils.showToast(`"${name}" posted to bulletin.`);
            await this.sync();
        }
    }

    resetForm() {
        DashboardUtils.clearFields(['lf-item-name', 'lf-body-num', 'lf-date']);
        const area = DashboardUtils.getEl('lf-photo-area');
        if (area) {
            area.classList.remove('has-image');
            area.querySelector('img')?.remove();
            area.querySelectorAll('.photo-icon,.photo-tap,.photo-hint').forEach(el => el.style.display = '');
        }
        const fi = DashboardUtils.getEl('lf-file-input');
        if (fi) fi.value = '';
    }

    init() {
        this.sync();
        this.bindPhotoUpload();
        const submitBtn = DashboardUtils.getEl('lf-submit-btn');
        if (submitBtn) submitBtn.onclick = () => this.submit();
    }
}