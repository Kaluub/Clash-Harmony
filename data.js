class Data {
    constructor(type, data){
        if(type = 'user'){
            this.version = Data.version;
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
                frames:['default_frame'],
                features:[]
            };
            this.card = data.card || {
                background:'default_background',
                frame:'default_frame'
            };
        };
    };

    static version = '3';

    static async updateData(data){
        if(!data || !data.version){
            data = new Data('user',{});
        };
        if(data.version == '1'){ // Data version 2 migration
            data.version = '2';
            data.monthlyCooldown = Date.now();
        };
        if(data.version == '2'){ // Data version 3 migration
            data.version = '3';
            data.unlocked.features = [];
        };
        return data;
    };
};

module.exports = Data;