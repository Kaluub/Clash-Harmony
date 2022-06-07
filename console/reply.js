module.exports = {
    name:'reply',
    aliases:['re'],
    usage:'reply [channel ID] [message ID] [reply]',
    async execute({client, args}){
        if(!args[0] || !args[1] || !args[2]) return console.log("\x1b[32m%s\x1b[0m",'Usage: ' + this.usage);
        let channel;
        try {
            channel = await client.channels.fetch(args[0]);
        } catch {
            return console.log("\x1b[32m%s\x1b[0m",'Invalid channel ID provided.');
        };

        let message;
        try {
            message = await channel.messages.fetch(args[1]);
        } catch {
            return console.log("\x1b[32m%s\x1b[0m",'Invalid message ID provided.');
        };

        args.shift(); args.shift();
        let msg = args.join(' ');
        try{
            await message.reply(msg);
        } catch {
            return console.log("\x1b[32m%s\x1b[0m",`Could not send your reply to that message.`);
        };
        return console.log("\x1b[32m%s\x1b[0m",`Successfully sent your reply to that message.`);
    }
};