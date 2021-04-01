class Data {
    constructor(type, data){
        if(type = 'user'){
            this.version = '1';
            this.blocked = data.blocked || false;
            this.points = data.points || 0;
            this.status = data.status || '';
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

    static updateData(data){
        // Fix breaking changes in future versions.
        return data;
    };
};

module.exports = Data;