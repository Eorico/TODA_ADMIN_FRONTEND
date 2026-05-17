import { ApiService } from "../api/api_service.js";
import { DashboardUtils } from "../utils/utils.js";
import { cache } from "../utils/data_cache.js";

/* ============================================
   ANALYSIS DASHBOARD
   Uses Chart.js (loaded via CDN in dashboard.html)
   ============================================ */

export class AnalysisDashboard {
    constructor(store) {
        this.store = store;
        this.period = 'week';    // 'week' | 'month'
        this._charts = {};       // keyed chart instances so we can destroy on re-render
    }

    // ── sync all data in parallel ─────────────────────────────────
    async sync() {
        const [contrib, riders, violations, lostfound, fare] = await Promise.all([
            cache.fetch('/admin/contributions'),
            cache.fetch('/admin/riders'),
            cache.fetch('/admin/violations'),
            cache.fetch('/admin/lost-found'),
            cache.fetch('/admin/fare'),
        ]);

        this.store.anContrib     = Array.isArray(contrib)     ? contrib     : [];
        this.store.anRiders      = Array.isArray(riders)      ? riders      : [];
        this.store.anViolations  = Array.isArray(violations)  ? violations  : [];
        this.store.anLostFound   = Array.isArray(lostfound)   ? lostfound   : [];
        this.store.anFare        = (Array.isArray(fare) && fare.length) ? fare[0] : null;

        this.render();
    }

    // ── period filter helper ──────────────────────────────────────
    setPeriod(p) {
        this.period = p;
        document.getElementById('an-period-week')?.classList.toggle('active', p === 'week');
        document.getElementById('an-period-month')?.classList.toggle('active', p === 'month');
        this.render();
    }

    _cutoff() {
        const d = new Date();
        if (this.period === 'week') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        return d;
    }

