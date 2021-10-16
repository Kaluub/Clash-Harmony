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

    // Chaining methods:

    setBlocked(boolean = true){
        this.blocked = boolean;
        return this;
    };

    addPoints(points = 0){
        this.points += points;
        return this;
    };

    setPoints(points = 0){
        this.points = points;
        return this;
    };

    addReward(reward){
        this.unlocked[reward.type].push(reward.id);
        return this;
    };

    removeReward(reward){
        this.unlocked[reward.type] = this.unlocked[reward.type].filter(r => r != reward.id);
        return this;
    };

    addStatistic(statistic, amount = 1){
        this.statistics[statistic] += amount;
        return this;
    };

    setStatistic(statistic, amount = 0){
        this.statistics[statistic] = amount;
        return this;
    };

    setMonthlyCooldown(time = 0){
        this.monthlyCooldown = time;
        return this;
    };

    setStatus(status = ''){
        this.status = status;
        return this;
    };

    setCardBackground(id = 'default_background'){
        this.card.background = id;
        return this;
    };

    setCardFrame(id = 'default_frame'){
        this.card.frame = id;
        return this;
    };

    setDuelBackground(id = 'default_background'){
        this.duels.background = id;
        return this;
    };

    // Booleans:

    isBlocked(){
        if(this.blocked) return true;
        else return false;
    };

    hasReward(reward){
        if(this.unlocked[reward.type].includes(reward.id)) return true;
        else return false;
    };

    // Utility statics:

    static isLocked(id){
        if(lockedIds.includes(id)) return true;
        else return false;
    };

    static async get(guildID, userID){
        const data = await userdb.get(`${guildID}/${userID}`);
        return new Data(data);
    };

    static async set(guildID, userID, data){
        await userdb.set(`${guildID}/${userID}`, data);
        return new Data(data);
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