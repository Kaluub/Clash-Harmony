module.exports = {
    name:'exit',
    usage:'exit',
    async execute({readline}){
        readline.close()
    }
};