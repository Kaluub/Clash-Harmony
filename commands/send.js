module.exports = {
    name: 'send',
    admin: true,
    noGuild: true,
    desc: 'This is a command for sending any message to a channel.',
    usage: '/send [channel/user ID] [message]',
    options: [
        {
            "name": "id",
            "description": "The channel/user ID to send a message to.",
            "type": "STRING",
            "required": true
        },
        {
            "name": "content",
            "description": "The content to use for the message.",
            "type": "STRING",
            "required": true
        },
        {
            "name": "hide-response",
            "description": "Whether or not to hide the response.",
            "type": "BOOLEAN",
            "required": false
        }
    ],
    execute: async ({interaction,message,args}) => {
        if(!args[0] || !args[1]) return `Usage: ${module.exports.usage}`;
        const client = interaction?.client ?? message?.client;
        let channel;
        let ephemeral = interaction?.options.getBoolean('hide-response') ?? false;
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
                return {content: `Could not fetch this channel/user.`, ephemeral};
            };
        };

        args.shift();
        let msg = interaction?.options.getString('content') ?? args.join(' ');
        try{
            await channel.send(msg);
        } catch {
            return {content: `Couldn't send a message to this channel/user.`, ephemeral};
        };
        
        return {content: `Sent a message to ${channel}.`, ephemeral};
    }
};