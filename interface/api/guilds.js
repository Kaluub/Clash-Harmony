module.exports = {
    name:'guilds',
    async run({client, res}){
        let guilds = [];
        await client.guilds.cache.forEach(guild => {
            guilds.push({name:guild.name, id:guild.id})
        });
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({count: guilds.length, guilds: guilds}, null, 4));
    }
};