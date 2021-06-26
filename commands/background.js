const Keyv = require('keyv');
const {readJSON} = require('../json.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'background',
    aliases:['bg','backg'],
    hidden:true,
    desc:`This is a command for customizing your profile card's background.`,
    usage:'!background [owned background]',
    async execute({interaction,message,args}){
        if(!args[0]) return `Usage: ${this.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let name = args.join(' ');
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let rewards = await readJSON('json/rewards.json');
        let background = null;
        for(const i in rewards.rewards.backgrounds){
            let b = rewards.rewards.backgrounds[i];
            if(b.name.toLowerCase() == name.toLowerCase()){
                background = b;
                break;
            };
        };
        if(!background) return 'There are no backgrounds with this name.';
        if(!userdata.unlocked.backgrounds.includes(background.id)) return `You don't own this background. See \`!list backgrounds\` for a list of owned backgrounds.`;
        userdata.card.background = background.id;
        await userdb.set(`${guild.id}/${member.user.id}`,userdata);
        return `Successfully set your active background to ${background.name}.`;
    }
};