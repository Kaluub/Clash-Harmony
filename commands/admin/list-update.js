const { updateMembers } = require('../../functions.js');
const { readJSON } = require('../../json.js');

async function updateClash(interaction, config) {
    const channel = await interaction.guild.client.channels.fetch(config['clashMembersMessageChannel']);
    const msg = await channel.messages.fetch(config['clashMembersMessage']);
    const embed = await updateMembers(interaction.guild, 'clash');
    await msg.edit({embeds: [embed]});
};

async function updateHarmony(interaction, config) {
    const channel = await interaction.guild.client.channels.fetch(config['harmonyMembersMessageChannel']);
    const msg = await channel.messages.fetch(config['harmonyMembersMessage']);
    const embed = await updateMembers(interaction.guild, 'harmony');
    await msg.edit({embeds: [embed]});
};

module.exports = {
    name: 'list/update',
    execute: async ({interaction}) => {
        if(interaction.guild != '636986136283185172') return 'This can only be used in the Clash & Harmony discord server.';
        const config = await readJSON('config.json');
        const clan = interaction.options.getString('clan', false);

        if(clan == 'clash') updateClash(interaction, config);
        else if(clan == 'harmony') updateHarmony(interaction, config);
        else {
            updateClash(interaction, config);
            updateHarmony(interaction, config);
        };

        return 'Updated the member list.';
    }
};