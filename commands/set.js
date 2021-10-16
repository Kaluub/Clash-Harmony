const Data = require('../classes/data.js');
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
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;

        const rewards = await readJSON('json/rewards.json');
        let userdata = await Data.get(guild.id, member.user.id);

        const backgroundMenu = new MessageSelectMenu().setCustomId('set-background').setPlaceholder('Select your background!');
        await userdata.unlocked.backgrounds.forEach(async id => {
            const bg = rewards[id];
            backgroundMenu.addOptions({label: bg.name, value: bg.id, description: bg.desc.slice(0, 99)});
        });

        const frameMenu = new MessageSelectMenu().setCustomId('set-frame').setPlaceholder('Select your frame!');
        await userdata.unlocked.frames.forEach(async id => {
            const fr = rewards[id];
            frameMenu.addOptions({label: fr.name, value: fr.id, description: fr.desc.slice(0, 99)});
        });

        const row1 = new MessageActionRow().setComponents(backgroundMenu);
        const row2 = new MessageActionRow().setComponents(frameMenu);

        const buffer = await createProfileCard(member, rewards, userdata);
        const att = new MessageAttachment().setFile(buffer).setName('card.png');

        const msg = await interaction?.reply({content: 'Select your background & frame here!\n\nPreview:', files: [att], components: [row1, row2], fetchReply: true}) ?? await message?.reply({content: 'Select your background & frame here:\n\nPreview:', files: [att], components: [row1, row2]});

        const collector = msg.createMessageComponentCollector({idle: 120000});
        
        collector.on('collect', async int => {
            if(int.user.id !== member.user.id) return int.reply({content: 'This isn\'t your profile, shoo!', ephemeral: true});
            
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
            return await int.update({files: [newatt]});
        });

        collector.on('end', async () => {
            if(!msg.deleted) await msg.edit({content: `~~${msg.content}~~`, components: []});
        });
    }
};