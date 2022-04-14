const {updateMembers} = require('../functions.js');
const {readJSON} = require('../json.js');

module.exports = {
    name: 'Toggle Clash',
    type: 'USER',
    admin: true,
    execute: async ({interaction}) => {
        const config = await readJSON('config.json');
        const channel = await interaction.guild.client.channels.fetch(config['clashMembersMessageChannel']);
        const msg = await channel.messages.fetch(config['clashMembersMessage']);
        const member = interaction.options.getMember('user');

        if(!member) {
            const embed = await updateMembers(interaction.guild, 'clash');
            await msg.edit({embeds: [embed]});
            return {content: `This member has left the server, so the member list was updated to reflect that.`, ephemeral: true};
        };
        if(!member.manageable) return {content: `Role hierarchy denies your operation.`, ephemeral: true};

        if(member.roles.cache.hasAny('636987578125647923', '644846211429433344')) {
            try {
                await member.roles.remove(['636987578125647923', '644846211429433344', '644620616669986817', '644620634575601714', '636987868874670100'], `${interaction.user.tag} removed them from Clash!`);
            } catch {
                return {content: `The role(s) doesn't exist in this guild.`, ephemeral: true};
            };
            
            const embed = await updateMembers(interaction.guild, 'clash');
            await msg.edit({embeds: [embed]});

            return {content: `Successfully removed ${member.user.tag} from Clash!`, ephemeral: true};
        } else {
            try {
                await member.roles.add(['636987578125647923', '644846211429433344'], `${interaction.user.tag} added them to Clash!`);  
            } catch {
                return {content: `The role(s) doesn't exist in this guild.`, ephemeral: true};
            };

            const embed = await updateMembers(interaction.guild, 'clash');
            await msg.edit({embeds: [embed]});
    
            return {content: `Successfully added ${member.user.tag} to Clash!`, ephemeral: true};
        };
    }
};