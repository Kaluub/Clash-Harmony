// Instructions for running this file:
// Install Node.JS (and it should come with NPM)
// In a command prompt, navigate to the directory of this file (ex: "cd C:/Users/(name)/Downloads")
// Type: "npm i discord-rpc"
// Once it's done, type "node rpc.js" and it should work.

function setActivity(rpc, date) {
    rpc.setActivity({
        details: `Not much here`,
        state: 'Running a bot, maybe',
        buttons: [{label: "Server" , url: "https://discord.gg/N968u5EEAg"}],
        startTimestamp: date,
        largeImageKey: 'clash_large',
        largeImageText: 'Boo',
        instance: false
    });
};

function startRPC() {
    const DiscordRPC = require('discord-rpc');
    const rpc = new DiscordRPC.Client({transport: 'ipc'})
    const date = Date.now();
    
    rpc.on('ready', () => {
        setActivity(rpc, date);
        setInterval(setActivity, 20000, rpc, date);
    });
    
    rpc.login({clientId: "822095445991096343"});
};

module.exports = startRPC;
if(require.main == module) startRPC();