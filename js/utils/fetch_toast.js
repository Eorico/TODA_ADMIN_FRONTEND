export class FetchToast {
    constructor() {
        this._count     = 0;
        this._el        = null;
        this._hideTimer = null;
        this._safeTimer = null;
    }

    _ensure() {
        if (this._el) return;
        this._el = document.createElement('div');
        this._el.id = 'fetch-toast';
        this._el.innerHTML = `
            <div class="ft-spinner"></div>
            <span>Fetching Data<span class="ft-dots">
                <span>.</span><span>.</span><span>.</span>
            </span></span>
        `;
        document.body.appendChild(this._el);
    }

    show() {
        this._ensure();
        this._count++;
        if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
        // Show immediately — no rAF so hide() cannot race ahead
        this._el.classList.add('visible');
        // Safety: force-hide after 10s if hide() was never called
        if (this._safeTimer) clearTimeout(this._safeTimer);
        this._safeTimer = setTimeout(() => {
            this._count = 0;
            this._el?.classList.remove('visible');
        }, 10_000);
    }

    hide() {
        this._count = Math.max(0, this._count - 1);
        if (this._count > 0) return;
        if (this._safeTimer) { clearTimeout(this._safeTimer); this._safeTimer = null; }
        this._hideTimer = setTimeout(() => {
            if (this._count === 0) this._el?.classList.remove('visible');
        }, 300);
    }

    reset() {
        this._count = 0;
        clearTimeout(this._hideTimer);
        clearTimeout(this._safeTimer);
        this._hideTimer = this._safeTimer = null;
        this._el?.classList.remove('visible');
    }
}

export const fetchToast = new FetchToast();