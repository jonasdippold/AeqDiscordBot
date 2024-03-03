const fs = require('fs');
const path = require('path');
const blacklistFilePath = path.join(__dirname, 'blacklist.json');
const { AttachmentBuilder } = require('discord.js'); 

function readBlacklist() {
    try {
        const data = fs.readFileSync(blacklistFilePath, 'utf8');
        // Convert all entries to lowercase for case-insensitive comparison
        return JSON.parse(data).map(name => name.toLowerCase());
    } catch (error) {
        console.error(`Error reading from blacklist file at ${blacklistFilePath}:`, error);
        try {
            writeBlacklist([]);
            console.log(`Initialized empty blacklist file at ${blacklistFilePath}.`);
            return [];
        } catch (initError) {
            console.error(`Error initializing blacklist file at ${blacklistFilePath}:`, initError);
            throw initError;
        }
    }
}

function writeBlacklist(data) {
    try {
        // Save data as is, assuming data is already processed to be lowercase
        fs.writeFileSync(blacklistFilePath, JSON.stringify(data, null, 4), 'utf8');
        console.log(`Blacklist updated successfully.`);
    } catch (error) {
        console.error(`Error writing to blacklist file at ${blacklistFilePath}:`, error);
        throw error;
    }
}

module.exports = {
    name: 'blacklist',
    description: 'Checks or adds players to the guild blacklist',
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const action = interaction.options.getString('action').toLowerCase(); // Ensure action is lowercase
            const blacklist = readBlacklist();
            if (['check', 'add', 'remove'].includes(action)) {
                username = interaction.options.getString('username').toLowerCase(); // Ensure we have username for these actions
            }
            
            if (action === 'check') {
                if (blacklist.includes(username)) {
                    await interaction.followUp(`${username} is on the blacklist.`);
                } else {
                    await interaction.followUp(`${username} is not on the blacklist.`);
                }
            } else if (action === 'add') {
                if (blacklist.includes(username)) {
                    await interaction.followUp(`${username} is already on the blacklist.`);
                } else {
                    blacklist.push(username); // Username is already in lowercase
                    writeBlacklist(blacklist);
                    await interaction.followUp(`${username} has been added to the blacklist.`);
                }
            } else if (action === 'remove') {
                const index = blacklist.indexOf(username);
                if (index > -1) {
                    blacklist.splice(index, 1);
                    writeBlacklist(blacklist);
                    await interaction.followUp(`${username} has been removed from the blacklist.`);
                } else {
                    await interaction.followUp(`${username} is not on the blacklist.`);
                }
            } else if (action === 'list') {
                // Logic to send the blacklist as a text file
                const blacklistPath = path.join(__dirname, 'blacklist.json');
                const data = fs.readFileSync(blacklistPath, 'utf8');
                const attachment = new AttachmentBuilder(Buffer.from(data, 'utf-8'), { name: 'blacklist.txt' });

                await interaction.followUp({ content: 'Here is the current blacklist:', files: [attachment] });
            }
        } catch (error) {
            console.error('Failed to process blacklist command:', error);
            await interaction.followUp('There was an error while processing your request. Please try again later.');
        }
    }
};