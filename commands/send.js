module.exports = {
    name: 'send',
    desc: 'Text command for sending messages.',
    usage: '!send [channel ID] [message]',
    noInteraction: true,
    admin: true,
    execute: async ({message, args}) => {
        if(!message) return
        const channel = await message.client.channels.fetch(args[0]);
        if(!channel) return "No channel with that ID found.";
        args.shift();
        await channel.send(args.join(" "));
        return `Sent the message to ${channel}.`; 
    }
}