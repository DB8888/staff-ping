const mcUtil = require('minecraft-server-util')
const handler = require('../module-handler')

const httpsRequest = require('../utils/https-post-request')
const getRequest = require('../utils/https-get-request')
module.exports = {
    name: 'Staff Checker',
    run: async (client) => {
        handler.log(module.exports, `Running startup tasks`);

        //get data so that we can pick up where we left off
        const lastStaffMessage = await client.channels.cache.get(client.config.updatesChannel).messages.fetch(client.config.lastStaffSeenMessage);
        var lastStaffSeen = new Date(lastStaffMessage.content.split('\n')[1]).getTime()
        handler.log(module.exports, `Startup tasks complete`)

        setInterval(async () => {
            handler.log(module.exports, 'Checking server status')
            //get server status
            const server = await mcUtil.status(client.config.server);
            let onlineIds = server.samplePlayers.map(p => p.id);

            //see if any staff are online
            let staffFound = false;
            for (const staffMember of client.config.staff) {
                if (onlineIds.includes(staffMember)) {
                    staffFound = staffMember;
                }
            }
            if (staffFound) {
                if (parseInt(lastStaffSeen + client.config.pingWhenNoStaffFor) < Date.now()) {
                    const apiResponse = await getRequest(`https://sessionserver.mojang.com/session/minecraft/profile/${staffFound}`);
                    const staffMemberName = apiResponse.name;
                    handler.log(module.exports, `Sending ping...`);
                    client.channels.cache.get(client.config.updatesChannel).send(`<@&${client.config.pingRole}> A staff member (${staffMemberName}) has joined after a deadzone of ${Math.floor((Date.now() - lastStaffSeen) / 1000 / 60)} minutes!`)

                    //send data to google sheet
                    let data = {
                        type: 'deadzoneReport',
                        start: lastStaffSeen,
                        end: new Date().getTime(),
                        endedBy: staffMemberName
                    }
                    httpsRequest('script.google.com', process.env.APPS_SCRIPT_PATH, data)
                }
                lastStaffSeen = Date.now();
                lastStaffMessage.edit(`Last staff member seen at:\n${new Date()}`);
            }
        }, client.config.statusUpdateInterval)

    }
}
