/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayerProfile,
  HiddenItem,
  RivalOperative,
  Challenge,
  Achievement,
  RarityTier,
  RARITY_CONFIGS,
  DailyBountiesState,
  DailyBounty,
} from './types/game';
import {
  INITIAL_PLAYER_PROFILE,
  INITIAL_CHALLENGES,
  INITIAL_ACHIEVEMENTS,
} from './data/mockWorld';
import {
  metersToGeoCoordinate,
  generateLocalHiddenItems,
  generateLocalRivalOperatives,
  calculateDistanceMeters,
  CityPreset,
  FAMOUS_EXPLORATION_ZONES,
} from './utils/geo';
import {
  loadDailyBountiesState,
  saveDailyBountiesState,
  generateDailyBounties,
  getNextMidnightTimestamp,
} from './utils/dailyBounties';
import { saveGameState, loadGameState, clearGameState } from './utils/storage';
import { sound } from './utils/audio';
import confetti from 'canvas-confetti';
import { ThreeWorld } from './components/ThreeWorld';
import { TitleScreen } from './components/TitleScreen';
import { HudOverlay } from './components/HudOverlay';
import { DecryptMinigame } from './components/DecryptMinigame';
import { ConfrontationArena } from './components/ConfrontationArena';
import { ArtifactInspector } from './components/ArtifactInspector';
import { AchievementsPanel } from './components/AchievementsPanel';
import { ChallengesModal } from './components/ChallengesModal';
import { InventoryModal } from './components/InventoryModal';
import { LevelUpCelebration } from './components/LevelUpCelebration';
import { DailyBountiesModal } from './components/DailyBountiesModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Game Shell State
  const [gameState, setGameState] = useState<
    'title' | 'playing' | 'decrypting' | 'confronting'
  >('title');

  // Initial state loaded from localStorage persistence layer
  const initialSaveRef = useRef(loadGameState());
  const [lastSavedAt, setLastSavedAt] = useState<number>(() => initialSaveRef.current?.lastSavedAt || Date.now());

  // Player & World State
  const [player, setPlayer] = useState<PlayerProfile>(() => initialSaveRef.current?.player || INITIAL_PLAYER_PROFILE);
  const [playerMeters, setPlayerMeters] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [items, setItems] = useState<HiddenItem[]>([]);
  const [rivals, setRivals] = useState<RivalOperative[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>(() => initialSaveRef.current?.challenges || INITIAL_CHALLENGES);
  const [achievements, setAchievements] = useState<Achievement[]>(() => initialSaveRef.current?.achievements || INITIAL_ACHIEVEMENTS);

  // Active Modals & Selected Objects
  const [activeItemToDecrypt, setActiveItemToDecrypt] = useState<HiddenItem | null>(null);
  const [activeRivalToConfront, setActiveRivalToConfront] = useState<RivalOperative | null>(null);
  const [inspectedArtifact, setInspectedArtifact] = useState<HiddenItem | null>(null);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [showChallenges, setShowChallenges] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showDailyBounties, setShowDailyBounties] = useState<boolean>(false);
  const [bountiesState, setBountiesState] = useState<DailyBountiesState>(loadDailyBountiesState);
  const [levelUpData, setLevelUpData] = useState<{
    level: number;
    tier: RarityTier;
    isNewRank: boolean;
  } | null>(null);

  // Settings & Toggles
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [radarScanActive, setRadarScanActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'follow' | 'tactical_overhead'>('follow');

  // Reference for GPS watch id
  const geoWatchIdRef = useRef<number | null>(null);

  // Persistence Layer: Automatically saves PlayerProfile, inventory, and challenges every 30 seconds
  useEffect(() => {
    const saveToLocalStorage = () => {
      saveGameState(player, challenges, achievements);
      setLastSavedAt(Date.now());
    };

    // Save every 30 seconds
    const intervalId = window.setInterval(saveToLocalStorage, 30000);

    // Safeguard: Save state before user leaves, refreshes or changes tab
    const handleBeforeUnload = () => {
      saveToLocalStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToLocalStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [player, challenges, achievements]);

  // Manual save trigger
  const handleManualSave = useCallback(() => {
    saveGameState(player, challenges, achievements);
    setLastSavedAt(Date.now());
    sound.playClick();
  }, [player, challenges, achievements]);

  // Reset saved progress to initial state
  const handleResetProgress = useCallback(() => {
    clearGameState();
    setPlayer(INITIAL_PLAYER_PROFILE);
    setChallenges(INITIAL_CHALLENGES);
    setAchievements(INITIAL_ACHIEVEMENTS);
    sound.playClick();
  }, []);

  // Update Daily Bounty progress
  const updateDailyBountyProgress = useCallback((type: DailyBounty['type'], delta: number) => {
    setBountiesState((prevState) => {
      let anyChanged = false;
      const updatedBounties = prevState.bounties.map((b) => {
        if (b.type === type && !b.isCompleted) {
          const nextProg = Math.min(b.maxProgress, b.progress + delta);
          const completed = nextProg >= b.maxProgress;
          if (completed) {
            sound.playCollectSuccess();
          }
          anyChanged = true;
          return {
            ...b,
            progress: nextProg,
            isCompleted: completed,
          };
        }
        return b;
      });

      if (!anyChanged) return prevState;

      const nextState: DailyBountiesState = {
        ...prevState,
        bounties: updatedBounties,
      };
      saveDailyBountiesState(nextState);
      return nextState;
    });
  }, []);

  // Claim Daily Bounty Reward
  const handleClaimDailyBounty = useCallback((bountyId: string) => {
    setBountiesState((prevState) => {
      const targetBounty = prevState.bounties.find((b) => b.id === bountyId);
      if (!targetBounty || targetBounty.isClaimed || !targetBounty.isCompleted) return prevState;

      sound.playLevelUp();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      addPlayerXp(targetBounty.xpReward);

      const nextBounties = prevState.bounties.map((b) =>
        b.id === bountyId ? { ...b, isClaimed: true } : b
      );

      const nextState: DailyBountiesState = {
        ...prevState,
        bounties: nextBounties,
      };
      saveDailyBountiesState(nextState);
      return nextState;
    });
  }, []);

  // Claim Grand 24-Hour Vault Bonus
  const handleClaimGrandBonus = useCallback(() => {
    setBountiesState((prevState) => {
      if (prevState.allClaimedBonusAwarded) return prevState;

      sound.playLevelUp();
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.5 },
      });

      addPlayerXp(800);

      const nextState: DailyBountiesState = {
        ...prevState,
        allClaimedBonusAwarded: true,
      };
      saveDailyBountiesState(nextState);
      return nextState;
    });
  }, []);

  // Force New 24-Hour Cycle (Debug & Manual Refresh)
  const handleForceResetDailyBounties = useCallback(() => {
    const now = Date.now();
    const nextReset = getNextMidnightTimestamp();
    const freshBounties = generateDailyBounties(now + Math.floor(Math.random() * 100000000));
    const nextState: DailyBountiesState = {
      lastResetTimestamp: now,
      nextResetTimestamp: nextReset,
      bounties: freshBounties,
      allClaimedBonusAwarded: false,
    };
    setBountiesState(nextState);
    saveDailyBountiesState(nextState);
    sound.playSonarPing(1.5);
  }, []);

  // Compute Rarity Tier from Level
  const getTierFromLevel = (level: number): RarityTier => {
    if (level <= 5) return 'common';
    if (level <= 12) return 'rare';
    if (level <= 20) return 'epic';
    if (level <= 30) return 'legendary';
    return 'mythic';
  };

  // Add XP and handle Level/Rarity Ascension
  const addPlayerXp = useCallback((xpAmount: number) => {
    setPlayer((prev) => {
      let currentXp = prev.currentXp + xpAmount;
      let level = prev.level;
      let nextLevelXp = prev.nextLevelXp;
      let currentTier = prev.rarityTier;
      let didLevelUp = false;
      let didRankUp = false;

      while (currentXp >= nextLevelXp) {
        currentXp -= nextLevelXp;
        level += 1;
        didLevelUp = true;

        const newTier = getTierFromLevel(level);
        if (newTier !== currentTier) {
          currentTier = newTier;
          didRankUp = true;
        }

        const tierCfg = RARITY_CONFIGS[currentTier];
        nextLevelXp = Math.round(250 * level * (tierCfg.xpMultiplier * 0.8));
      }

      if (didLevelUp) {
        sound.playLevelUp();
        setLevelUpData({
          level,
          tier: currentTier,
          isNewRank: didRankUp,
        });
      }

      return {
        ...prev,
        level,
        currentXp,
        nextLevelXp,
        rarityTier: currentTier,
      };
    });
  }, []);

  // Check and unlock achievements
  const checkAchievements = useCallback((
    updatedPlayer: PlayerProfile,
    updatedAchievements: Achievement[],
    setAchievementsFn: React.Dispatch<React.SetStateAction<Achievement[]>>
  ) => {
    setAchievementsFn((prevList) =>
      prevList.map((ach) => {
        if (ach.unlocked) return ach;

        let shouldUnlock = false;
        if (ach.category === 'distance' && ach.targetMeters) {
          if (updatedPlayer.totalMetersExplored >= ach.targetMeters) {
            shouldUnlock = true;
          }
        } else if (ach.category === 'rarity') {
          if (ach.id === 'ach-collect-first' && updatedPlayer.inventory.length >= 1) {
            shouldUnlock = true;
          } else if (ach.id === 'ach-rare-rank' && (updatedPlayer.rarityTier === 'rare' || updatedPlayer.rarityTier === 'epic' || updatedPlayer.rarityTier === 'legendary' || updatedPlayer.rarityTier === 'mythic')) {
            shouldUnlock = true;
          } else if (ach.id === 'ach-epic-rank' && (updatedPlayer.rarityTier === 'epic' || updatedPlayer.rarityTier === 'legendary' || updatedPlayer.rarityTier === 'mythic')) {
            shouldUnlock = true;
          } else if (ach.id === 'ach-legendary-rank' && (updatedPlayer.rarityTier === 'legendary' || updatedPlayer.rarityTier === 'mythic')) {
            shouldUnlock = true;
          }
        } else if (ach.category === 'duel' && ach.targetCount) {
          if (updatedPlayer.duelsWon >= ach.targetCount) {
            shouldUnlock = true;
          }
        } else if (ach.category === 'geo_poi') {
          if (ach.id === 'ach-accuracy-gps' && updatedPlayer.isRealGps) {
            shouldUnlock = true;
          }
        }

        if (shouldUnlock) {
          sound.playCollectSuccess();
          return {
            ...ach,
            unlocked: true,
            unlockedAt: new Date().toLocaleTimeString(),
          };
        }
        return ach;
      })
    );
  }, []);

  // Update Challenge Progress
  const updateChallengeProgress = useCallback(
    (challengeId: string, delta: number) => {
      setChallenges((prevList) =>
        prevList.map((ch) => {
          if (ch.id === challengeId && !ch.isCompleted) {
            const nextProg = Math.min(ch.maxProgress, ch.progress + delta);
            const completed = nextProg >= ch.maxProgress;
            if (completed) {
              sound.playCollectSuccess();
              addPlayerXp(ch.xpReward);
            }
            return {
              ...ch,
              progress: nextProg,
              isCompleted: completed,
            };
          }
          return ch;
        })
      );
    },
    [addPlayerXp]
  );

  // Start game with selected zone
  const handleStartGame = (config: { isRealGps: boolean; selectedZone: CityPreset }) => {
    const startCoords = config.selectedZone.coords;
    const initialItems = generateLocalHiddenItems(startCoords, player.rarityTier);
    const initialRivals = generateLocalRivalOperatives(startCoords);

    setPlayer((prev) => {
      const updated = {
        ...prev,
        currentCoords: startCoords,
        isRealGps: config.isRealGps,
      };
      saveGameState(updated, challenges, achievements);
      return updated;
    });
    setItems(initialItems);
    setRivals(initialRivals);
    setGameState('playing');

    // Real GPS Watch
    if (config.isRealGps && navigator.geolocation) {
      let lastKnown = startCoords;
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy,
          };
          const distWalked = calculateDistanceMeters(lastKnown, newCoords);
          if (distWalked > 1) {
            lastKnown = newCoords;
            setPlayer((prev) => {
              const updated = {
                ...prev,
                currentCoords: newCoords,
                totalMetersExplored: prev.totalMetersExplored + distWalked,
              };
              checkAchievements(updated, achievements, setAchievements);
              return updated;
            });
            updateChallengeProgress('ch-walk-100', distWalked);
            updateChallengeProgress('ch-geo-master', distWalked);
            updateDailyBountyProgress('exploration_distance', distWalked);
          }
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  };

  // Move player in tactical meters
  const handleMovePlayer = useCallback(
    (deltaX: number, deltaZ: number) => {
      const dist = Math.hypot(deltaX, deltaZ);
      let newHeading = player.heading;

      if (dist > 0) {
        newHeading = (Math.atan2(deltaX, -deltaZ) * 180) / Math.PI;
      }

      setPlayerMeters((prev) => {
        const nextX = prev.x + deltaX;
        const nextZ = prev.z + deltaZ;
        return { x: nextX, z: nextZ };
      });

      setPlayer((prev) => {
        const newCoords = metersToGeoCoordinate(prev.currentCoords, deltaX, deltaZ);
        const updated = {
          ...prev,
          currentCoords: newCoords,
          heading: newHeading,
          totalMetersExplored: prev.totalMetersExplored + dist,
        };
        checkAchievements(updated, achievements, setAchievements);
        return updated;
      });

      updateChallengeProgress('ch-walk-100', dist);
      updateChallengeProgress('ch-geo-master', dist);
      updateDailyBountyProgress('exploration_distance', dist);
    },
    [player.heading, checkAchievements, achievements, updateChallengeProgress, updateDailyBountyProgress]
  );

  // Pulse Radar Scan
  const handleTriggerRadarScan = useCallback(() => {
    setRadarScanActive(true);
    sound.playSonarPing();
    updateChallengeProgress('ch-first-scan', 1);
    updateDailyBountyProgress('radar_scans', 1);

    setTimeout(() => {
      setRadarScanActive(false);
    }, 1200);

    // Reveal items within radar radius
    const radius = RARITY_CONFIGS[player.rarityTier].sonarRadiusMeters;
    setItems((prevItems) =>
      prevItems.map((it) => {
        const d = Math.hypot(it.relativeMeters.x - playerMeters.x, it.relativeMeters.z - playerMeters.z);
        if (d <= radius && !it.revealed) {
          sound.playItemReveal(it.rarity);
          return { ...it, revealed: true };
        }
        return it;
      })
    );
  }, [player.rarityTier, playerMeters, updateChallengeProgress, updateDailyBountyProgress]);

  // Handle Decryption Success
  const handleDecryptionSuccess = (item: HiddenItem) => {
    setActiveItemToDecrypt(null);
    setGameState('playing');

    // Add item to inventory and remove from world
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, isCollected: true } : it)));
    setPlayer((prev) => {
      const updated = {
        ...prev,
        inventory: [...prev.inventory, item],
      };
      checkAchievements(updated, achievements, setAchievements);
      return updated;
    });

    const xpEarned = Math.round(180 * RARITY_CONFIGS[item.rarity].xpMultiplier);
    addPlayerXp(xpEarned);

    updateChallengeProgress('ch-collect-3', 1);
    updateDailyBountyProgress('relic_collect', 1);
    if (item.rarity !== 'common') {
      updateChallengeProgress('ch-rare-hunter', 1);
    }
  };

  // Handle Confrontation Duel Victory
  const handleConfrontationVictory = (rival: RivalOperative, loot: HiddenItem) => {
    setActiveRivalToConfront(null);
    setGameState('playing');

    // Mark rival defeated
    setRivals((prev) =>
      prev.map((r) => (r.id === rival.id ? { ...r, status: 'defeated' } : r))
    );

    // Award loot & victory stats
    setPlayer((prev) => {
      const updated = {
        ...prev,
        duelsWon: prev.duelsWon + 1,
        inventory: [...prev.inventory, loot],
      };
      checkAchievements(updated, achievements, setAchievements);
      return updated;
    });

    const xpEarned = Math.round(450 * RARITY_CONFIGS[rival.rarityTier].xpMultiplier);
    addPlayerXp(xpEarned);

    updateChallengeProgress('ch-duel-win', 1);
    updateDailyBountyProgress('rival_defeat', 1);
  };

  // Keyboard navigation & hotkeys
  useEffect(() => {
    if (gameState !== 'playing') return;

    const pressedKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      pressedKeys.add(e.code);

      // Radar Space bar
      if (e.code === 'Space') {
        handleTriggerRadarScan();
      }
      // Inventory
      if (e.code === 'KeyI') {
        setShowInventory((prev) => !prev);
        sound.playClick();
      }
      // Daily Bounties
      if (e.code === 'KeyB') {
        setShowDailyBounties((prev) => !prev);
        sound.playClick();
      }
      // Confront nearest rival
      if (e.code === 'KeyC') {
        const nearestRival = rivals.find((r) => {
          const d = Math.hypot(r.relativeMeters.x - playerMeters.x, r.relativeMeters.z - playerMeters.z);
          return d <= 45 && r.status !== 'defeated';
        });
        if (nearestRival) {
          setActiveRivalToConfront(nearestRival);
          setGameState('confronting');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.code);
    };

    const interval = setInterval(() => {
      let deltaX = 0;
      let deltaZ = 0;
      const speed = 4.5;

      if (pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) deltaZ -= speed;
      if (pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')) deltaZ += speed;
      if (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft')) deltaX -= speed;
      if (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) deltaX += speed;

      if (deltaX !== 0 || deltaZ !== 0) {
        handleMovePlayer(deltaX, deltaZ);
      }
    }, 50);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleMovePlayer, handleTriggerRadarScan, rivals, playerMeters]);

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* Offline & Connectivity Toast */}
      <OfflineIndicator />

      {/* 3D WebGL Canvas Layer (Active in both Title and Game) */}
      <ThreeWorld
        playerMeters={playerMeters}
        playerHeading={player.heading}
        items={items}
        rivals={rivals}
        radarScanActive={radarScanActive}
        isPaused={gameState !== 'playing'}
        cameraMode={cameraMode}
        onSelectItem={(item) => {
          const d = Math.hypot(item.relativeMeters.x - playerMeters.x, item.relativeMeters.z - playerMeters.z);
          if (d <= 35) {
            setActiveItemToDecrypt(item);
            setGameState('decrypting');
          } else {
            sound.playSonarPing(0.9);
          }
        }}
        onSelectRival={(rival) => {
          const d = Math.hypot(rival.relativeMeters.x - playerMeters.x, rival.relativeMeters.z - playerMeters.z);
          if (d <= 45 && rival.status !== 'defeated') {
            setActiveRivalToConfront(rival);
            setGameState('confronting');
          } else {
            sound.playSonarPing(0.8);
          }
        }}
      />

      {/* Title Screen State */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={() => {
            const nextMuted = sound.toggleMute();
            setIsMuted(nextMuted);
          }}
          savedPlayer={player}
          onResetProgress={handleResetProgress}
        />
      )}

      {/* Main In-Game HUD Overlay */}
      {gameState === 'playing' && (
        <HudOverlay
          player={player}
          items={items}
          rivals={rivals}
          bountiesState={bountiesState}
          lastSavedAt={lastSavedAt}
          onManualSave={handleManualSave}
          onTriggerRadarScan={handleTriggerRadarScan}
          onOpenInventory={() => setShowInventory(true)}
          onOpenChallenges={() => setShowChallenges(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenDailyBounties={() => setShowDailyBounties(true)}
          onSelectItemToDecrypt={(item) => {
            setActiveItemToDecrypt(item);
            setGameState('decrypting');
          }}
          onSelectRivalToConfront={(rival) => {
            setActiveRivalToConfront(rival);
            setGameState('confronting');
          }}
          cameraMode={cameraMode}
          onToggleCameraMode={() => {
            setCameraMode((prev) => (prev === 'follow' ? 'tactical_overhead' : 'follow'));
          }}
          isMuted={isMuted}
          onToggleMute={() => {
            const nextMuted = sound.toggleMute();
            setIsMuted(nextMuted);
          }}
          onMovePlayer={handleMovePlayer}
        />
      )}

      {/* Decryption Minigame Modal */}
      {gameState === 'decrypting' && activeItemToDecrypt && (
        <DecryptMinigame
          item={activeItemToDecrypt}
          onSuccess={handleDecryptionSuccess}
          onCancel={() => {
            setActiveItemToDecrypt(null);
            setGameState('playing');
          }}
        />
      )}

      {/* Confrontation Arena Modal */}
      {gameState === 'confronting' && activeRivalToConfront && (
        <ConfrontationArena
          rival={activeRivalToConfront}
          player={player}
          onVictory={handleConfrontationVictory}
          onDefeat={() => {
            setActiveRivalToConfront(null);
            setGameState('playing');
          }}
          onRetreat={() => {
            setActiveRivalToConfront(null);
            setGameState('playing');
          }}
          onEmpUsed={() => updateDailyBountyProgress('emp_strike', 1)}
        />
      )}

      {/* Daily Bounties 24-Hour Cycle Modal */}
      {showDailyBounties && (
        <DailyBountiesModal
          bountiesState={bountiesState}
          onClaimBounty={handleClaimDailyBounty}
          onClaimGrandBonus={handleClaimGrandBonus}
          onForceReset={handleForceResetDailyBounties}
          onClose={() => setShowDailyBounties(false)}
        />
      )}

      {/* 3D Artifact Inspector Modal */}
      {inspectedArtifact && (
        <ArtifactInspector
          item={inspectedArtifact}
          onClose={() => setInspectedArtifact(null)}
        />
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <InventoryModal
          inventory={player.inventory}
          onInspectItem={(item) => setInspectedArtifact(item)}
          onClose={() => setShowInventory(false)}
        />
      )}

      {/* Sector Challenges Modal */}
      {showChallenges && (
        <ChallengesModal
          challenges={challenges}
          onClose={() => setShowChallenges(false)}
        />
      )}

      {/* Local Geographic Exploration Achievements Modal */}
      {showAchievements && (
        <AchievementsPanel
          achievements={achievements}
          player={player}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {/* Level Up & Rarity Rank Ascension Celebration Modal */}
      {levelUpData && (
        <LevelUpCelebration
          level={levelUpData.level}
          rarityTier={levelUpData.tier}
          isNewRank={levelUpData.isNewRank}
          onDismiss={() => setLevelUpData(null)}
        />
      )}
    </div>
  );
}
