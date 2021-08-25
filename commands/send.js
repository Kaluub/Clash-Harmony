module.exports = {
    name:'send',
    admin:true,
    noGuild:true,
    desc:'This is a command for sending any message to a channel.',
    usage:'/send [channel/user ID] [message]',
    execute: async ({interaction,message,args}) => {
        if(!args[0] || !args[1]) return `Usage: ${module.exports.usage}`;
        const client = interaction?.client ?? message?.client;
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