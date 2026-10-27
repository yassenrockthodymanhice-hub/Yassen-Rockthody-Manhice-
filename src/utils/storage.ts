import { PlayerProfile, Challenge, Achievement, HiddenItem } from '../types/game';
import { INITIAL_PLAYER_PROFILE, INITIAL_CHALLENGES, INITIAL_ACHIEVEMENTS } from '../data/mockWorld';

const STORAGE_KEY_SAVE = 'geohunter_saved_game_v1';

export interface SavedGameState {
  player: PlayerProfile;
  challenges: Challenge[];
  achievements: Achievement[];
  lastSavedAt: number;
  version: number;
}

/**
 * Saves current game state (PlayerProfile, inventory, and challenges) to localStorage
 */
export function saveGameState(
  player: PlayerProfile,
  challenges: Challenge[],
  achievements?: Achievement[]
): boolean {
  try {
    const dataToSave: SavedGameState = {
      player,
      challenges,
      achievements: achievements || [],
      lastSavedAt: Date.now(),
      version: 1,
    };
    localStorage.setItem(STORAGE_KEY_SAVE, JSON.stringify(dataToSave));
    return true;
  } catch (err) {
    console.error('Failed to save game state to localStorage:', err);
    return false;
  }
}

/**
 * Loads saved game state from localStorage, merging with defaults if fields are missing
 */
export function loadGameState(): {
  player: PlayerProfile;
  challenges: Challenge[];
  achievements: Achievement[];
  lastSavedAt: number;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVE);
    if (!raw) return null;

    const parsed: Partial<SavedGameState> = JSON.parse(raw);
    if (!parsed || !parsed.player) return null;

    // Ensure inventory is an array
    const savedInventory: HiddenItem[] = Array.isArray(parsed.player.inventory)
      ? parsed.player.inventory
      : [];

    const mergedPlayer: PlayerProfile = {
      ...INITIAL_PLAYER_PROFILE,
      ...parsed.player,
      inventory: savedInventory,
      // Restore coordinates or fallback
      currentCoords: parsed.player.currentCoords || INITIAL_PLAYER_PROFILE.currentCoords,
    };

    // Merge challenges with initial list to support any newly added challenges
    const savedChallengesMap = new Map((parsed.challenges || []).map((ch) => [ch.id, ch]));
    const mergedChallenges = INITIAL_CHALLENGES.map((initialCh) => {
      const saved = savedChallengesMap.get(initialCh.id);
      if (saved) {
        return {
          ...initialCh,
          progress: saved.progress ?? initialCh.progress,
          isCompleted: saved.isCompleted ?? initialCh.isCompleted,
        };
      }
      return initialCh;
    });

    // Merge achievements
    const savedAchievementsMap = new Map((parsed.achievements || []).map((ach) => [ach.id, ach]));
    const mergedAchievements = INITIAL_ACHIEVEMENTS.map((initialAch) => {
      const saved = savedAchievementsMap.get(initialAch.id);
      if (saved) {
        return {
          ...initialAch,
          unlocked: saved.unlocked ?? initialAch.unlocked,
          unlockedAt: saved.unlockedAt ?? initialAch.unlockedAt,
        };
      }
      return initialAch;
    });

    return {
      player: mergedPlayer,
      challenges: mergedChallenges,
      achievements: mergedAchievements,
      lastSavedAt: parsed.lastSavedAt || Date.now(),
    };
  } catch (err) {
    console.error('Failed to parse saved game state from localStorage:', err);
    return null;
  }
}

/**
 * Check if a saved game exists in localStorage
 */
export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_SAVE) !== null;
  } catch {
    return false;
  }
}

/**
 * Reset/Clear saved game state from localStorage
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SAVE);
  } catch (err) {
    console.error('Failed to clear saved game state from localStorage:', err);
  }
}
