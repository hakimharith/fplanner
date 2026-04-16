// FPL API response type definitions

export interface FplTeam {
  id: number;
  name: string;
  short_name: string;
  code: number;
}

export interface FplPlayer {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number; // team id
  element_type: 1 | 2 | 3 | 4; // 1=GK, 2=DEF, 3=MID, 4=FWD
  total_points: number;
  form: string; // decimal string e.g. "6.3"
  status: string;
  now_cost: number;
  photo: string;
  // Performance / xG
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  expected_goals_per_90: number;
  expected_assists_per_90: number;
  expected_goal_involvements_per_90: number;
  expected_goals_conceded_per_90: number;
  starts: number;
  // ICT
  ict_index: string;
  // Form & projection
  points_per_game: string;
  ep_next: string;
  // Ownership & market
  selected_by_percent: string;
  transfers_in_event: number;
  transfers_out_event: number;
  // Availability
  chance_of_playing_next_round: number | null;
  // Set-piece
  penalties_order: number | null;
  direct_freekicks_order: number | null;
  corners_and_indirect_freekicks_order: number | null;
  // Defensive (2025-26 new)
  defensive_contribution_per_90: number;
  starts_per_90: number;
  // Season stats
  goals_scored: number;
  minutes: number;
}

export interface FplGameweek {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
  is_previous: boolean;
}

export interface FplBootstrap {
  elements: FplPlayer[];
  teams: FplTeam[];
  events: FplGameweek[];
  total_players: number;
}

export interface FplFixture {
  id: number;
  event: number; // gameweek number, null for unscheduled
  team_h: number;
  team_a: number;
  team_h_difficulty: number; // FDR 1-5
  team_a_difficulty: number; // FDR 1-5
  finished: boolean;
}

export interface FplPickElement {
  element: number; // player id
  position: number; // squad position 1-15
  multiplier: number; // 2 = captain, 3 = TC, 0 = benched
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface FplPicks {
  picks: FplPickElement[];
  active_chip: string | null;
}

export interface FplEntryInfo {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string; // team name
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event: number;        // GW the points below belong to
  summary_event_points: number; // current GW points
  last_deadline_value: number;  // team value in 0.1m units
  last_deadline_bank: number;   // bank in 0.1m units
  leagues: {
    classic: {
      id: number;
      name: string;
      entry_rank: number;
      entry_last_rank: number;
    }[];
  };
}

// Processed / view model types

export const POSITION_LABELS: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
};

export interface PlayerFixtureCell {
  gameweek: number;
  fixtures: {
    opponentShort: string;
    isHome: boolean;
    fdr: number;
  }[];
}

export interface SquadPlayerRow {
  id: number;
  name: string;
  teamId: number;
  teamCode: number; // used for kit image URL
  teamShort: string;
  position: number;
  form: string;
  totalPoints: number;
  nowCost: number; // raw 0.1m units e.g. 85 = £8.5m
  isCaptain: boolean;
  isViceCaptain: boolean;
  isStarter: boolean; // pick.position 1-11 = starter, 12-15 = bench
  fixtures: PlayerFixtureCell[]; // one per gameweek
}

export interface TransferPlayer {
  id: number;
  name: string;
  teamShort: string;
  teamCode: number;
  position: number;
  form: number;
  totalPoints: number;
  priceMillion: number; // e.g. 8.5
  avgFdrNext3: number;
  nextFixtures: { opponentShort: string; isHome: boolean; fdr: number }[];
}

export interface TransferOutCandidate {
  id: number;
  name: string;
  teamShort: string;
  teamCode: number;
  position: number;
  form: number;
  totalPoints: number;
  priceMillion: number;
  avgFdrNext3: number;
  nextFixtures: { opponentShort: string; isHome: boolean; fdr: number }[];
  score: number;
  reasons: string[];
}

export interface TransferInCandidate {
  id: number;
  name: string;
  teamShort: string;
  teamCode: number;
  position: number;
  form: number;
  totalPoints: number;
  priceMillion: number;
  avgFdrNext3: number;
  nextFixtures: { opponentShort: string; isHome: boolean; fdr: number }[];
  score: number;
  reasons: string[];
}

/** @deprecated Use TransferOutCandidate / TransferInCandidate instead. */
export interface TransferRecommendation {
  out: TransferPlayer;
  in: TransferPlayer;
  reasons: string[];
  score: number;
}

export interface CaptainSuggestion {
  gameweek: number;
  playerId: number;
  playerName: string;
  opponentShort: string;
  isHome: boolean;
  avgFdr: number;
  totalPoints: number;
}

export interface FplPlayerPool {
  id: number;
  name: string;
  teamId: number;
  teamCode: number;
  teamShort: string;
  position: number; // 1=GK 2=DEF 3=MID 4=FWD
  form: string;
  totalPoints: number;
  nowCost: number; // raw 0.1m units e.g. 85 = £8.5m
  fixtures: PlayerFixtureCell[]; // same shape as SquadPlayerRow.fixtures
}
