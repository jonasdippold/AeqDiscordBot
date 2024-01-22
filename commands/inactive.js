require('dotenv').config();

const { fetchPlaytimeData, fetchMembersWithRole } = require('../utils/dataUtils');

module.exports = {
    name: 'inactive',
    description: 'Gives a list of players who have playtimes below 2 hours',
    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;

        try {
            const membersWithInactiveRole = await fetchMembersWithRole(guild, "Inactive");

            const { calculatedData, timeRange } = await fetchPlaytimeData();
            console.log('Calculated Data:', calculatedData); 

            const playersBelowTwoHours = calculatedData
                .filter(player => {
                    const playtime = parseFloat(player.playtimeChange);
                    return !isNaN(playtime) && playtime < 2.0;
                })
                .sort((a, b) => parseFloat(b.playtimeChange) - parseFloat(a.playtimeChange)); 

            console.log('Players Below Two Hours:', playersBelowTwoHours); 

            let warningMessage = '';
            playersBelowTwoHours.forEach(player => {
                const member = guild.members.cache.find(m => 
                    (m.nickname === player.username || m.user.username === player.username) && 
                    m.roles.cache.has(process.env.GUILD_MEMBER));

                if (member) {
                    warningMessage += `<@${member.id}> (${player.playtimeChange} hours) `;
                } else {
                    console.log(`Member ${player.username} does not have the required role or does not exist.`); 
                }
            });

            if (warningMessage) {
                warningMessage += 'you have been warned because **you haven\'t logged onto Wynncraft/hit the required playtime of 2 hours** during the last week without notice.\nIf you would like to stay in the guild please hit the required playtime in the next 48 hours or give us your reasoning in <#925856455658188860> or, if you prefer, DM one of the chiefs otherwise we will kick you.';
                await interaction.editReply(warningMessage);
            } else {
                await interaction.editReply({ content: 'No players below 2 hours playtime.' });
            }
        } catch (error) {
            console.error('Error handling playtime command:', error);
            await interaction.editReply({ content: 'Error occurred while processing the command.' });
        }
    },
};
