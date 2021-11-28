const { readFileSync, writeFileSync } = require('fs');

class UsageLogger {
    static file = 'usage.csv';
    static log = [];

    static init() {
        this.log.splice(0, this.log.length);
        const file = readFileSync(`./data/logs/${this.file}`, { encoding: 'utf-8' });
        const lines = file.split('\n');
        for (const line of lines) {
            if(line.startsWith('#')) continue;
            const data = line.split(',');
            if(data.length !== 5) continue;
            this.log.push({timestamp: data[0], guildId: data[1], channelId: data[2], userId: data[3], actionName: data[4]});
        };
    };

    static logAction({guildId, channelId, userId, actionName}) {
        const timestamp = Date.now();
        this.log.push({timestamp, guildId, channelId, userId, actionName});
        let file = readFileSync(`./data/logs/${this.file}`, { encoding: 'utf-8' });
        file += `\n${timestamp},${guildId},${channelId},${userId},${actionName}`;
        writeFileSync(`./data/logs/${this.file}`, file, { encoding: 'utf-8' });
    };

    static filterLogs({guildId, channelId, userId, actionName}) {
        return this.log.filter(item => 
            guildId ? item.guildId === guildId : true &&
            channelId ? item.channelId === channelId : true &&
            userId ? item.userId === userId : true &&
            actionName ? item.actionName === actionName : true
        );
    };

    static fetchRawData() {
        return readFileSync(`./data/logs/${this.file}`, { encoding: 'utf-8' });
    };
};

module.exports = UsageLogger;