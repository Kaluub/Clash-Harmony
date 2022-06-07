const { UserData } = require('../../classes/data.js');

module.exports = {
    name: 'block',
    execute: async ({interaction}) => {
        const user = interaction.options.getUser('member');
        const userdata = await UserData.get(interaction.guild.id, user.id);
        userdata.setBlocked(!userdata.blocked);
        await UserData.set(interaction.guild.id, user.id, userdata);
        return {content: `${user.tag} was ${userdata.blocked ? "blocked" : "unblocked"}.`, ephemeral: true};
    }
};