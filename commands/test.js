module.exports = {
    name: 'test',
    desc: `Get your daily rewards here.`,
    usage: '/daily',
    hidden: true,
    admin: true,
    execute: async () => {
        let dailyRNGMeter = 0;
            
        for (var i = 0; i <= 130; i++) {
            dailyRNGMeter += 0.00005 + 0.035 * dailyRNGMeter;
            console.log(`${i}: ${dailyRNGMeter} (+${dailyRNGMeter*100}%)`);
        };
    }
};