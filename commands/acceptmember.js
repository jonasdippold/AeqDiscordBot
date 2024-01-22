require('dotenv').config();

module.exports = {
    name: 'acceptmember',
    description: 'Select the user to accept into the guild and it will give them roles',
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);

        const rolesToAddIds = process.env.ROLES_TO_ADD.split(',');

        try {
            const rolesToAdd = [];
            const missingRoles = [];

            rolesToAddIds.forEach(roleId => {
                const role = interaction.guild.roles.cache.get(roleId.trim());
                if (role) {
                    rolesToAdd.push(role);
                } else {
                    missingRoles.push(roleId);
                }
            });

            if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
                let replyMessage = `${user.username} has been given the new roles.`;
                if (missingRoles.length > 0) {
                    replyMessage += ` However, the following role IDs did not correspond to existing roles: ${missingRoles.join(', ')}.`;
                }
                await interaction.reply({ content: replyMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: 'No roles were found to add.', ephemeral: true });
            }
        } catch (error) {
            console.error('Error handling acceptmember command:', error);
            await interaction.reply({ content: 'An error occurred while modifying roles.', ephemeral: true });
        }
    },
};