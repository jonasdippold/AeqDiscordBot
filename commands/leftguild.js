const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

module.exports = {
    name: 'leftguild',
    description: 'List of players who left the guild',
    async execute(interaction) {
        await interaction.deferReply();
        const guild = interaction.guild;

        try {
            // fetch Wynncraft guild members
            const wynncraftResponse = await fetch('https://api.wynncraft.com/v3/guild/Aequitas');
            if (!wynncraftResponse.ok) {
                throw new Error('Failed to fetch Wynncraft guild members');
            }
            const wynncraftData = await wynncraftResponse.json();

            let wynncraftMembers = [];
            
            if (!wynncraftData.members) {
                throw new Error('No members data in Wynncraft response');
            }

            function extractMembers(category) {
                if (Array.isArray(category)) {
                    for (const member of category) {
                        wynncraftMembers.push(member.name.toLowerCase());
                    }
                } else {
                    for (const memberName in category) {
                        if (category.hasOwnProperty(memberName)) {
                            wynncraftMembers.push(memberName.toLowerCase());
                        }
                    }
                }
            }
            
            for (const category in wynncraftData.members) {
                if (wynncraftData.members.hasOwnProperty(category)) {
                    extractMembers(wynncraftData.members[category]);
                }
            }
            
            // fetch Discord members with the specific role
            const discordRoleID = process.env.GUILD_MEMBER; 
            await guild.members.fetch();
            let discordMembers = guild.members.cache.filter(member => member.roles.cache.has(discordRoleID));
            let message = '';
            
            let removedIDs = process.env.IGNORE_IDS.split(',');

            // compare the lists and find members who have left
            discordMembers.forEach(member => {
                if (!wynncraftMembers.includes(member.displayName.toLowerCase()) && (!removedIDs.includes(member.id))) {
                    message += `<@${member.id}> `;
                }
            });

            // check if message is empty
            if (message === '') {
                message = 'No players found';
            }
            await interaction.editReply(message);

        } catch (error) {
            console.error('Error in leftguild command:', error);
            await interaction.editReply({ content: 'An error occurred while processing the command.' });
        }
    },
};
