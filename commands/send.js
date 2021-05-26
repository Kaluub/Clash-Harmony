module.exports = {
    name:'send',
    admin:true,
    desc:'This is a command for sending any message to a channel.',
    usage:'!send [channel/user ID] [message]',
    async execute({interaction,message,args}){
        if(!args[0] || !args[1]) return `Usage: ${this.usage}`;
        const member = interaction?.member ?? message?.member;
        let channel;
        let success = true;
        try{
            channel = await member.client.channels.fetch(args[0]);
        } catch {
            success = false;
        };
        if(!success){
            try{
                channel = await member.client.users.fetch(args[0]);
            } catch {
                return `Could not fetch this channel/user.`;
            };
        };

        args.shift();
        let msg = args.join(' ');
        try{
            await channel.send(msg);
        } catch {
            return `Couldn't send a message to this channel/user.`;
        };
        return `Sent a message to ${channel}.`;
    }
};