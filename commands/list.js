const Data = require('../classes/data.js');
const {readJSON} = require('../json.js');
const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');

module.exports = {
    name:'list',
    aliases:['l'],
    admin:false,
    desc:`This is a command for viewing your owned frames and backgrounds.`,
    usage:'/list [frames/backgrounds]',
    execute: async ({interaction,message,args}) => {
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let userdata = await Data.get(guild.id, member.user.id);
        let rewards = await readJSON('json/rewards.json');
        if(args[0]){
            const fText = ['frames','frame','f','fr'];
            if(fText.includes(args[0].toLowerCase())){
                let embed = new MessageEmbed()
                    .setTitle('Owned frames:')
                    .setColor('#838383')
                    .setDescription('')
                for(const i in userdata.unlocked.frames){
                    let id = userdata.unlocked.frames[i]
                    let frame = rewards[id];
                    embed.setDescription(embed.description + `\n• ${frame.name}`);
                };
                return {embeds:[embed]};
            };
    
            const bText = ['backgrounds','background','b','bg','bgs','backg'];
            if(bText.includes(args[0].toLowerCase())){
                let embed = new MessageEmbed()
                    .setTitle('Owned backgrounds:')
                    .setColor('#838383')
                    .setDescription('')
                for(const i in userdata.unlocked.backgrounds){
                    let id = userdata.unlocked.backgrounds[i]
                    let background = rewards[id];
                    embed.setDescription(embed.description + `\n• ${background.name}`);
                };
                return {embeds:[embed]};
            };
        };

        const embed = new MessageEmbed()
            .setColor('#33AA33')
            .setTitle(`Owned rewards:`)
            .setDescription(`To select a category, use the buttons below.`)
            .setFooter(`This message expires at:`)
            .setTimestamp(Date.now() + 30000);
        
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('frames')
                .setLabel('Frames')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('backgrounds')
                .setLabel('Backgrounds')
                .setStyle('SECONDARY')
        );
        
        let msg = await message?.channel.send({embeds:[embed], components:[row]});
        if(!msg) {
            await interaction?.reply({embeds:[embed], components:[row]});
            msg = await interaction?.fetchReply();
        };

        let collector = msg.createMessageComponentCollector({filter: int => int.user.id == member.user.id, idle:30000});
        collector.on('collect', async int => {
            if(int.customId == 'backgrounds'){ // Backgrounds:
                embed.setDescription('**Backgrounds**:\n');
                for(const i in userdata.unlocked.backgrounds){
                    let id = userdata.unlocked.backgrounds[i];
                    let background = rewards[id];
                    embed.setDescription(embed.description + `\n• ${background.name}`);
                };
            };

            if(int.customId == 'frames'){ // Frames:
                embed.setDescription('**Frames**:\n');
                for(const i in userdata.unlocked.frames){
                    let id = userdata.unlocked.frames[i];
                    let frame = rewards[id];
                    embed.setDescription(embed.description + `\n• ${frame.name}`);
                };
            };

            embed.setDescription(embed.description + '\n\nTo select a frame or background, use `!custom [reward name]`.');
            embed.setTimestamp(Date.now() + 30000);
            await int.update({embeds:[embed]});
        });
        collector.on('end', async () => {
            embed.setFooter('This message has expired.');
            if(!msg.deleted) await msg.edit({embeds:[embed], components:[]});
        });
    }
};