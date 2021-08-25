const {MessageEmbed} = require("discord.js");

module.exports = {
    name:'embed',
    desc:'A command used to generate and send embed messages.',
    usage:'/embed [values]',
    admin:true,
    execute: async ({interaction}) => {
        if(!interaction) return `This command can only be used as a slash command.`;
        const embed = new MessageEmbed();
        for(const [name, option] of interaction.options){
            try {
                if(option.name == 'title') embed.setTitle(option.value);
                if(option.name == 'description') embed.setDescription(option.value);
                if(option.name == 'color') embed.setColor(option.value);
                if(option.name == 'image') embed.setImage(option.value);
                if(option.name == 'url') embed.setURL(option.value);
                if(option.name == 'author') embed.setAuthor(JSON.parse(option.value)?.text, JSON.parse(option.value)?.iconURL, JSON.parse(option.value)?.url);
                if(option.name == 'footer') embed.setFooter(JSON.parse(option.value)?.text, JSON.parse(option.value)?.iconURL);
                if(option.name == 'fields') embed.addFields(JSON.parse(option.value));
                if(option.name == 'timestamp') embed.setTimestamp(parseInt(option.value) == 0 ? Date.now() : parseInt(option.value));
            } catch(err) {
                return {content: `The option '${option.name}' has some error.\n\nExact error:\n\`\`\`${err}\`\`\``, ephemeral: true};
            };
        };
        try {
            await interaction.channel.send({embeds:[embed]});
        } catch {
            return {content: `There was an error with your embed.`, ephemeral: true};
        };
        return {content: `Successfully made an embed using your parameters.`, ephemeral: true};
    }
};