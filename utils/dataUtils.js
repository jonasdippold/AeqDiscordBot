async function fetchMembersWithRole(guild, roleName) {
    await guild.members.fetch(); 
    const membersWithRole = guild.members.cache.filter(member =>
        member.roles.cache.find(role => role.name === roleName)
    );
    return membersWithRole;
}

async function fetchPlayerData() {
    try {
        console.log('Fetching player data...');
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch('http://localhost:3001/api');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const apiData = await response.json();
        console.log(`Data fetched. Number of records: ${apiData.length}`);

        const newestEntryDate = new Date(Math.max(...apiData.map(e => new Date(e.insertion_timestamp))));
        let oneWeekAgo = new Date(newestEntryDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let overallOldestEntryDate = oneWeekAgo;

        const groupedData = apiData.reduce((acc, item) => {
            acc[item.username] = acc[item.username] || [];
            acc[item.username].push(item);
            return acc;
        }, {});

        let calculatedData = [];

        for (const username in groupedData) {
            const playerEntries = groupedData[username].sort((a, b) => new Date(a.insertion_timestamp) - new Date(b.insertion_timestamp));
            
            let closestEntryToWeekAgo = playerEntries.reduce((prev, curr) => {
                return (Math.abs(new Date(curr.insertion_timestamp) - oneWeekAgo) < Math.abs(new Date(prev.insertion_timestamp) - oneWeekAgo)) ? curr : prev;
            });

            const warChange = playerEntries[playerEntries.length - 1].wars - closestEntryToWeekAgo.wars;

            calculatedData.push({ username, warChange });
        }

        console.log(`Processed data for ${calculatedData.length} players.`);
        return { 
            calculatedData, 
            timeRange: `From ${overallOldestEntryDate.toISOString().split('T')[0]} to ${newestEntryDate.toISOString().split('T')[0]}`
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { calculatedData: [], timeRange: '' };
    }
}

async function fetchPlaytimeData() {
    try {
        console.log('Fetching player data...');
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const response = await fetch('http://localhost:3001/api');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const apiData = await response.json();
        console.log(`Data fetched. Number of records: ${apiData.length}`);

        const newestEntryDate = new Date(Math.max(...apiData.map(e => new Date(e.insertion_timestamp))));
        let oneWeekAgo = new Date(newestEntryDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let overallOldestEntryDate = oneWeekAgo;

        const groupedData = apiData.reduce((acc, item) => {
            acc[item.username] = acc[item.username] || [];
            acc[item.username].push(item);
            return acc;
        }, {});

        let candidates = [];

        for (const username in groupedData) {
            const playerEntries = groupedData[username].sort((a, b) => new Date(a.insertion_timestamp) - new Date(b.insertion_timestamp));
            
            // Check if the player's join date is less than 7 days ago
            const joinDate = new Date(playerEntries[0].insertion_timestamp);
            if (joinDate < oneWeekAgo) { // Proceed only if join date is at least 7 days old
                let closestEntryToWeekAgo = playerEntries.reduce((prev, curr) => {
                    return (Math.abs(new Date(curr.insertion_timestamp) - oneWeekAgo) < Math.abs(new Date(prev.insertion_timestamp) - oneWeekAgo)) ? curr : prev;
                });
        
                const playtimeChange = playerEntries[playerEntries.length - 1].playtime - closestEntryToWeekAgo.playtime;
        
                if (playtimeChange < 2) { // less than 2 hours of playtime
                    candidates.push({ username, playtimeChange });
                }
            }
        }

        // Fetch additional data from Wynncraft API for candidates
        let filteredCandidates = await Promise.all(candidates.map(async (candidate) => {
            try {
                const wynncraftResponse = await axios.get(`https://api.wynncraft.com/v3/player/${candidate.username}`);
                const guildName = wynncraftResponse.data?.guild?.name;
                if (guildName === 'Aequitas') {
                    return candidate;
                }
            } catch (error) {
                //console.error(`Error fetching Wynncraft data for ${candidate.username}:`, error);
            }
        }));

        filteredCandidates = filteredCandidates.filter(candidate => candidate !== undefined); // Remove undefined entries
        console.log(`Processed data for ${filteredCandidates.length} players.`);
        return { 
            calculatedData: filteredCandidates.map(candidate => ({ username: candidate.username, playtimeChange: candidate.playtimeChange.toFixed(2) })), 
            timeRange: `From ${overallOldestEntryDate.toISOString().split('T')[0]} to ${newestEntryDate.toISOString().split('T')[0]}`
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { calculatedData: [], timeRange: '' };
    }
}

module.exports = { fetchPlayerData, fetchMembersWithRole, fetchPlaytimeData };
