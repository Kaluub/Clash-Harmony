const Keyv = require('keyv');
const userdb = new Keyv('sqlite://data/users.sqlite', {namespace:'users'});

let lockedIds = [];

class Data {
    constructor(data){
        this.blocked = data?.blocked ?? false;
        this.points = data?.points ?? 0;
        this.status = data?.status ?? '';
        this.monthlyCooldown = data?.monthlyCooldown ?? Date.now();
        this.statistics = {
            spent: data?.statistics?.spent ?? 0,
            earned: data?.statistics?.earned ?? 0,
            commandsUsed: data?.statistics?.commandsUsed ?? 0,
            age: data?.statistics?.age ?? Date.now(),
            duelsWon: data?.statistics?.duelsWon ?? 0,
            duelsLost: data?.statistics?.duelsLost ?? 0,
            tradesCompleted: data?.statistics?.tradesCompleted ?? 0
        };
        this.unlocked = {
            backgrounds: data?.unlocked?.backgrounds ?? ['default_background'],
            frames: data?.unlocked?.frames ?? ['default_frame'],
            roles: data?.unlocked?.roles ?? [],
            features: data?.unlocked?.features ?? []
        };
        this.card = {
            background: data?.card?.background ?? 'default_background',
            frame: data?.card?.frame ?? 'default_frame'
        };
        this.duels = {
            background: data?.duels?.backgrounds ?? 'default_background'
        };
    };

    static async get(guildID, userID){
        if(lockedIds.includes(userID)) return false;
        const data = await userdb.get(`${guildID}/${userID}`);
        return new Data(data);
    };

    static async forceGet(guildID, userID){
        const data = await userdb.get(`${guildID}/${userID}`);
        return new Data(data);
    };

    static async set(guildID, userID, data){
        if(!(data instanceof Data)) return false;
        if(lockedIds.includes(userID)) return false;
        await userdb.set(`${guildID}/${userID}`, data);
        return true;
    };

    static async forceSet(guildID, userID, data){
        if(!(data instanceof Data)) return false;
        await userdb.set(`${guildID}/${userID}`, data);
        return true;
    };

    static lockIds(ids){
        lockedIds.push(...ids);
        return true;
    };

    static unlockIds(ids){
        lockedIds = lockedIds.filter(id => !ids.includes(id));
        return true;
    };
};

module.exports = Data;