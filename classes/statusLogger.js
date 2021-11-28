const { readFileSync, writeFileSync } = require('fs');

class StatusLogger {
    static file = 'status.csv';
    static log = [];

    static init() {
        this.log.splice(0, this.log.length);
        const file = readFileSync(`./data/logs/${this.file}`, { encoding: 'utf-8' });
        const lines = file.split('\n');
        for (const line of lines) {
            if(line.startsWith('#')) continue;
            const data = line.split(',');
            if(data.length !== 3) continue;
            this.log.push({timestamp: data[0], type: data[1], detail: data[2]});
        };
    };

    static logStatus({type, detail}) {
        const timestamp = Date.now();
        this.log.push({timestamp, type, detail});
        let file = readFileSync(`./data/logs/${this.file}`, { encoding: 'utf-8' });
        file += `\n${timestamp},${type},${detail}`;
        writeFileSync(`./data/logs/${this.file}`, file, { encoding: 'utf-8' });
    };

    static filterLogs({timestamp, type}) {
        return this.log.filter(item => 
            timestamp ? item.timestamp === timestamp : true &&
            type ? item.type === type : true
        );
    };

    static fetchRawData() {
        return readFileSync(`./data/logs/${this.file}`, { encoding: 'utf-8' });
    };
};

module.exports = StatusLogger;