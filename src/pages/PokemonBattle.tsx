import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/contexts";

/* ----------------------------
   Types
   ---------------------------- */
type Move = { name: string; power: number; type: string };
type Pokemon = {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  type: string;
  sprite: string;
  moves: Move[];
};

/* ----------------------------
   Utility: Type effectiveness
   ---------------------------- */
const typeEffectiveness = (
  attackType: string,
  defenderType: string
): number => {
  const chart: Record<string, Record<string, number>> = {
    Electric: { Water: 2, Grass: 0.5 },
    Grass: { Water: 2, Fire: 0.5 },
    Fire: { Grass: 2, Water: 0.5 },
    Water: { Fire: 2, Grass: 0.5 },
    Normal: {},
    Poison: { Grass: 2 },
    Steel: { Rock: 0.5 },
  };
  return chart[attackType]?.[defenderType] ?? 1;
};

/* ----------------------------
   Simple damage formula
   ---------------------------- */
const calcDamage = (attacker: Pokemon, defender: Pokemon, move: Move) => {
  let base = move.power + attacker.attack - defender.defense;
  base = Math.max(base, 1);
  const eff = typeEffectiveness(move.type, defender.type);
  return Math.floor(base * eff);
};

/* ----------------------------
   Sound: Web Audio synth helpers
   ---------------------------- */
const useSoundPlayer = (enabled: boolean) => {
  const ctxRef = React.useRef<AudioContext | null>(null);

  useEffect(() => {
    if (enabled && ctxRef.current == null) {
      try {
        ctxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch {
        ctxRef.current = null;
      }
    }
  }, [enabled]);

  const playBeep = (
    opts: {
      frequency?: number;
      type?: OscillatorType;
      duration?: number;
      gain?: number;
    } = {}
  ) => {
    if (!enabled) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const {
      frequency = 440,
      type = "sine",
      duration = 0.12,
      gain = 0.08,
    } = opts;

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.value = gain;
    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    o.start(now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    o.stop(now + duration + 0.02);
  };

  const playAttack = (type: string) => {
    if (!enabled) return;
    const map: Record<string, { freq: number; osc: OscillatorType }> = {
      Electric: { freq: 880, osc: "sine" },
      Grass: { freq: 330, osc: "triangle" },
      Water: { freq: 440, osc: "sine" },
      Fire: { freq: 550, osc: "sawtooth" },
      Normal: { freq: 300, osc: "square" },
      Poison: { freq: 260, osc: "sawtooth" },
      Steel: { freq: 660, osc: "square" },
    };
    const info = map[type] ?? { freq: 440, osc: "sine" };
    playBeep({
      frequency: info.freq,
      type: info.osc,
      duration: 0.16,
      gain: 0.12,
    });
    setTimeout(
      () =>
        playBeep({
          frequency: info.freq * 0.6,
          type: "triangle",
          duration: 0.08,
          gain: 0.06,
        }),
      70
    );
  };

  const playFaint = () => {
    if (!enabled) return;
    playBeep({ frequency: 150, type: "sine", duration: 0.5, gain: 0.18 });
    setTimeout(
      () =>
        playBeep({ frequency: 100, type: "sine", duration: 0.4, gain: 0.12 }),
      180
    );
  };

  return { playAttack, playFaint, playBeep };
};

/* ----------------------------
   Particles component
   ---------------------------- */
const ParticleField: React.FC<{
  keySeed: string | null;
  type?: string;
  duration?: number;
}> = ({ keySeed, type = "Normal", duration = 650 }) => {
  const particleCount = 10;
  const paletteByType: Record<string, string[]> = {
    Electric: ["#FDE047", "#FACC15", "#F59E0B"],
    Grass: ["#86EFAC", "#4ADE80", "#16A34A"],
    Fire: ["#FCA5A5", "#FB923C", "#F97316"],
    Water: ["#93C5FD", "#60A5FA", "#3B82F6"],
    Normal: ["#E5E7EB", "#D1D5DB"],
    Poison: ["#C084FC", "#A78BFA"],
    Steel: ["#CBD5E1", "#9CA3AF"],
  };
  const palette = paletteByType[type] ?? paletteByType.Normal;

  const particles = useMemo(
    () =>
      new Array(particleCount).fill(0).map((_, i) => {
        const size = 8 + Math.random() * 14;
        const x = Math.random() * (i % 2 === 0 ? -160 : 160);
        const y = -10 + Math.random() * 80;
        const rot = (Math.random() - 0.5) * 90;
        const delay = Math.random() * 0.12;
        const color = palette[Math.floor(Math.random() * palette.length)];
        return { id: `${keySeed}-${i}`, size, x, y, rot, delay, color };
      }),
    [keySeed, palette]
  );

  if (!keySeed) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.1, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.0, rotate: p.rot }}
          transition={{
            delay: p.delay,
            duration: duration / 1000,
            ease: "easeOut",
          }}
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 6,
            boxShadow: `0 0 8px ${p.color}`,
            transformOrigin: "center",
          }}
          className="absolute"
        />
      ))}
    </div>
  );
};

