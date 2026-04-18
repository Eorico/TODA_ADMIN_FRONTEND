/* ============================================
   DASHBOARD STORE (global data)
   ============================================ */
export class DashboardStore {
    constructor() {
        this.members = [
            { name: 'Juan Dela Cruz', id: 2055, status: 'Active', contrib: '₱250.00', date: 'Oct 21' },
            { name: 'Maria Santos',   id: 1138, status: 'Active', contrib: '₱250.00', date: 'Oct 21' },
        ];
        this.lfItems = [
            { name: 'Black Leather Wallet', body: '2045', date: 'Oct 22', status: 'Pending' },
            { name: 'Samsung Galaxy A54',   body: '1138', date: 'Oct 20', status: 'Claimed' },
        ];
        this.driverData = [
            { fname: 'Antonio',    lname: 'Santos', id: 'ID-2024-0089', body: '345', status: 'Active',   contact: '+63 917 555 1234' },
            { fname: 'Maria Clara', lname: 'D.',    id: 'ID-2024-0042', body: '102', status: 'Inactive', contact: '+63 920 888 4321' },
        ];
        this.annPosts = [
            { id: 1, type: 'emergency',   title: 'Road Maintenance: J. Rizal Ave.', body: 'Expect heavy traffic due to drainage repairs starting Oct 20. Drivers are advised to take alternative routes via Mabini St.', time: 'Oct 24, 09:45 AM', author: 'Admin Command' },
            { id: 2, type: 'operational', title: 'Fare Adjustment — Effective Oct 25', body: 'Base fare has been updated to ₱15.00 per passenger for the first 2 kilometers. All drivers must comply immediately.', time: 'Oct 23, 02:00 PM', author: 'Admin Juan Dela Cruz' },
        ];
        this.officerData = [
            { fname: 'Roberto',   mi: 'V.', lname: 'Macaspac', id: 'TODA-001', role: 'President',      status: 'on-duty',  phone: '+63 917 555 0001', email: 'president@toda.ph' },
            { fname: 'Carmelita', mi: 'S.', lname: 'Reyes',    id: 'TODA-002', role: 'Vice President', status: 'in-office', phone: '+63 917 555 0002', email: 'vp@toda.ph' },
        ];
        this.tcData = [
            { day: 'Mon / Wed', bodyRange: '0 – 2', time: '7:00 AM – 7:00 PM', status: 'active', route: 'All Routes', effectivity: '2024-01-15' },
            { day: 'Tue / Thu', bodyRange: '3 – 5', time: '7:00 AM – 7:00 PM', status: 'active', route: 'All Routes', effectivity: '2024-01-15' },
        ];
        this.cnData = [
            { fname: 'Juan',  lname: 'Dela Cruz', body: '345', driverid: 'ID-2024-0089', amount: 250, period: 'Oct 2024', date: '2024-10-21', status: 'paid', notes: '' },
            { fname: 'Maria', lname: 'Santos',    body: '102', driverid: 'ID-2024-0042', amount: 250, period: 'Oct 2024', date: '2024-10-21', status: 'paid', notes: '' },
        ];

        // Pagination / state
        this.drPage = 1;
        this.drData = null;
        this.drEditIdx = null;
        this.cnPage = 1;
        this.cnEditIdx = null;
        this.cnDeleteIdx = null;
        this.cnFiltered = null;
        this.offEditIdx = null;
        this.offDeleteIdx = null;
        this.offView = 'grid';
        this.tcEditIdx = null;
        this.tcDeleteIdx = null;
        this.annNextId = 5;
        this.offNextId = 7;
    }
}