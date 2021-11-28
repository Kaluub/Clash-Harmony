const Locale = require('../classes/locale.js');
const { readJSON } = require('../json.js');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'list',
    aliases: ['l'],
    admin: false,
    desc: `This is a command for viewing your owned backgrounds and frames.`,
    usage: '/list',
    execute: async ({interaction, message, userdata}) => {
        const member = interaction?.member ?? message?.member;
        let rewards = await readJSON('json/rewards.json');

        const embed = new MessageEmbed()
            .setColor('#33AA33')
            .setTitle(Locale.text(userdata.locale, "LIST_TITLE"))
            .setDescription(Locale.text(userdata.locale, "LIST_DESC"))
        
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('backgrounds')
                .setLabel(Locale.text(userdata.locale, "BUTTON_BACKGROUNDS"))
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('frames')
                .setLabel(Locale.text(userdata.locale, "BUTTON_FRAMES"))
                .setStyle('SECONDARY')
        );
        
        const msg = await interaction?.reply({embeds: [embed], components: [row], fetchReply: true}) ?? await message?.reply({embeds: [embed], components: [row]});

        let collector = msg.createMessageComponentCollector({idle: 30000});
    
        collector.on('collect', async int => {
            if(int.user.id !== member.id) return await int.reply({content: Locale.text(userdata.locale, "NOT_FOR_YOU"), ephemeral: true});

            if(int.customId == 'backgrounds'){ // Backgrounds:
                embed.setDescription(Locale.text(userdata.locale, "LIST_BACKGROUNDS"));
                for(const id of userdata.unlocked.backgrounds){
                    const background = rewards[id];
                    embed.setDescription(embed.description + Locale.text(userdata.locale, "LIST_REWARD", background.name));
                };
            };

            if(int.customId == 'frames'){ // Frames:
                embed.setDescription(Locale.text(userdata.locale, "LIST_FRAMES"));
                for(const id of userdata.unlocked.frames){
                    const frame = rewards[id];
                    embed.setDescription(embed.description + Locale.text(userdata.locale, "LIST_REWARD", frame.name));
                };
            };

            embed.setDescription(embed.description + Locale.text(userdata.locale, "LIST_CONCLUSION"));
            embed.setTimestamp(Date.now() + 30000);
            await int.update({embeds:[embed]});
        });
        collector.on('end', async () => {
            embed.setFooter(Locale.text(userdata.locale, "EXPIRED"));
            if(!msg.deleted) await msg.edit({embeds:[embed], components:[]});
        });
    }
};