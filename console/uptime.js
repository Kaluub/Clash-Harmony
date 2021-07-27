module.exports = {
    name:'uptime',
    usage:'uptime',
    async execute({client}){
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        let date = new Date(Date.now());
        return console.log("\x1b[32m%s\x1b[0m",`Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s [Time: ${date.getDate().toString().length == 1 ? `0${date.getDate()}` : date.getDate()}/${date.getMonth().toString().length == 1 ? `0${date.getMonth()}` : date.getMonth()}/${date.getFullYear()} ${date.getHours().toString().length == 1 ? `0${date.getHours()}` : date.getHours()}:${date.getMinutes().toString().length == 1 ? `0${date.getMinutes()}` : date.getMinutes()}:${date.getSeconds().toString().length == 1 ? `0${date.getSeconds()}` : date.getSeconds()}]`);
    }
};