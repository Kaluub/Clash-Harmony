const version = '2'
class Data {
    constructor(type, data){
        if(type = 'user'){
            this.version = version;
            this.blocked = data.blocked || false;
            this.points = data.points || 0;
            this.status = data.status || '';
            this.monthlyCooldown = data.monthlyCooldown || Date.now();
            this.statistics = data.statistics || {
                spent:0,
                earned:0,
                commandsUsed:0,
                age:Date.now()
            };
            this.unlocked = data.unlocked || {
                backgrounds:['default_background'],
                frames:['default_frame']
            };
            this.card = data.card || {
                background:'default_background',
                frame:'default_frame'
            };
        };
    };

    static version = version;

    static async updateData(data){
        if(!data || !data.version){
            data = new Data('user',{});
        };
        if(data.version == '1'){
            data.version = '2';
            data.monthlyCooldown = Date.now();
        };
        return data;
    };
};

module.exports = Data;