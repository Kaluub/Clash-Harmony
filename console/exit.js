module.exports = {
    name:'exit',
    usage:'exit',
    async execute(client,args,ex){
        ex.readline.close()
    }
};