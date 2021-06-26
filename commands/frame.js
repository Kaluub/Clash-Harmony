const Keyv = require('keyv');
const {readJSON} = require('../json.js');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

module.exports = {
    name:'frame',
    aliases:['fr'],
    admin:false,
    hidden:true,
    desc:`This is a command for customizing your profile card's frame.`,
    usage:'!frame [owned frame]',
    async execute({interaction,message,args}){
        if(!args[0]) return `Usage: ${this.usage}`;
        const guild = interaction?.guild ?? message?.guild;
        const member = interaction?.member ?? message?.member;
        let name = args.join(' ');
        let userdata = await userdb.get(`${guild.id}/${member.user.id}`);
        let rewards = await readJSON('json/rewards.json');
        let frame = null;
        for(const i in rewards.rewards.frames){
            let f = rewards.rewards.frames[i];
            if(f.name.toLowerCase() == name.toLowerCase()){
                frame = f;
                break;
            };
        };
        if(!frame) return 'There are no frames with this name.';
        if(!userdata.unlocked.frames.includes(frame.id)) return `You don't own this frame. See \`!list frames\` for a list of owned frames.`;
        userdata.card.frame = frame.id;
        await userdb.set(`${guild.id}/${member.user.id}`,userdata);
        return `Successfully set your active frame to ${frame.name}.`;
    }
};