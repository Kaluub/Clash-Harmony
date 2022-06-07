const { UserData } = require('../classes/data.js');
const json = require('../json.js');

module.exports = {
    name: 'db',
    usage:'db [export/import] [id] (file)',
    async execute({args}) {
        if(!args[0] || !args[1]) return console.log("\x1b[32m%s\x1b[0m",`Usage: ${this.usage}`);
        const ids = args[1].split('/');
        if(args[0] == "export") {
            const data = await UserData.get(ids[0], ids[1]);
            const file = args[2] ?? 'data';
            json.writeJSON(`./data/${file}.json`, data);
            return console.log("\x1b[32m%s\x1b[0m", `Data exported succesfully!`);
        };
        if(args[0] == "import") {
            const file = args[2] ?? 'data';
            const data = json.readJSON(`./data/${file}.json`);
            await UserData.set(ids[0], ids[1], new UserData(data));
            return console.log("\x1b[32m%s\x1b[0m", `Data imported succesfully!`);
        };
    }
};