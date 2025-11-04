import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    Steel: { Rock: 0.5 }, // small additions — you can extend chart
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
    // create audio context lazily on first user interaction
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

  // A 'punchy' sound for attacks with type variation
  const playAttack = (type: string) => {
    if (!enabled) return;
    // choose frequency & waveform by type
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

    // small secondary beep
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
   - small visual effects that spawn for an attack
   ---------------------------- */
const ParticleField: React.FC<{
  keySeed: string | null;
  type?: string;
  duration?: number;
}> = ({ keySeed, type = "Normal", duration = 650 }) => {
  // when keySeed changes we mount a new set of particles and then unmount via AnimatePresence
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
   Roster of Pokémon (small set)
   Sprites use PokeAPI static URLs (raw GitHub). These are stable paths.
   ---------------------------- */
const ROSTER: Pokemon[] = [
  {
    id: 25,
    name: "Pikachu",
    hp: 35,
    maxHp: 35,
    attack: 55,
    defense: 40,
    speed: 90,
    type: "Electric",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    moves: [
      { name: "Thunderbolt", power: 90, type: "Electric" },
      { name: "Quick Attack", power: 40, type: "Normal" },
      { name: "Iron Tail", power: 75, type: "Steel" },
    ],
  },
  {
    id: 1,
    name: "Bulbasaur",
    hp: 45,
    maxHp: 45,
    attack: 49,
    defense: 49,
    speed: 45,
    type: "Grass",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    moves: [
      { name: "Vine Whip", power: 45, type: "Grass" },
      { name: "Razor Leaf", power: 55, type: "Grass" },
      { name: "Tackle", power: 40, type: "Normal" },
    ],
  },
  {
    id: 4,
    name: "Charmander",
    hp: 39,
    maxHp: 39,
    attack: 52,
    defense: 43,
    speed: 65,
    type: "Fire",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
    moves: [
      { name: "Ember", power: 50, type: "Fire" },
      { name: "Scratch", power: 40, type: "Normal" },
      { name: "Flame Burst", power: 70, type: "Fire" },
    ],
  },
  {
    id: 7,
    name: "Squirtle",
    hp: 44,
    maxHp: 44,
    attack: 48,
    defense: 65,
    speed: 43,
    type: "Water",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
    moves: [
      { name: "Water Gun", power: 50, type: "Water" },
      { name: "Tackle", power: 40, type: "Normal" },
      { name: "Bubble", power: 40, type: "Water" },
    ],
  },
];

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
  const [playerChoice, setPlayerChoice] = useState<Pokemon | null>(ROSTER[0]);
  const [enemyChoice, setEnemyChoice] = useState<Pokemon | null>(() => {
    // default enemy is any other pokemon
    return ROSTER[1];
  });

  // working copies used in battle (so selection doesn't mutate roster)
  const [player, setPlayer] = useState<Pokemon | null>(
    () => playerChoice && { ...playerChoice }
  );
  const [enemy, setEnemy] = useState<Pokemon | null>(
    () => enemyChoice && { ...enemyChoice }
  );

  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState("Choose your Pokémon to begin.");
  const [battleActive, setBattleActive] = useState(false);
  const [particleSeed, setParticleSeed] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const { playAttack, playFaint } = useSoundPlayer(soundOn);

  // update working copies when choices change (not during battle)
  useEffect(() => {
    if (!battleActive) {
      setPlayer(playerChoice ? { ...playerChoice } : null);
      // pick a different enemy if same selected
      const candidate =
        ROSTER.find((r) => r.name !== playerChoice?.name) ?? ROSTER[0];
      setEnemy(
        playerChoice && playerChoice.name === candidate.name
          ? ROSTER[1]
          : { ...candidate }
      );
      setMessage("Choose your Pokémon and opponent.");
      setLog([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerChoice, battleActive]);

  useEffect(() => {
    if (!battleActive && enemyChoice) {
      setEnemy({ ...enemyChoice });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemyChoice]);

  // start battle: reset HP to max and set active flag
  const startBattle = () => {
    if (!playerChoice || !enemyChoice) return;
    setPlayer({ ...playerChoice, hp: playerChoice.maxHp });
    setEnemy({ ...enemyChoice, hp: enemyChoice.maxHp });
    setBattleActive(true);
    setLog([]);
    setMessage("Battle started! Choose a move.");
  };

  // simple AI: random move
  const pickEnemyMove = (enemyLocal: Pokemon) => {
    const idx = Math.floor(Math.random() * enemyLocal.moves.length);
    return enemyLocal.moves[idx];
  };

  // handle attacks (both sides)
  const doAttack = async (attacker: Pokemon, defender: Pokemon, move: Move) => {
    // particle + sound
    setParticleSeed(`${attacker.name}-${Date.now()}`); // triggers particle spawn
    playAttack(move.type);

    // small animation window (visual feedback)
    await new Promise((r) => setTimeout(r, 420));

    const damage = calcDamage(attacker, defender, move);

    // apply damage on appropriate state setter
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
      // fainted
      playFaint();
      const faintText = `${defender.name} fainted! ${attacker.name} wins!`;
      setLog((p) => [faintText, ...p]);
      setMessage(faintText);
      setBattleActive(false);
    }
  };

  // Player pressed a move button
  const onPlayerMove = async (move: Move) => {
    if (!player || !enemy || !battleActive) return;

    // determine speed order
    if (player.speed >= enemy.speed) {
      // player first
      await doAttack(player, enemy, move);
      // if enemy still alive, enemy attacks
      if (enemy.hp > 0) {
        // refresh local enemy (since state setters are async)
        const currentEnemy = (enemy && { ...enemy, hp: enemy.hp }) || null;
        // re-read enemy from state
        const currEnemyState = (await Promise.resolve()).then(
          () => {}
        ) as unknown;
        // pick move
        const enemyMove = pickEnemyMove(enemy);
        // small delay to make flow nicer
        await new Promise((r) => setTimeout(r, 300));
        if (enemy.hp > 0 && player.hp > 0) {
          await doAttack(enemy, player, enemyMove);
        }
      }
    } else {
      // enemy first
      const enemyMove = pickEnemyMove(enemy);
      await doAttack(enemy, player, enemyMove);
      if (player.hp > 0) {
        await new Promise((r) => setTimeout(r, 300));
        await doAttack(player, enemy, move);
      }
    }

    // refresh local copies from state (they were updated inside doAttack)
    // small wait to ensure state updated before reading
    await new Promise((r) => setTimeout(r, 50));
    // read latest
    // @ts-ignore - safe reading from state closure
    // check faint handled in doAttack
  };

  // Reset whole app to selection screen
  const resetToSelection = () => {
    setBattleActive(false);
    setPlayerChoice(ROSTER[0]);
    setEnemyChoice(ROSTER[1]);
    setPlayer(null);
    setEnemy(null);
    setMessage("Choose your Pokémon to begin.");
    setLog([]);
    setParticleSeed(null);
  };

  // Quick helpers
  const alive = (p?: Pokemon | null) => !!p && p.hp > 0;

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

        {/* Selection or Battle */}
        {!battleActive ? (
          /* Selection UI */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Player roster */}
            <div className="bg-white rounded-2xl p-4 shadow">
              <h2 className="font-semibold mb-2">Your Pokémon</h2>
              <div className="space-y-3">
                {ROSTER.map((r) => (
                  <div
                    key={r.name}
                    onClick={() => setPlayerChoice(r)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      playerChoice?.name === r.name
                        ? "ring-2 ring-blue-300 bg-blue-50"
                        : ""
                    }`}
                  >
                    <img src={r.sprite} alt={r.name} className="w-12" />
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-500">
                        {r.type} • HP {r.maxHp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enemy roster */}
            <div className="bg-white rounded-2xl p-4 shadow">
              <h2 className="font-semibold mb-2">Opponent</h2>
              <div className="space-y-3">
                {ROSTER.map((r) => (
                  <div
                    key={r.name + "-enemy"}
                    onClick={() => setEnemyChoice(r)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      enemyChoice?.name === r.name
                        ? "ring-2 ring-red-300 bg-red-50"
                        : ""
                    }`}
                  >
                    <img src={r.sprite} alt={r.name} className="w-12" />
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-500">
                        {r.type} • HP {r.maxHp}
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
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Player:</div>
                    <div className="font-medium">
                      {playerChoice?.name ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Enemy:</div>
                    <div className="font-medium">
                      {enemyChoice?.name ?? "—"}
                    </div>
                  </div>
                </div>
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
                <button
                  onClick={() => {
                    // quickly randomize opponent
                    const sample =
                      ROSTER[Math.floor(Math.random() * ROSTER.length)];
                    setEnemyChoice(sample);
                  }}
                  className="px-3 py-2 rounded-xl border"
                >
                  Random Opponent
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Battle UI */
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">Player</div>
                <div className="flex items-center gap-3">
                  <img
                    src={player?.sprite}
                    alt={player?.name}
                    className="w-16"
                  />
                  <div>
                    <div className="font-semibold text-lg">{player?.name}</div>
                    <div className="text-xs text-gray-500">{player?.type}</div>
                    <div className="w-48 mt-1">
                      <HpBar hp={player?.hp ?? 0} maxHp={player?.maxHp ?? 1} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="font-medium">{message}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Turn-based battle — pick a move.
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Opponent</div>
                <div className="flex items-center gap-3 justify-end">
                  <div className="text-right">
                    <div className="font-semibold text-lg">{enemy?.name}</div>
                    <div className="text-xs text-gray-500">{enemy?.type}</div>
                    <div className="w-48 mt-1">
                      <HpBar hp={enemy?.hp ?? 0} maxHp={enemy?.maxHp ?? 1} />
                    </div>
                  </div>
                  <img src={enemy?.sprite} alt={enemy?.name} className="w-16" />
                </div>
              </div>
            </div>

            {/* Particle field (top layer) */}
            <div className="relative h-48 mb-4">
              <AnimatePresence>
                {particleSeed && (
                  <motion.div
                    key={particleSeed}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0"
                  >
                    <ParticleField
                      keySeed={particleSeed}
                      type={particleSeed.split("-")[0]}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Move buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Player moves */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="font-semibold mb-2">Your Moves</div>
                <div className="flex flex-col gap-2">
                  {player?.moves.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => onPlayerMove(m)}
                      className="text-left bg-white hover:bg-gray-100 p-2 rounded-lg border flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500">
                          {m.type} • Power {m.power}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">Use</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info / Controls */}
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="font-semibold mb-2">Battle Controls</div>
                  <p className="text-sm text-gray-600 mb-2">
                    Click a move to perform it. Enemy will respond
                    automatically.
                  </p>
                  <div className="text-sm">
                    <div>
                      Player Speed: <strong>{player?.speed}</strong>
                    </div>
                    <div>
                      Enemy Speed: <strong>{enemy?.speed}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      // heal small amount as a demonstration (only allowed while battleActive)
                      if (!player) return;
                      setPlayer((p) =>
                        p ? { ...p, hp: Math.min(p.maxHp, p.hp + 8) } : p
                      );
                      setLog((l) => [
                        `${player.name} used a potion and healed 8 HP`,
                        ...l,
                      ]);
                    }}
                    className="px-3 py-2 rounded bg-blue-600 text-white"
                  >
                    Use Potion
                  </button>
                  <button
                    onClick={() => {
                      // surrender to enemy
                      if (!player || !enemy) return;
                      setPlayer((p) => (p ? { ...p, hp: 0 } : p));
                      setLog((l) => [`${player.name} surrendered.`, ...l]);
                      setBattleActive(false);
                    }}
                    className="px-3 py-2 rounded bg-red-500 text-white"
                  >
                    Surrender
                  </button>
                </div>
              </div>

              {/* Enemy moves log */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="font-semibold mb-2">Battle Log</div>
                <div className="h-44 overflow-auto space-y-2">
                  {log.length === 0 ? (
                    <div className="text-sm text-gray-500">No moves yet.</div>
                  ) : (
                    log.map((l, i) => (
                      <div
                        key={i}
                        className="text-sm bg-white p-2 rounded border"
                      >
                        {l}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Sound: {soundOn ? "On" : "Off"}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // quick heal during battle
                    if (!player) return;
                    setPlayer({ ...player, hp: player.maxHp });
                    setEnemy({ ...enemy, hp: enemy.maxHp });
                    setLog((p) => ["Both Pokémon healed to full!", ...p]);
                  }}
                  className="px-3 py-2 rounded bg-white border"
                >
                  Full Heal (debug)
                </button>
                <button
                  onClick={() => {
                    setBattleActive(false);
                    setMessage(
                      "Battle ended. Choose new setup or start again."
                    );
                  }}
                  className="px-3 py-2 rounded bg-white border"
                >
                  Exit Battle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Small footer / credits */}
        <footer className="mt-6 text-xs text-gray-500">
          This is a demo (type chart & damage formula are simplified). Audio is
          generated with the Web Audio API.
        </footer>
      </div>
    </div>
  );
};

export default PokemonBattle;
