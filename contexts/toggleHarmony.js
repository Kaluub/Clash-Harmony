const { updateMembers } = require('../functions.js');
const { readJSON } = require('../json.js');

module.exports = {
    name: 'Toggle Harmony',
    type: 'USER',
    admin: true,
    execute: async ({interaction}) => {
        const config = await readJSON('config.json');
        const channel = await interaction.guild.client.channels.fetch(config['harmonyMembersMessageChannel']);
        const msg = await channel.messages.fetch(config['harmonyMembersMessage']);
        const member = interaction.options.getMember('user');

        if(!member) {
            const embed = await updateMembers(interaction.guild, 'harmony');
            await msg.edit({embeds: [embed]});
            return {content: `This member has left the server, so the member list was updated to reflect that.`, ephemeral: true};
        };
        if(!member.manageable) return {content: `Role hierarchy denies your operation.`, ephemeral: true};

        if(member.roles.cache.hasAny('813870575453077504', '813847814412042280')) {
            try {
                await member.roles.remove(['813870575453077504', '813847814412042280', '813848188741353492', '813849026343600235', '813850172219326484'], `${interaction.user.tag} removed them from Harmony!`);   
            } catch {
                return {content: `The role(s) doesn't exist in this guild.`, ephemeral: true};
            };

            const embed = await updateMembers(interaction.guild, 'harmony');
            await msg.edit({embeds: [embed]});
    
            return {content: `Successfully removed ${member.user.tag} from Harmony!`, ephemeral: true};
        } else {
            try {
                await member.roles.add(['813870575453077504', '813847814412042280'], `${interaction.user.tag} added them to Harmony!`);   
            } catch {
                return {content: `The role(s) doesn't exist in this guild.`, ephemeral: true};
            };


            const embed = await updateMembers(interaction.guild, 'harmony');
            await msg.edit({embeds: [embed]});
    
            return {content: `Successfully added ${member.user.tag} to Harmony!`, ephemeral: true};
        };
    }
};