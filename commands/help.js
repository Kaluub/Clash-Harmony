const {MessageEmbed} = require('discord.js');
const {readJSON} = require('../json.js');

module.exports = {
    name:'help',
    aliases:['?'],
    admin:false,
    desc:'A list of every command.',
    usage:'!help [command]',
    async execute(message,args,ex){
        const {admins} = await readJSON('config.json');
        if((args[0] == '-a' && admins.includes(message.author.id)) || !args[0]){
            let msg = new MessageEmbed()
                .setColor('#3F3FFF')
                .setTitle(`Help interface:`)
                .setDescription(`Here is a list of every command currently accessible${args[0] == '-a' && admins.includes(message.author.id) ? ' (admin commands hidden)' : ''}.\n`)
                .setTimestamp();
            for(const [key,cmd] of ex.commands.entries()){
                if(!cmd) continue;
                if(cmd.admin && !admins.includes(message.author.id)) continue;
                if(cmd.admin && args.includes('-a')) continue;
                msg.setDescription(msg.description + `\n\n**!${cmd.name}**:\n${cmd.desc}`);
            };
            return message.channel.send({embed:msg,split:true});
        };
        const commandName = args.shift().toLowerCase();
        const command = ex.commands.get(commandName) || ex.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if(command){
            if(command.admin && !admins.includes(message.author.id)) return message.channel.send(`There is no command with that name.`);
            let msg = new MessageEmbed()
                .setColor('#3F3FFF')
                .setTitle(`Help interface: ${command.name}`)
                .addField(`Description:`,`${command.desc}`)
                .addField(`Usage:`,`\`${command.usage}\` `)
                .setTimestamp();
            if(command.aliases && command.aliases.length > 0) msg.addField(`Aliases:`,command.aliases.join('; '));
            return message.channel.send({embed:msg,split:true});
        };
        return message.channel.send(`There is no command with that name.`);
    }
};