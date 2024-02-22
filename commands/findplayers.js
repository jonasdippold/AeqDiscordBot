const { getOnlinePlayers, getPlayerInfo } = require('../utils/apirequests');

module.exports = {
    name: 'findplayers',
    description: 'Finds new players that we can recruit',
    async execute(interaction) {
        const world = parseInt(interaction.options.getString('world'));
        await interaction.deferReply();
        let server = world;
        console.log(`-------- Server ${server} --------`);
        let promises = [];
        let onlinePlayers = await getOnlinePlayers(server);

        Object.keys(onlinePlayers.players).forEach((player) => {
            promises.push(getPlayerInfo(player));
        });

        let playersDetailed = await Promise.all(promises);

        let recruitmentMessages = '';
        for (let i = 0; i < playersDetailed.length; i++) {
            let player = playersDetailed[i];

            if (!player) {
                continue;
            }

            let highestLevel = 0;
            if (player.hasOwnProperty("characters") && player.characters != null) {
                highestLevel = Math.max.apply(
                    Math,
                    Object.values(player.characters)
                        .map(classData => classData.level ? classData.level : 0)
                );
            }

            if (player.guild === null && highestLevel >= 75) {
                let message = `/msg ${player.username} Hello, how is it going? Are you maybe looking for a guild?`;
                recruitmentMessages += `\`\`\`${message}\`\`\`\n`;
            }
        }

        if (recruitmentMessages) {
            await interaction.editReply(recruitmentMessages);
        } else {
            await interaction.editReply('No suitable players found for recruitment.');
        }
    }
};
