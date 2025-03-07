const API_FOOTBALL_KEY = "VOTRE_CLE_API_FOOTBALL"; // Remplacez par votre clé API API-Football

// Fonction pour prédire le résultat du match
async function predictMatch() {
    const team1 = document.getElementById('team1').value;
    const team2 = document.getElementById('team2').value;

    if (!team1 || !team2) {
        alert("Veuillez entrer les noms des deux équipes.");
        return;
    }

    // Récupérer les ID des équipes
    const team1Id = await fetchTeamId(team1);
    const team2Id = await fetchTeamId(team2);

    if (!team1Id || !team2Id) {
        alert("Une ou plusieurs équipes n'ont pas été trouvées.");
        return;
    }

    // Récupérer les données des 15 derniers matchs et des 5 derniers face-à-face
    const team1Last15 = await fetchLast15Matches(team1Id);
    const team2Last15 = await fetchLast15Matches(team2Id);
    const last5HeadToHead = await fetchLast5HeadToHead(team1Id, team2Id);

    // Analyser les données et prédire le résultat
    const prediction = analyzeData(team1Last15, team2Last15, last5HeadToHead);

    // Afficher le résultat
    document.getElementById('result').innerHTML = `
        <strong>Résultat prédit :</strong> ${prediction}
    `;

    // Afficher les graphiques
    renderCharts(team1Last15, team2Last15, last5HeadToHead);
}

// Fonction pour récupérer l'ID d'une équipe via l'API API-Football
async function fetchTeamId(teamName) {
    const url = `https://v3.football.api-sports.io/teams?search=${teamName}`;
    const response = await fetch(url, {
        headers: {
            "x-rapidapi-key": API_FOOTBALL_KEY,
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
    });
    const data = await response.json();
    return data.response[0]?.team?.id; // Retourne l'ID de la première équipe trouvée
}

// Fonction pour récupérer les 15 derniers matchs d'une équipe via l'API API-Football
async function fetchLast15Matches(teamId) {
    const url = `https://v3.football.api-sports.io/fixtures?team=${teamId}&last=15`;
    const response = await fetch(url, {
        headers: {
            "x-rapidapi-key": API_FOOTBALL_KEY,
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
    });
    const data = await response.json();
    return data.response;
}

// Fonction pour récupérer les 5 derniers face-à-face via l'API API-Football
async function fetchLast5HeadToHead(team1Id, team2Id) {
    const url = `https://v3.football.api-sports.io/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=5`;
    const response = await fetch(url, {
        headers: {
            "x-rapidapi-key": API_FOOTBALL_KEY,
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
    });
    const data = await response.json();
    return data.response;
}

// Fonction pour analyser les données et prédire le résultat
function analyzeData(team1Last15, team2Last15, last5HeadToHead) {
    // Calculer la forme des équipes (exemple : pourcentage de victoires)
    const team1WinRate = (team1Last15.filter(match => match.teams.home.id === team1Id && match.teams.home.winner) || match.teams.away.id === team1Id && match.teams.away.winner).length / 15) * 100;
    const team2WinRate = (team2Last15.filter(match => match.teams.home.id === team2Id && match.teams.home.winner) || match.teams.away.id === team2Id && match.teams.away.winner).length / 15) * 100;

    // Analyser les face-à-face
    const headToHeadResults = last5HeadToHead.map(match => {
        if (match.teams.home.id === team1Id && match.teams.home.winner) return 'win';
        if (match.teams.away.id === team1Id && match.teams.away.winner) return 'win';
        if (match.teams.home.id === team2Id && match.teams.home.winner) return 'loss';
        if (match.teams.away.id === team2Id && match.teams.away.winner) return 'loss';
        return 'draw';
    });

    // Prédire le résultat
    if (team1WinRate > team2WinRate && headToHeadResults.filter(result => result === 'win').length >= 3) {
        return `Victoire de ${team1}`;
    } else if (team2WinRate > team1WinRate && headToHeadResults.filter(result => result === 'loss').length >= 3) {
        return `Victoire de ${team2}`;
    } else {
        return "Match nul";
    }
}

// Fonction pour afficher les graphiques
function renderCharts(team1Last15, team2Last15, last5HeadToHead) {
    const team1Ctx = document.getElementById('team1Chart').getContext('2d');
    const team2Ctx = document.getElementById('team2Chart').getContext('2d');
    const headToHeadCtx = document.getElementById('headToHeadChart').getContext('2d');

    // Graphique pour l'équipe 1
    new Chart(team1Ctx, {
        type: 'bar',
        data: {
            labels: team1Last15.map((_, i) => `Match ${i + 1}`),
            datasets: [{
                label: 'Buts marqués',
                data: team1Last15.map(match => match.goals.home + match.goals.away),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Graphique pour l'équipe 2
    new Chart(team2Ctx, {
        type: 'bar',
        data: {
            labels: team2Last15.map((_, i) => `Match ${i + 1}`),
            datasets: [{
                label: 'Buts marqués',
                data: team2Last15.map(match => match.goals.home + match.goals.away),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Graphique pour les face-à-face
    new Chart(headToHeadCtx, {
        type: 'pie',
        data: {
            labels: ['Victoires Équipe 1', 'Victoires Équipe 2', 'Matchs nuls'],
            datasets: [{
                data: [
                    last5HeadToHead.filter(match => (match.teams.home.id === team1Id && match.teams.home.winner) || (match.teams.away.id === team1Id && match.teams.away.winner)).length,
                    last5HeadToHead.filter(match => (match.teams.home.id === team2Id && match.teams.home.winner) || (match.teams.away.id === team2Id && match.teams.away.winner)).length,
                    last5HeadToHead.filter(match => !match.teams.home.winner && !match.teams.away.winner).length
                ],
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
            }]
        }
    });
}