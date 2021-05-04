module.exports = {
    name:'send',
    admin:true,
    desc:'This is a command for sending any message to a channel.',
    usage:'!send [channel/user ID] [message]',
    async execute(message,args){
        if(!args[0] || !args[1]) return message.channel.send('Usage: ' + this.usage);
        let channel;
        let success = true;
        try{
            channel = await message.client.channels.fetch(args[0]);
        } catch {
            success = false;
        };
        if(!success){
            try{
                channel = await message.client.users.fetch(args[0])
            } catch {
                return message.channel.send(`Could not fetch this channel/user.`)
            };
        };

        args.shift();
        let msg = args.join(' ');
        try{
            await channel.send(msg);
        } catch {
            return message.channel.send(`Couldn't send a message to this channel/user.`);
        };
        return message.channel.send(`Sent a message to ${channel}.`);
    }
};