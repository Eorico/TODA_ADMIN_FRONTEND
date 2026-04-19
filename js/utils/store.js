/* ============================================
   DASHBOARD STORE (global data)
   ============================================ */
export class DashboardStore {
    constructor() {
        this.members = [
            
        ];
        this.lfItems = [
            
        ];
        this.driverData = [
             
        ];
        this.annPosts = [
             
        ];
        this.officerData = [
             
        ];
        this.tcData = [
            
        ];
        this.cnData = [
            
        ];

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