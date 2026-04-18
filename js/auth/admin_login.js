// js/login.js

export class AdminLogin {
    constructor() {
        this.loginBtn = document.getElementById('login-btn');
        this.adminIn  = document.getElementById('admin-id');
        this.passIn   = document.getElementById('password');
        this.errorMsg = document.getElementById('error-msg');
        this.eyeBtn   = document.getElementById('eye-btn');
        this.eyeIcon  = document.getElementById('eye-icon');
        this.shown    = false;
    }

    /* ── Eye toggle ── */
    togglePassword() {
        this.shown = !this.shown;
        this.passIn.type = this.shown ? 'text' : 'password';
        this.eyeIcon.innerHTML = this.shown
            ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
            : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }

    /* ── Show error ── */
    showError(msg) {
        this.errorMsg.textContent = msg;
        this.errorMsg.classList.add('visible');
    }

    /* ── Clear error ── */
    clearError() {
        this.errorMsg.classList.remove('visible');
    }

    /* ── Shake invalid fields ── */
    shakeFields() {
        [this.adminIn, this.passIn].forEach(el => {
            el.style.borderColor = 'var(--crimson)';
            setTimeout(() => el.style.borderColor = '', 1200);
        });
    }

    /* ── Grant access UI + redirect ── */
    grantAccess() {
        this.loginBtn.style.background = 'linear-gradient(160deg, #2e7d32, #1b5e20)';
        this.loginBtn.querySelector('.btn-text').textContent = '✓ Access Granted';
        this.loginBtn.querySelector('.btn-text').style.display = 'block';
        localStorage.setItem('isLoggedIn', 'true');
        setTimeout(() => {
            window.location.href = '/frontend/web/html/admin_dashboard.html';
        }, 1000);
    }

    /* ── Validate credentials ── */
    validate(id, pass) {
        // Swap this out for a real API call later
        return id === 'admin' && pass === 'admin123';
    }

    /* ── Core login flow ── */
    handleLogin() {
        const id   = this.adminIn.value.trim();
        const pass = this.passIn.value;

        this.clearError();

        if (!id || !pass) {
            this.showError('Please fill in both fields.');
            return;
        }

        this.loginBtn.classList.add('loading');

        setTimeout(() => {
            this.loginBtn.classList.remove('loading');

            if (this.validate(id, pass)) {
                this.grantAccess();
            } else {
                this.showError('Invalid admin ID or password. Please try again.');
                this.shakeFields();
            }
        }, 1400);
    }

    /* ── Auth guard (static — no instance needed) ── */
    static requireAuth() {
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            window.location.href = '/frontend/web/html/admin_login.html';
        }
    }

    /* ── Bind all events ── */
    bindEvents() {
        this.eyeBtn.addEventListener('click', () => this.togglePassword());
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        [this.adminIn, this.passIn].forEach(el => {
            el.addEventListener('keydown', e => {
                if (e.key === 'Enter') this.handleLogin();
            });
        });
    }

    /* ── Entry point ── */
    init() {
        if (!this.loginBtn) return; // not on login page, bail early
        this.bindEvents();
    }
}