    _inPeriod(dateStr) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= this._cutoff();
    }

    // ── main render ───────────────────────────────────────────────
    render() {
        this._renderKPIs();
        this._renderContribChart();
        this._renderViolationsChart();
        this._renderDriversChart();
        this._renderLostFoundChart();
        this._renderFareChart();
    }

    // ── KPI row ───────────────────────────────────────────────────
    _renderKPIs() {
        const contrib    = this.store.anContrib    || [];
        const riders     = this.store.anRiders     || [];
        const violations = this.store.anViolations || [];
        const lf         = this.store.anLostFound  || [];

        const totalContrib = contrib.reduce((s, r) => s + Number(r.amount || 0), 0);
        const activeDrivers  = riders.filter(r => r.status === 'Active').length;
        const pendingDrivers = riders.filter(r => r.member_status === 'pending').length;
        const pendingLF      = lf.filter(i => i.status?.toLowerCase() === 'pending').length;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('an-kpi-contrib',      '₱' + totalContrib.toLocaleString('en-PH', { minimumFractionDigits: 2 }));
        set('an-kpi-contrib-sub',  `${contrib.length} records`);
        set('an-kpi-drivers',      activeDrivers);
        set('an-kpi-drivers-sub',  `${pendingDrivers} pending`);
        set('an-kpi-violations',   violations.length);
        set('an-kpi-violations-sub', `this period`);
        set('an-kpi-lost',         lf.length);
        set('an-kpi-lost-sub',     `${pendingLF} pending`);

        // New drivers this period
        const newDrivers = riders.filter(r => this._inPeriod(r.created_at));
        set('an-kpi-new-drivers', newDrivers.length);
    }

    // ── Contributions bar chart ───────────────────────────────────
    _renderContribChart() {
        const contrib  = this.store.anContrib || [];
        const paid     = contrib.filter(r => r.status === 'paid').length;
        const partial  = contrib.filter(r => r.status === 'partial').length;
        const unpaid   = contrib.filter(r => r.status === 'unpaid').length;

        this._drawChart('an-contrib-chart', 'bar', {
            labels: ['Paid', 'Partial', 'Unpaid'],
            datasets: [{
                data: [paid, partial, unpaid],
                backgroundColor: ['#15803d', '#d97706', '#7a0c0c'],
                borderRadius: 6, borderSkipped: false,
            }]
        }, {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0eeed' } },
                x: { grid: { display: false } }
            }
        });
    }

    // ── Violations donut + table ──────────────────────────────────
    _renderViolationsChart() {
        const vio     = this.store.anViolations || [];
        const fines   = vio.filter(v => v.penalty === 'fine').length;
        const warnings = vio.filter(v => v.penalty !== 'fine').length;

        this._drawChart('an-vio-chart', 'doughnut', {
            labels: ['Fine', 'Warning'],
            datasets: [{
                data: [fines, warnings],
                backgroundColor: ['#7a0c0c', '#d97706'],
                borderWidth: 2, borderColor: '#fff',
            }]
        }, {
            plugins: { legend: { display: false } },
            cutout: '65%',
        });

        // Table
        const tbody = document.getElementById('an-vio-table');
        if (tbody) {
            tbody.innerHTML = vio.slice(0, 10).map(v => `
                <tr style="border-bottom:1px solid var(--border-light)">
                    <td style="padding:7px 8px;font-weight:600;color:var(--text-dark)">${v.driver_name}</td>
                    <td style="padding:7px 8px;color:var(--text-muted)">${v.violation}</td>
                    <td style="padding:7px 8px">
                        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;
                            background:${v.penalty === 'fine' ? '#fee2e2' : '#fef3c7'};
                            color:${v.penalty === 'fine' ? '#7a0c0c' : '#854d0e'}">
                            ${v.penalty === 'fine' ? (v.penalty_amount || '₱500') + ' Fine' : 'Warning'}
                        </span>
                    </td>
                    <td style="padding:7px 8px;color:var(--text-muted)">${v.date || '—'}</td>
                </tr>`).join('') || `<tr><td colspan="4" style="padding:16px;text-align:center;color:var(--text-muted)">No violations recorded.</td></tr>`;
        }
    }

    // ── Drivers pie + new drivers table ──────────────────────────
    _renderDriversChart() {
        const riders   = this.store.anRiders || [];
        const active   = riders.filter(r => r.status === 'Active').length;
        const inactive = riders.filter(r => r.status === 'Inactive').length;
        const suspended = riders.filter(r => r.status === 'Suspended').length;
        const pending  = riders.filter(r => r.member_status === 'pending').length;

        this._drawChart('an-drivers-chart', 'pie', {
            labels: ['Active', 'Inactive', 'Suspended', 'Pending'],
            datasets: [{
                data: [active, inactive, suspended, pending],
                backgroundColor: ['#15803d', '#b8b8b8', '#7a0c0c', '#d97706'],
                borderWidth: 2, borderColor: '#fff',
            }]
        }, {
            plugins: { legend: { display: false } },
        });

        // New drivers table
        const newDrivers = riders
            .filter(r => this._inPeriod(r.created_at))
            .slice(0, 8);
        const tbody = document.getElementById('an-new-drivers-table');
        if (tbody) {
            tbody.innerHTML = newDrivers.map(d => `
                <tr style="border-bottom:1px solid var(--border-light)">
                    <td style="padding:7px 8px;font-weight:600;color:var(--text-dark)">${d.full_name} ${d.last_name}</td>
                    <td style="padding:7px 8px;color:var(--text-muted)">#${d.body_number || '—'}</td>
                    <td style="padding:7px 8px">
                        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;
                            background:${d.member_status === 'approved' ? '#dcfce7' : '#fef3c7'};
                            color:${d.member_status === 'approved' ? '#15803d' : '#854d0e'}">
                            ${d.member_status?.toUpperCase() || 'PENDING'}
                        </span>
                    </td>
                </tr>`).join('') || `<tr><td colspan="3" style="padding:16px;text-align:center;color:var(--text-muted)">No new drivers this period.</td></tr>`;
        }
    }

    // ── Lost & Found doughnut + table ─────────────────────────────
    _renderLostFoundChart() {
        const lf       = this.store.anLostFound || [];
        const pending  = lf.filter(i => i.status?.toLowerCase() === 'pending').length;
        const claimed  = lf.filter(i => i.status?.toLowerCase() === 'claimed').length;
        const resolved = lf.filter(i => i.status?.toLowerCase() === 'resolved').length;

        this._drawChart('an-lf-chart', 'doughnut', {
            labels: ['Pending', 'Claimed', 'Resolved'],
            datasets: [{
                data: [pending, claimed, resolved],
                backgroundColor: ['#d97706', '#15803d', '#0369a1'],
                borderWidth: 2, borderColor: '#fff',
            }]
        }, {
            plugins: { legend: { display: false } },
            cutout: '65%',
        });

        // Table
        const tbody = document.getElementById('an-lf-table');
        if (tbody) {
            const statusColor = s => {
                s = s?.toLowerCase();
                if (s === 'claimed')  return { bg: '#dcfce7', color: '#15803d' };
                if (s === 'resolved') return { bg: '#e0f2fe', color: '#0369a1' };
                return { bg: '#fef3c7', color: '#854d0e' };
            };
            tbody.innerHTML = lf.slice(0, 8).map(i => {
                const sc = statusColor(i.status);
                return `
                <tr style="border-bottom:1px solid var(--border-light)">
                    <td style="padding:7px 8px;font-weight:600;color:var(--text-dark)">${i.name}</td>
                    <td style="padding:7px 8px;color:var(--text-muted)">#${i.body || '—'}</td>
                    <td style="padding:7px 8px;color:var(--text-muted)">${i.date || '—'}</td>
                    <td style="padding:7px 8px">
                        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;
                            background:${sc.bg};color:${sc.color}">
                            ${i.status?.toUpperCase() || 'PENDING'}
                        </span>
                    </td>
                </tr>`;
            }).join('') || `<tr><td colspan="4" style="padding:16px;text-align:center;color:var(--text-muted)">No items recorded.</td></tr>`;
        }
    }

    // ── Fare bar chart + table ────────────────────────────────────
    _renderFareChart() {
        const r = this.store.anFare;
        if (!r) {
            const tbody = document.getElementById('an-fare-table');
            if (tbody) tbody.innerHTML = `<tr><td colspan="2" style="padding:16px;text-align:center;color:var(--text-muted)">No fare data.</td></tr>`;
            return;
        }

        this._drawChart('an-fare-chart', 'bar', {
            labels: ['Base', 'Highway', 'Special'],
            datasets: [{
                label: 'Fare (₱)',
                data: [r.base, r.highway, r.special],
                backgroundColor: ['#7a0c0c', '#c9972a', '#5a0808'],
                borderRadius: 6, borderSkipped: false,
            }]
        }, {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0eeed' },
                    ticks: { callback: v => '₱' + v } },
                x: { grid: { display: false } }
            }
        });

        // Table
        const tbody = document.getElementById('an-fare-table');
        if (tbody) {
            const rows = [
                { label: 'Base Fare',           val: `₱${Number(r.base).toFixed(2)}` },
                { label: 'Highway',             val: `₱${Number(r.highway).toFixed(2)}` },
                { label: 'Special',             val: `₱${Number(r.special).toFixed(2)}` },
                { label: 'Student Discount',    val: `-${Number(r.discStudent).toFixed(0)}%` },
                { label: 'Senior/PWD Discount', val: `-${Number(r.discSenior).toFixed(0)}%` },
            ];
            tbody.innerHTML = rows.map((row, idx) => `
                <tr style="background:${idx % 2 === 0 ? '#fff' : 'var(--surface-2)'};border-top:1px solid var(--border-light)">
                    <td style="padding:10px 12px;font-size:13px;font-weight:600;color:var(--text-dark)">${row.label}</td>
                    <td style="padding:10px 12px;font-size:13px;font-weight:700;color:var(--crimson);text-align:right">${row.val}</td>
                </tr>`).join('');
        }
    }

    // ── Chart.js helper — destroys old instance before redrawing ──
    _drawChart(canvasId, type, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Don't draw if the page isn't visible yet
        if (!document.getElementById('page-analysis')?.classList.contains('active')) return;

        if (this._charts[canvasId]) {
            this._charts[canvasId].destroy();
            delete this._charts[canvasId];
        }
        if (typeof Chart === 'undefined') return;
        this._charts[canvasId] = new Chart(canvas.getContext('2d'), {
            type,
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: {} } },
                ...options,
            }
        });
    }

    // ── Print individual sections ─────────────────────────────────
    printSection(section) {
        const sectionIds = {
            contributions: 'an-section-contributions',
            violations:    'an-section-violations',
            drivers:       'an-section-drivers',
            lostfound:     'an-section-lostfound',
            fare:          'an-section-fare',
            all:           null,
        };

        const orgName  = 'TODA Sovereign — Administrative Control Suite';
        const period   = this.period === 'week' ? 'Weekly Report' : 'Monthly Report';
        const dateStr  = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        let content = '';
        if (section === 'all') {
            content = document.getElementById('page-analysis')?.innerHTML || '';
        } else {
            const el = document.getElementById(sectionIds[section]);
            content = el ? el.outerHTML : '';
        }

        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${orgName} — ${period}</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Barlow', sans-serif; color: #1a1a1a; padding: 32px; }
                    .print-header { margin-bottom: 28px; border-bottom: 3px solid #7a0c0c; padding-bottom: 16px; }
                    .print-org { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #7a0c0c; margin-bottom: 4px; }
                    .print-title { font-size: 26px; font-weight: 900; color: #1a1a1a; }
                    .print-date { font-size: 12px; color: #7a7a7a; margin-top: 4px; }
                    .an-chart-card { border: 1px solid #e8e6e3; border-radius: 10px; padding: 18px; margin-bottom: 18px; break-inside: avoid; }
                    .an-chart-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
                    .an-chart-sub { font-size: 11px; color: #7a7a7a; margin-bottom: 12px; }
                    .an-chart-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
                    .an-print-btn-sm, .an-print-btn, button { display: none !important; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
                    th { text-align: left; padding: 8px 10px; background: #7a0c0c; color: rgba(255,255,255,.8); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
                    td { padding: 8px 10px; border-bottom: 1px solid #f0eeed; }
                    canvas { max-height: 220px !important; }
                    .an-kpi-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; margin-bottom: 18px; }
                    .an-kpi-card { border: 1px solid #e8e6e3; border-radius: 8px; padding: 14px; }
                    .an-kpi-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #7a7a7a; margin-bottom: 4px; }
                    .an-kpi-num { font-size: 22px; font-weight: 900; color: #1a1a1a; }
                    .an-kpi-crimson { background: #7a0c0c; }
                    .an-kpi-crimson .an-kpi-label { color: rgba(255,255,255,.7); }
                    .an-kpi-crimson .an-kpi-num { color: white; }
                    .an-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .an-chart-legend { font-size: 11px; color: #7a7a7a; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
                    .an-legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
                    @media print { body { padding: 16px; } }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <div class="print-org">${orgName}</div>
                    <div class="print-title">${period}</div>
                    <div class="print-date">Generated: ${dateStr}</div>
                </div>
                ${content}
                <script>
                    // Re-render charts in print window
                    setTimeout(() => window.print(), 800);
                <\/script>
            </body>
            </html>
        `);
        win.document.close();
    }

    // ── init ──────────────────────────────────────────────────────
    init() {
        this.sync();
        window.analysisDashboard = this;
    }
}