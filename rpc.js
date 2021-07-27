module.exports = function(){
    const DiscordRPC = require('discord-rpc');
    const rpc = new DiscordRPC.Client({transport: 'ipc'})
    const {rpcClient} = require('./config.json');
    const date = Date.now()
    
    rpc.on('ready', () => {
        setInterval(function(){
            rpc.setActivity({
                details: `Hi (test)`,
                state: 'Running a bot, maybe',
                startTimestamp: date,
                largeImageKey: 'clash_large',
                largeImageText: 'Still a test',
                instance: false
            });
        }, 15000)
    });
    
    rpc.login({clientId:rpcClient});
};