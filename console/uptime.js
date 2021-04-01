module.exports = {
    name:'uptime',
    usage:'uptime',
    async execute(client,args){
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        return console.log("\x1b[32m%s\x1b[0m",`Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`);
    }
};