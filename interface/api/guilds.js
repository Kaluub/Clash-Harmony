module.exports = {
    name:'guilds',
    async run({client, res}){
        const guilds = [];
        await client.guilds.cache.forEach(guild => {
            guilds.push({name: guild.name, id: guild.id, members: guild.memberCount});
        });
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({guildCount: guilds.length, guilds: guilds}, null, 4));
    }
};