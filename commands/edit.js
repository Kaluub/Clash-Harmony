const {MessageEmbed} = require('discord.js');

module.exports = {
    name:'edit',
    admin:true,
    desc:'This is a command for editing any message the bot has sent.',
    usage:'!edit [channel ID] [message ID] [new message]',
    async execute(message,args){
        if(!args[0] || !args[1] || !args[2]) return message.channel.send('Usage: ' + this.usage);
        let channel, msg;
        try{
            channel = await message.client.channels.fetch(args[0]);
        } catch {
            return message.channel.send(`Couldn't fetch this channel.`);
        };
        try{
            msg = await channel.messages.fetch(args[1]);
        } catch {
            return message.channel.send(`Couldn't fetch this message.`);
        };
        args.shift(); args.shift();
        let newMessage = args.join(' ');
        try{
            msg.edit(newMessage);
        } catch {
            return message.channel.send(`Couldn't edit this message.`);
        };
        let embed = new MessageEmbed()
            .setTitle('Edited message.')
            .setDescription(`Successfully edited the message.\nClick [here](${msg.url}) to jump to the updated message.`)
            .setColor('#00FF00')
            .setTimestamp()
        return message.channel.send(embed);
    }
};