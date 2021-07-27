const {MessageEmbed} = require('discord.js');

module.exports = {
    name:'edit',
    admin:true,
    noGuild:true,
    desc:'This is a command for editing any message the bot has sent.',
    usage:'!edit [channel ID] [message ID] [new message]',
    execute: async ({interaction,message,args}) => {
        if(!args[0] || !args[1] || !args[2]) return `Usage: ${this.usage}`;
        const client = interaction?.client ?? message?.client;
        let channel, msg;

        try{
            channel = await client.channels.fetch(args[0]);
        } catch {
            return `Couldn't fetch this channel.`;
        };

        try{
            msg = await channel.messages.fetch(args[1]);
        } catch {
            return `Couldn't fetch this message.`;
        };

        args.shift(); args.shift();
        let newMessage = args.join(' ');
        
        try{
            msg.edit(newMessage);
        } catch {
            return `Couldn't edit this message.`;
        };

        const embed = new MessageEmbed()
            .setTitle('Edited message.')
            .setDescription(`Successfully edited the message.\nClick [here](${msg.url}) to jump to the updated message.`)
            .setColor('#00FF00')
            .setTimestamp()
        return {embeds:[embed]};
    }
};