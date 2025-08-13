// Sports data service for getting live game information
interface GameStatus {
  id: string;
  name: string;
  state: string;
  completed: boolean;
}

interface Team {
  id: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
}

interface Competition {
  id: string;
  status: {
    clock: number;
    displayClock: string;
    period: number;
    type: GameStatus;
  };
  competitors: Array<{
    team: Team;
    score: string;
    homeAway: string;
  }>;
}

interface LiveGame {
  id: string;
  name: string;
  shortName: string;
  competitions: Competition[];
}

interface SportsResponse {
  leagues: Array<{
    events: LiveGame[];
  }>;
}

// Get current live NFL games
export async function getLiveNFLGames(): Promise<LiveGame[]> {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    
    if (!response.ok) {
      console.error('Failed to fetch NFL games:', response.status);
      return [];
    }
    
    const data: SportsResponse = await response.json();
    
    if (!data.leagues || data.leagues.length === 0) {
      return [];
    }
    
    const events = data.leagues[0].events || [];
    
    // Filter for games that are currently in progress
    const liveGames = events.filter(game => {
      if (!game.competitions || game.competitions.length === 0) return false;
      
      const competition = game.competitions[0];
      const status = competition.status.type;
      
      // Game is live if it's in progress, at halftime, or between periods
      return status.state === 'in' && !status.completed;
    });
    
    return liveGames;
    
  } catch (error) {
    console.error('Error fetching NFL live games:', error);
    return [];
  }
}

// Get current live NBA games
export async function getLiveNBAGames(): Promise<LiveGame[]> {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
    
    if (!response.ok) {
      console.error('Failed to fetch NBA games:', response.status);
      return [];
    }
    
    const data: SportsResponse = await response.json();
    
    if (!data.leagues || data.leagues.length === 0) {
      return [];
    }
    
    const events = data.leagues[0].events || [];
    
    // Filter for games that are currently in progress
    const liveGames = events.filter(game => {
      if (!game.competitions || game.competitions.length === 0) return false;
      
      const competition = game.competitions[0];
      const status = competition.status.type;
      
      // Game is live if it's in progress, at halftime, or between periods
      return status.state === 'in' && !status.completed;
    });
    
    return liveGames;
    
  } catch (error) {
    console.error('Error fetching NBA live games:', error);
    return [];
  }
}

// Get live games from multiple sports
export async function getAllLiveGames(): Promise<{
  nfl: LiveGame[];
  nba: LiveGame[];
}> {
  try {
    const [nflGames, nbaGames] = await Promise.all([
      getLiveNFLGames(),
      getLiveNBAGames()
    ]);
    
    return {
      nfl: nflGames,
      nba: nbaGames
    };
  } catch (error) {
    console.error('Error fetching all live games:', error);
    return {
      nfl: [],
      nba: []
    };
  }
}

// Generate easily verifiable sports questions based on live games
export function generateLiveSportsQuestions(liveGames: { nfl: LiveGame[]; nba: LiveGame[] }): string[] {
  const questions: string[] = [];
  
  // NFL live game questions - focus on easily verifiable score changes
  liveGames.nfl.forEach(game => {
    if (game.competitions && game.competitions.length > 0) {
      const competition = game.competitions[0];
      const teams = competition.competitors;
      
      if (teams && teams.length >= 2) {
        const homeTeam = teams.find(t => t.homeAway === 'home')?.team.shortDisplayName;
        const awayTeam = teams.find(t => t.homeAway === 'away')?.team.shortDisplayName;
        const homeScore = parseInt(teams.find(t => t.homeAway === 'home')?.score || '0');
        const awayScore = parseInt(teams.find(t => t.homeAway === 'away')?.score || '0');
        
        // Only easily verifiable score-based questions (scores are always visible on ESPN)
        questions.push(
          `Will the ${homeTeam} score change from ${homeScore} in the next 15 minutes?`,
          `Will the ${awayTeam} score change from ${awayScore} in the next 15 minutes?`,
          `Will the total score in ${homeTeam} vs ${awayTeam} increase from ${homeScore + awayScore} in the next 15 minutes?`
        );
      }
    }
  });
  
  // NBA live game questions - focus on easily verifiable score changes
  liveGames.nba.forEach(game => {
    if (game.competitions && game.competitions.length > 0) {
      const competition = game.competitions[0];
      const teams = competition.competitors;
      
      if (teams && teams.length >= 2) {
        const homeTeam = teams.find(t => t.homeAway === 'home')?.team.shortDisplayName;
        const awayTeam = teams.find(t => t.homeAway === 'away')?.team.shortDisplayName;
        const homeScore = parseInt(teams.find(t => t.homeAway === 'home')?.score || '0');
        const awayScore = parseInt(teams.find(t => t.homeAway === 'away')?.score || '0');
        
        // Only easily verifiable score-based questions (scores are always visible on ESPN)
        questions.push(
          `Will the ${homeTeam} score change from ${homeScore} in the next 15 minutes?`,
          `Will the ${awayTeam} score change from ${awayScore} in the next 15 minutes?`,
          `Will the total score in ${homeTeam} vs ${awayTeam} increase from ${homeScore + awayScore} in the next 15 minutes?`
        );
      }
    }
  });
  
  // Limit to prevent too many sports questions
  return questions.slice(0, 3); // Reduced from 5 to 3 for better variety
}