/* ----------------------------
   HP Bar component
   ---------------------------- */
const HpBar: React.FC<{ hp: number; maxHp: number }> = ({ hp, maxHp }) => {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const color =
    pct > 60 ? "bg-green-500" : pct > 30 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 mt-2 overflow-hidden">
      <div
        className={`${color} h-full transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/* ----------------------------
   Main Component
   ---------------------------- */
const PokemonBattle: React.FC = () => {
  const { user } = useAuthContext();

  // Player and enemy Pokémon selections
  const [playerChoice, setPlayerChoice] = useState<Pokemon | null>(null);
  const [enemyChoice, setEnemyChoice] = useState<Pokemon | null>(null);

  const [player, setPlayer] = useState<Pokemon | null>(null);
  const [enemy, setEnemy] = useState<Pokemon | null>(null);

  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState("Choose your Pokémon to begin.");
  const [battleActive, setBattleActive] = useState(false);
  const [particleSeed, setParticleSeed] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const { playAttack, playFaint } = useSoundPlayer(soundOn);

  // User Pokémon fetched from API
  const [userPokemon, setUserPokemon] = useState<Pokemon[]>([]);
  const [loadingPokemon, setLoadingPokemon] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserPokemon = async () => {
      setLoadingPokemon(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/pokemon/${user.id}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch Pokémon");
        const data: Pokemon[] = await res.json();
        setUserPokemon(data);
        if (data.length > 0 && !playerChoice) setPlayerChoice(data[0]);
      } catch (err) {
        console.error(err);
        setUserPokemon([]);
      } finally {
        setLoadingPokemon(false);
      }
    };

    fetchUserPokemon();
  }, [user]);

  // Update working copies when choices change (not during battle)
  useEffect(() => {
    if (!battleActive) {
      setPlayer(playerChoice ? { ...playerChoice } : null);
      // pick a different enemy if same selected
      const candidate =
        userPokemon.find((p) => p.id !== playerChoice?.id) ?? userPokemon[0];
      setEnemy(
        playerChoice && playerChoice.id === candidate?.id
          ? userPokemon[1] ?? candidate
          : candidate ?? null
      );
      setMessage("Choose your Pokémon and opponent.");
      setLog([]);
    }
  }, [playerChoice, battleActive, userPokemon]);

  // start battle
  const startBattle = () => {
    if (!playerChoice || !enemyChoice) return;
    setPlayer({ ...playerChoice, hp: playerChoice.maxHp });
    setEnemy({ ...enemyChoice, hp: enemyChoice.maxHp });
    setBattleActive(true);
    setLog([]);
    setMessage("Battle started! Choose a move.");
  };

  // simple AI
  const pickEnemyMove = (enemyLocal: Pokemon) => {
    const idx = Math.floor(Math.random() * enemyLocal.moves.length);
    return enemyLocal.moves[idx];
  };

  const doAttack = async (attacker: Pokemon, defender: Pokemon, move: Move) => {
    setParticleSeed(`${attacker.name}-${Date.now()}`);
    playAttack(move.type);

    await new Promise((r) => setTimeout(r, 420));

    const damage = calcDamage(attacker, defender, move);

    if (defender.name === enemy?.name) {
      setEnemy((prev) =>
        prev ? { ...prev, hp: Math.max(0, prev.hp - damage) } : prev
      );
    } else {
      setPlayer((prev) =>
        prev ? { ...prev, hp: Math.max(0, prev.hp - damage) } : prev
      );
    }

    const eff = typeEffectiveness(move.type, defender.type);
    const effText =
      eff > 1
        ? "It's super effective!"
        : eff < 1
        ? "It's not very effective..."
        : "";
    const text = `${attacker.name} used ${move.name}! ${effText} (${damage} dmg)`;
    setLog((p) => [text, ...p]);
    setMessage(text);

    if (defender.hp - damage <= 0) {
      playFaint();
      const faintText = `${defender.name} fainted! ${attacker.name} wins!`;
      setLog((p) => [faintText, ...p]);
      setMessage(faintText);
      setBattleActive(false);
    }
  };

  const onPlayerMove = async (move: Move) => {
    if (!player || !enemy || !battleActive) return;

    if (player.speed >= enemy.speed) {
      await doAttack(player, enemy, move);
      if (enemy.hp > 0) {
        const enemyMove = pickEnemyMove(enemy);
        await new Promise((r) => setTimeout(r, 300));
        if (enemy.hp > 0 && player.hp > 0)
          await doAttack(enemy, player, enemyMove);
      }
    } else {
      const enemyMove = pickEnemyMove(enemy);
      await doAttack(enemy, player, enemyMove);
      if (player.hp > 0) {
        await new Promise((r) => setTimeout(r, 300));
        await doAttack(player, enemy, move);
      }
    }
  };

  const resetToSelection = () => {
    setBattleActive(false);
    setPlayerChoice(userPokemon[0] ?? null);
    setEnemyChoice(userPokemon[1] ?? null);
    setPlayer(null);
    setEnemy(null);
    setMessage("Choose your Pokémon to begin.");
    setLog([]);
    setParticleSeed(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-yellow-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">⚡ Pokémon Battle Arena</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={soundOn}
                onChange={(e) => setSoundOn(e.target.checked)}
                className="w-4 h-4"
              />
              Sound
            </label>
            <button
              onClick={resetToSelection}
              className="px-3 py-1 rounded bg-white border shadow text-sm"
            >
              Reset
            </button>
          </div>
        </header>

        {!battleActive ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Player roster */}
            <div className="bg-white rounded-2xl p-4 shadow">
              <h2 className="font-semibold mb-2">Your Pokémon</h2>
              <div className="space-y-3">
                {loadingPokemon ? (
                  <p>Loading your Pokémon...</p>
                ) : userPokemon.length === 0 ? (
                  <p>You have no Pokémon yet.</p>
                ) : (
                  userPokemon.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPlayerChoice(p)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        playerChoice?.id === p.id
                          ? "ring-2 ring-blue-300 bg-blue-50"
                          : ""
                      }`}
                    >
                      <img src={p.sprite} alt={p.name} className="w-12" />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.type} • HP {p.maxHp}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Enemy roster */}
            <div className="bg-white rounded-2xl p-4 shadow">
              <h2 className="font-semibold mb-2">Opponent</h2>
              <div className="space-y-3">
                {userPokemon
                  .filter((p) => p.id !== playerChoice?.id)
                  .map((p) => (
                    <div
                      key={p.id + "-enemy"}
                      onClick={() => setEnemyChoice(p)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        enemyChoice?.id === p.id
                          ? "ring-2 ring-red-300 bg-red-50"
                          : ""
                      }`}
                    >
                      <img src={p.sprite} alt={p.name} className="w-12" />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.type} • HP {p.maxHp}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Controls & start */}
            <div className="bg-white rounded-2xl p-4 shadow flex flex-col justify-between">
              <div>
                <h2 className="font-semibold mb-2">Ready?</h2>
                <p className="text-sm text-gray-600 mb-4">{message}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={startBattle}
                  disabled={!playerChoice || !enemyChoice}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold text-white shadow ${
                    !playerChoice || !enemyChoice
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  Start Battle
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow">
            {/* Battle UI omitted for brevity (unchanged, keep your original JSX here) */}
            <p>Battle in progress...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonBattle;
