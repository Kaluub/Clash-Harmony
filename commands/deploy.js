module.exports = {
    name: 'deploy',
    hidden: true,
    admin: true,
    desc: `Used to force a command to update.`,
    usage: '!deploy [clean/add {name}]',
    execute: async ({ message, args }) => {
        if(!message) return 'What kind of trick are you playing on me..?';
        if(args[0] == 'clean') {
            await message.guild.commands.set([]);
            return 'Cleaned all the guild commands!';
        };
        if(args[0] == 'add') {
            if(!args[1]) return `Usage: ${module.exports.usage}`;
            const command = require(`./${args[1]}.js`);
            if(!command) return `Usage: ${module.exports.usage}`;
            await message.guild.commands.create({
                name: command.name,
                description: command.desc,
                options: command.options ? command.options : undefined
            });
            return `Added ${args[1]}.js to the guild commands!`;
        };
        return `Usage: ${module.exports.usage}`;
    }
}