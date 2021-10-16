const { Client, Intents } = require('discord.js');
const { readJSON } = require('./json.js');
const { token } = readJSON('config.json');
const { readdirSync } = require('fs');

const interactions = [];
const channelCommandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
const contextInteractionFiles = readdirSync('./contexts').filter(file => file.endsWith('.js'));

for (const file of channelCommandFiles) {
    const command = require(`./commands/${file}`);
    if(command.hidden || !command.options) continue;
    interactions.push({
        name: command.name,
        description: command.desc,
        options: command.options ? command.options : []
    });
};

for (const file of contextInteractionFiles) {
    const command = require(`./contexts/${file}`);
    if(command.hidden) continue;
    interactions.push({
        type: "USER",
        name: command.name
    });
};

const client = new Client({intents:Intents.FLAGS.GUILDS});
client.login(token);

client.on('ready', async () => {
    if(!client.application?.owner) await client.application.fetch();
    console.log(interactions);
    await client.application.commands.set(interactions).catch(err => console.error(err));
    const commands =
    console.log('Done!');
    client.destroy();
    process.exit(0);
});