require('dotenv').config();

module.exports = {
    name: 'log',
    description: 'Logs the application in the ticket the command is run in',
    async execute(interaction) {
        const channel = interaction.channel;
        await interaction.deferReply();

        try {
            const messages = await channel.messages.fetch({ limit: 100 });

            const ticketBotMessage = messages.find(msg => msg.author.id === process.env.TICKET_BOT_ID && msg.mentions.users.size > 0);
            if (!ticketBotMessage) {
                await interaction.editReply('No recent message from TicketBot mentioning a user was found.');
                return;
            }

            const mentionedUser = ticketBotMessage.mentions.users.first();
            if (!mentionedUser) {
                await interaction.editReply('TicketBot message does not contain a user mention.');
                return;
            }

            const userMessages = messages.filter(msg => msg.author.id === mentionedUser.id);

            if (userMessages.size === 0) {
                await interaction.editReply(`No messages found from the mentioned user: ${mentionedUser.tag}`);
                return;
            }

            const formattedLogMessages = userMessages.map(msg => `${msg.content}`).join('\n');
            const logChannel = await interaction.client.channels.fetch(process.env.LOG_CHANNEL_ID);

            if (logChannel) {
                await logChannel.send(`\`\`\`${formattedLogMessages}\`\`\``);
                await interaction.editReply('Your application is being reviewed!');
            } else {
                await interaction.editReply('Log channel not found.');
            }
        } catch (error) {
            console.error('Error handling log command:', error);
            await interaction.editReply({ content: 'An error occurred while processing the command.', ephemeral: true });
        }
    },
};
