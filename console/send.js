module.exports = {
    name:'send',
    aliases:['s'],
    usage:'send [user/channel ID] [message]',
    async execute({client,args}){
        if(!args[0] || !args[1]) return console.log("\x1b[32m%s\x1b[0m",'Usage: ' + this.usage);
        let channel;
        let success = true;
        try{
            channel = await client.channels.fetch(args[0]);
        } catch {
            success = false;
        };
        if(!success){
            try{
                channel = await client.users.fetch(args[0]);
            } catch {
                return console.log("\x1b[32m%s\x1b[0m",'Invalid ID provided.');
            };
        };

        args.shift();
        let msg = args.join(' ');
        try{
            await channel.send(msg);
        } catch {
            return console.log("\x1b[32m%s\x1b[0m",`Could not send your message to that channel/user.`);
        };
        return console.log("\x1b[32m%s\x1b[0m",`Successfully sent your message to that channel/user.`);
    }
};