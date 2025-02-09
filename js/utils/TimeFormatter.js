export class TimeFormatter {
    static formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    static parseTime(hours, minutes, seconds) {
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    static parseEndTime(endTimeString) {
        const now = new Date();
        const [hours, minutes] = endTimeString.split(':').map(Number);
        const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        if (endDateTime < now) {
            endDateTime.setDate(endDateTime.getDate() + 1);
        }
        
        return endDateTime - now;
    }
} 