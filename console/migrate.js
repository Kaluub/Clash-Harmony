const { UserData } = require('../classes/data.js');
const { writeJSON } = require('../json.js');

module.exports = {
    name: 'migrate',
    usage: 'migrate [guild ID]',
    async execute({client, line}){
        let args = line.split(' ');
        if(!args[1]) return console.log(module.exports.usage);
        const guild = await client.guilds.fetch(args[1]);
        if(!guild) return console.log('No guild!');
        const members = await guild.members.fetch();
        const dataArray = [];
        for (const [id, member] of members) {
            const data = await UserData.get(guild.id, member.id);
            await UserData.set(guild.id, member.id, data)
            dataArray.push(data);
        };
        console.log(`Migrated ${dataArray.length} users.`);
        writeJSON('data/bin.json', dataArray);
    }
};