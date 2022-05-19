const { Client, Intents } = require('discord.js');
const StatusLogger = require('./classes/statusLogger.js');
const { readJSON } = require('./json.js');
const { token } = readJSON('config.json');
const { readdirSync } = require('fs');

const interactions = [];
const channelCommandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
const contextInteractionFiles = readdirSync('./contexts').filter(file => file.endsWith('.js'));

for (const file of channelCommandFiles) {
    const command = require(`./commands/${file}`);
    if(command.hidden || command.archived || command.noInteraction) continue;
    interactions.push({
        name: command.name,
        description: command.desc,
        options: command.options ? command.options : undefined
    });
};

for (const file of contextInteractionFiles) {
    const command = require(`./contexts/${file}`);
    if(command.hidden) continue;
    interactions.push({
        type: command.type,
        name: command.name
    });
};

const client = new Client({intents:Intents.FLAGS.GUILDS});
client.login(token);

client.on('ready', async () => {
    if(!client.application?.owner) await client.application.fetch();
    console.log(interactions);
    await client.application.commands.set(interactions).catch(err => console.error(err));
    StatusLogger.logStatus({type: "update-interactions", detail: "All interactions were updated"});
    console.log('Done!');
    client.destroy();
    process.exit(0);
});