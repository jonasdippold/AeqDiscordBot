require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Events, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(__dirname, 'commands', file);
    const command = require(filePath);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('inactive')
            .setDescription('Gives a list of players who have playtimes below 2 hours'),
        new SlashCommandBuilder()
            .setName('war') 
            .setDescription('Checks how many wars a player did in the last week')
            .addStringOption(option => option.setName('username').setDescription('Enter the player\'s username').setRequired(true)),
        new SlashCommandBuilder()
            .setName('totalwars')
            .setDescription('Displays the total wars done by the guild members in the last week'),
        new SlashCommandBuilder()
            .setName('acceptmember')
            .setDescription('Select the user to accept into the guild and it will give them roles')
            .addUserOption(option => option.setName('user').setDescription('Select the user who you want to accept').setRequired(true)),
        new SlashCommandBuilder()
            .setName('log')
            .setDescription('Logs the application in the ticket the command is run in'),
        new SlashCommandBuilder()
            .setName('playerstats')
            .setDescription('Get data about a specific player')
            .addStringOption(option => option.setName('username').setDescription('Enter the player\'s username').setRequired(true)),
        new SlashCommandBuilder()
            .setName('playtime')
            .setDescription('Get the playtime of a specific player')
            .addStringOption(option => option.setName('username').setDescription('Enter the player\'s username').setRequired(true)),
        new SlashCommandBuilder()
            .setName('guild')
            .setDescription('Get data about a specific guild')
            .addStringOption(option => option.setName('guildname').setDescription('Enter the guild\'s name').setRequired(true)),
    ];

    commands.forEach(command => {
        client.application.commands.create(command, process.env.GUILD_ID);
    });
});

client.on(Events.MessageCreate, async message => {
    console.log("Message received:", message.content);
    if (message.author.bot) return;
    if ((message.content.toLowerCase().includes('lalatera') || message.content.toLowerCase().includes('<:lala:1009089270604107857>')) && !message.author.bot) {
        await message.channel.send('Happy Birthday Lalatera!');
    }
});

const allowedRoleIds = [process.env.ROLE_ID1, process.env.ROLE_ID2];
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const memberRoles = interaction.member.roles.cache;
    const hasPermission = allowedRoleIds.some(roleId => memberRoles.has(roleId));

    if (!hasPermission) {
        await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
