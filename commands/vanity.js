const {MessageEmbed, MessageButton, MessageActionRow} = require("discord.js");
const Data = require('../classes/data.js');

module.exports = {
    name:'vanity',
    desc:`Manages your vanity roles.`,
    usage:'/vanity',
    execute: async ({interaction, message}) => {
        const guild = interaction?.guild || message?.guild;
        if(!guild) return `This isn't usable outside of a guild.`;
        if(guild.id !== "636986136283185172") return `This command can only be used in the Clash & Harmony Discord server.`;
        
        let member = interaction?.member || message?.member;
        const data = await Data.get(guild.id, member.user.id);
        if(data.unlocked.roles.length < 1) return `You have no vanity roles!`;

        let desc = `Here is a list of all your purchased roles.\nA red circle indicates the role is inactive, a green circle the opposite.\n`;
        for(const id of data.unlocked.roles){
            const role = await guild.roles.fetch(id);
            desc += `\n${member.roles.cache.has(id) ? `🟢` : `🔴`} ${role.name}`;
        };

        let embed = new MessageEmbed()
            .setTitle(`Vanity roles:`)
            .setDescription(desc)
            .setColor(`#228866`)
            .setTimestamp()
        
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('up')
                .setLabel('Up')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('select')
                .setLabel('Toggle')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId('down')
                .setLabel('Down')
                .setStyle('SECONDARY')
        );

        let sel = 0;
        let descArr = embed.description.replace('➡️ ', '').split('\n');
        descArr[sel + 3] = "➡️ " + descArr[sel + 3];
        let msg = await message?.channel.send({embeds:[embed.setDescription(descArr.join('\n'))], components: [row]});
        if(!msg) {
            await interaction.reply({embeds:[embed.setDescription(descArr.join('\n'))], components: [row]});
            msg = await interaction.fetchReply();
        };

        const collector = msg.createMessageComponentCollector({filter: interaction => interaction.user.id == member.user.id, idle:30000});
        collector.on('collect', async (interaction) => {
            if(interaction.customId == 'up'){
                sel -= 1;
                if(sel < 0) sel = embed.description.split('\n').length - 4;
            };
            if(interaction.customId == 'down'){
                sel += 1;
                if(sel >= embed.description.split('\n').length - 3) sel = 0;
            };
            if(interaction.customId == 'select'){
                // Toggle role:
                const id = data.unlocked.roles[sel];
                if(member.roles.cache.has(id)) await member.roles.remove(id, 'Role toggled.');
                else await member.roles.add(id, 'Role toggled.');
                member = await member.fetch(true);
                // Update desc:
                desc = `Here is a list of all your purchased roles.\nA red circle indicates the role is inactive, a green circle the opposite.\n`;
                for(const rid of data.unlocked.roles){
                    const role = await guild.roles.fetch(rid);
                    desc += `\n${member.roles.cache.has(rid) ? `🟢` : `🔴`} ${role.name}`;
                };
                embed.setDescription(desc);
            };
            descArr = embed.description.replace('➡️ ', '').split('\n');
            descArr[sel + 3] = "➡️ " + descArr[sel + 3];
            await interaction.update({embeds:[embed.setDescription(descArr.join('\n'))]});
        });
        collector.on('end', async () => {
            console.log(msg.deleted)
            if(!msg.deleted) await msg.edit({embeds:[embed], components: [null]});
        });
    }
};