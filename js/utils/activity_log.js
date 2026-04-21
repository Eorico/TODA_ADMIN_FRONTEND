export class ActivityLog {
    static MAX = 50;

    static get() {
        try {
            return JSON.parse(localStorage.getItem('admin_activity') || '[]');
        } catch (error) {
            return [];
        }
    }

    static push(entry) {
        const log = ActivityLog.get();
        log.unshift({
            ...entry,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            ts: Date.now()
        });
        localStorage.setItem('admin_activity', JSON.stringify(log.slice(0, ActivityLog.MAX)));
    }

    static clear() {
        localStorage.removeItem('admin_activity');
    }
}