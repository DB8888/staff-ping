const Discord = require('discord.js')


module.exports = {
    name: 'Ghost Ping Detector',
    run: client => {
        client.on('messageDelete', message => {
            if(message.mentions.users.size > 0 || message.mentions.roles.size > 0) {
                const embed = new Discord.MessageEmbed()
                    .setTitle('Ghost ping detected')
                    .setDescription(message.content)
                    .addField('Author', message.author)
                    .setColor('#FF0000')
                message.channel.send(embed)
            }
        })
    }
}