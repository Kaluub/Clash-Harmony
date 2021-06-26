class MarketItem {
    constructor(MarketItem){
        this.id = MarketItem.id;
        this.item = MarketItem.item;
        this.category = MarketItem.category ?? 'backgrounds';
        this.price = MarketItem.price ?? 1;
        this.timestamp = MarketItem.timestamp ?? Date.now();
    };
};

module.exports = MarketItem;