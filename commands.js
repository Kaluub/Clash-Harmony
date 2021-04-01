const {readdirSync} = require('fs');
const {Collection} = require('discord.js');

const commands = new Collection();
const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    commands.set(command.name,command);
};

const consoleCommands = new Collection();
const consoleCommandFiles = readdirSync('./console').filter(file => file.endsWith('.js'));
for(const file of consoleCommandFiles){
    const command = require(`./console/${file}`);
    consoleCommands.set(command.name,command);
};

module.exports = {
    commands:commands,
    consoleCommands:consoleCommands
};
