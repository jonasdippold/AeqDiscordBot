const { getOnlinePlayers, getPlayerInfo } = require('../utils/apirequests');

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'findplayers',
    description: 'Finds new players that we can recruit',
    async execute(interaction) {
        const world = parseInt(interaction.options.getString('world'));
        let server = world; // Replace with the server ID passed through the interaction, if applicable
        console.log(`-------- Server ${server} --------`)
        let promises = [];
        let onlinePlayers = await getOnlinePlayers(server);

        Object.keys(onlinePlayers.players).forEach((player) => {
            promises.push(getPlayerInfo(player));
        });

        let playersDetailed = await Promise.all(promises);

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
                        .map(classData => {
                            return classData.level
                                ? classData.level
                                : 0;
                        })
                );
            }

            if (player.guild === null && highestLevel >= 75) {
                let message = `/msg ${player.username} Hello, how is it going? Are you maybe looking for a guild?`;

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Recruitment Message')
                    .setDescription(message)
                    .setFooter({ text: `Player: ${player.username}` });

                interaction.channel.send({ embeds: [embed] });
            }
        }
    }
};
