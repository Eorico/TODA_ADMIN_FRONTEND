/* ============================================
   BASE / SHARED UTILITIES
   ============================================ */
export class DashboardUtils {
    static showToast(msg) {
        let toast = document.getElementById('lf-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'lf-toast';
            toast.className = 'toast-notification';
            toast.innerHTML = `<span id="lf-toast-msg"></span>`;
            document.body.appendChild(toast);

            if (!document.querySelector('#toast-styles')) {
                const style = document.createElement('style');
                style.id = 'toast-styles';
                style.textContent = `
                    .toast-notification {
                        position: fixed;
                        bottom: 30px;
                        right: 30px;
                        background: #2c3e50;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        z-index: 10000;
                        opacity: 0;
                        transform: translateY(20px);
                        transition: all 0.3s ease;
                        pointer-events: none;
                    }
                    .toast-notification.show {
                        opacity: 1;
                        transform: translateY(0);
                    }
                `;
                document.head.appendChild(style);
            }
        }
        document.getElementById('lf-toast-msg').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3200);
    }

    static badgeClass(s) {
        if (s === 'Active') return 'badge-active';
        if (s === 'Inactive') return 'badge-inactive';
        return 'badge-suspended';
    }

    static getEl(id) {
        return document.getElementById(id);
    }

    static setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    static clearFields(ids) {
        ids.forEach(id => DashboardUtils.setVal(id, ''));
    }

    static openModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.add('open');
    }

    static closeModal(id) {
        const m = document.getElementById(id);
        if (m) m.classList.remove('open');
    }

    static bindOverlayClose(modalId, closeFn) {
        const modal = document.getElementById(modalId);
        if (modal) modal.onclick = function (e) {
            if (e.target === this) closeFn();
        };
    }
}