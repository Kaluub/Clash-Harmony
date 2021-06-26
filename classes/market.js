class Market {
    constructor(Market){
        this.items = Market.items ?? [];
        this.itemLifespan = Market.itemLifespan ?? 72;
    };
};

module.exports = Market;