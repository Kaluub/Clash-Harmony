const Data = require('../classes/data.js');
const Locale = require('../classes/locale.js');
const { readJSON } = require('../json.js');
const { createProfileCard } = require('../functions.js');
const { MessageActionRow, MessageSelectMenu, MessageAttachment } = require('discord.js');

module.exports = {
    name: 'set',
    aliases: ['s', 'custom', 'c'],
    admin: false,
    desc: 'This is a command for customizing your profile card.',
    usage: '/set',
    execute: async ({interaction, message}) => {
        if(interaction) await interaction?.deferReply();
        const { admins } = await readJSON('config.json');
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;

        const rewards = await readJSON('json/rewards.json');
        let userdata = await Data.get(guild.id, member.user.id);

        const backgroundMenu = new MessageSelectMenu().setCustomId('set-background').setPlaceholder(Locale.text(userdata.locale, "SET_BACKGROUND"));
        await userdata.unlocked.backgrounds.forEach(async id => {
            const bg = rewards[id];
            backgroundMenu.addOptions({label: bg.name, value: bg.id, description: bg.desc.slice(0, 99)});
        });

        const frameMenu = new MessageSelectMenu().setCustomId('set-frame').setPlaceholder(Locale.text(userdata.locale, "SET_FRAME"));
        await userdata.unlocked.frames.forEach(async id => {
            const fr = rewards[id];
            frameMenu.addOptions({label: fr.name, value: fr.id, description: fr.desc.slice(0, 99)});
        });

        const row1 = new MessageActionRow().setComponents(backgroundMenu);
        const row2 = new MessageActionRow().setComponents(frameMenu);

        const buffer = await createProfileCard(member, rewards, userdata);
        const att = new MessageAttachment().setFile(buffer).setName('card.png');

        const msg = await interaction?.editReply({content: Locale.text(userdata.locale, "SET_DESC"), files: [att], components: [row1, row2], fetchReply: true}) ?? await message?.reply({content: Locale.text(userdata.locale, "SET_DESC"), files: [att], components: [row1, row2]});

        const collector = msg.createMessageComponentCollector({idle: 120000});
        
        collector.on('collect', async int => {
            if(!admins.includes(int.user.id) && int.user.id !== member.user.id) return await int.reply({content: Locale.text(userdata.locale, "NOT_FOR_YOU"), ephemeral: true});
            
            await int.deferUpdate();

            if(int.customId == 'set-background') {
                userdata.card.background = int.values[0];
                userdata = await Data.set(guild.id, member.user.id, userdata);
            };

            if(int.customId == 'set-frame') {
                userdata.card.frame = int.values[0];
                userdata = await Data.set(guild.id, member.user.id, userdata);
            };

            await msg.removeAttachments();
            const newbuffer = await createProfileCard(member, rewards, userdata);
            const newatt = new MessageAttachment().setFile(newbuffer).setName('card.png');
            return await int.editReply({files: [newatt]});
        });

        collector.on('end', async () => {
            if(!msg.deleted) await msg.edit({content: `~~${msg.content}~~`, components: []});
        });
    }
};