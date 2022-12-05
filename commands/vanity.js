const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { readJSON } = require('../json.js');
const Locale = require('../classes/locale.js');
const { UserData } = require("../classes/data.js");

async function getVanityRoleText(userdata, guild, member, roles) {
    let desc = Locale.text(userdata.settings.locale, "VANITY_DESC");
    for(const id of userdata.unlocked.roles){
        const role = await guild.roles.fetch(id);
        desc += `\n${member.roles.cache.has(id) ? `🟢` : `🔴`} ${role.name}`;
    };
    return desc;
}

module.exports = {
    name: 'vanity',
    desc: `Manage your vanity roles.`,
    usage: '/vanity',
    execute: async ({interaction, message, userdata}) => {
        const guild = interaction?.guild || message?.guild;
        if(guild.id !== "636986136283185172") return Locale.text(userdata.settings.locale, "SERVER_ERROR");
        
        let member = interaction?.member || message?.member;
        await member.fetch();

        const roles = readJSON('json/vanityroles.json');
        member.roles.cache.each(role => {
            if(roles.includes(role.id) && !userdata.unlocked.roles.includes(role.id)) userdata.unlocked.roles.push(role.id);
        });
        await UserData.set(guild.id, member.user.id, userdata);
        if(userdata.unlocked.roles.length < 1) return Locale.text(userdata.settings.locale, "NO_VANITY_ROLES");
        userdata.unlocked.roles.sort((a, b) => roles.indexOf(a) - roles.indexOf(b));

        let desc = await getVanityRoleText(userdata, guild, member, roles);

        let embed = new MessageEmbed()
            .setTitle(Locale.text(userdata.settings.locale, "VANITY_TITLE"))
            .setDescription(desc)
            .setColor(`#228866`)
            .setTimestamp()
        
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('up')
                .setLabel(Locale.text(userdata.settings.locale, "BUTTON_UP"))
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('select')
                .setLabel(Locale.text(userdata.settings.locale, "BUTTON_SELECT"))
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('down')
                .setLabel(Locale.text(userdata.settings.locale, "BUTTON_DOWN"))
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('clean')
                .setLabel(Locale.text(userdata.settings.locale, "BUTTON_CLEAN"))
                .setStyle('DANGER')
        );

        let sel = 0;
        let descArr = embed.description.replace('➡️ ', '').split('\n');
        descArr[sel + 3] = "➡️ " + descArr[sel + 3];
        let msg = await message?.channel.send({embeds:[embed.setDescription(descArr.join('\n'))], components: [row]});
        if(!msg) {
            await interaction.reply({embeds:[embed.setDescription(descArr.join('\n'))], components: [row]});
            msg = await interaction.fetchReply();
        };

        const collector = msg.createMessageComponentCollector({idle:30000});
        collector.on('collect', async (interaction) => {
            if(interaction.user.id !== member.user.id) return interaction.reply({content: Locale.text(userdata.settings.locale, "NOT_FOR_YOU"), ephemeral: true});
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
                const id = userdata.unlocked.roles[sel];
                if(member.roles.cache.has(id)) await member.roles.remove(id, 'Role toggled.');
                else await member.roles.add(id, 'Role toggled.');
                member = await member.fetch(true);

                // Update desc:
                desc = await getVanityRoleText(userdata, guild, member, roles);
                embed.setDescription(desc);
            };

            if(interaction.customId == 'clean') {
                const roles = [];
                for(const rid of userdata.unlocked.roles){
                    roles.push(rid);
                };
                await member.roles.remove(roles, 'Roles cleaned.');
                embed.setDescription(desc.replaceAll(`🟢`, `🔴`));
            };

            descArr = embed.description.replaceAll('➡️ ', '').split('\n');
            descArr[sel + 3] = "➡️ " + descArr[sel + 3];
            await interaction.update({embeds:[embed.setDescription(descArr.join('\n'))]});
        });
        collector.on('end', async () => {
            if(msg.editable) await msg.edit({embeds:[embed], components: []});
        });
    }
};