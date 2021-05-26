const {Client, Intents} = require('discord.js');
const {readJSON} = require('./json.js');
const {token} = readJSON('config.json');
const interactions = readJSON('interactions.json');

const client = new Client({intents:Intents.FLAGS.GUILDS});

client.on('ready', async () => {
    if(!client.application?.owner) await client.application.fetch();
    await client.application?.commands.set(interactions).then(col => console.log(col)).catch(err => console.error(err));
    console.log("\x1b[34m%s\x1b[0m",`Updated all interactions.`);
    client.destroy();
    process.exit(0);
});

client.login(token);