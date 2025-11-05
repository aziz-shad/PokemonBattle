import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthContext } from "@/contexts";

type Move = {
  name: string;
  power: number;
  type: string;
};

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

const typeEffectiveness = (
  attackType: string,
  defenderType: string
): number => {
  const chart: Record<string, Record<string, number>> = {
    Electric: { Water: 2, Grass: 0.5 },
    Grass: { Water: 2, Fire: 0.5 },
    Fire: { Grass: 2, Water: 0.5 },
    Water: { Fire: 2, Grass: 0.5 },
  };
  return chart[attackType]?.[defenderType] ?? 1;
};

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.volume = 0.5;
  audio.play();
};

const PokemonBattle2: React.FC = () => {
  const { user } = useAuthContext();
  const [userPokemon, setUserPokemon] = useState<Pokemon[]>([]);
  const [player, setPlayer] = useState<Pokemon | null>(null);
  const [enemy, setEnemy] = useState<Pokemon | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("Choose your Pokémon!");
  const [attacking, setAttacking] = useState<string | null>(null);
  const [battleOver, setBattleOver] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  // ---- Fetch user Pokémon ----
  useEffect(() => {
    if (!user?.id) return;
    const fetchPokemon = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/pokemon/${user.id}`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch Pokémon");
        const data: Pokemon[] = await res.json();
        setUserPokemon(data);
      } catch (err) {
        console.error(err);
        setUserPokemon([]);
      }
    };
    fetchPokemon();
  }, [user]);

  // ---- Load saved scores ----
  useEffect(() => {
    const savedScores = localStorage.getItem("pokemonScores");
    if (savedScores) setScores(JSON.parse(savedScores));
  }, []);

  useEffect(() => {
    localStorage.setItem("pokemonScores", JSON.stringify(scores));
  }, [scores]);

  // ---- Choose player Pokémon ----
  const handleChoosePokemon = (chosen: Pokemon) => {
    const enemies = userPokemon.filter((p) => p.id !== chosen.id);
    const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
    setPlayer({ ...chosen });
    setEnemy(randomEnemy ? { ...randomEnemy } : null);
    setMessage(
      `You chose ${chosen.name}! A wild ${randomEnemy?.name || "???"} appeared!`
    );
    playSound("/sounds/start.mp3");
  };

  // ---- Battle Logic ----
  const calcDamage = (attacker: Pokemon, defender: Pokemon, move: Move) => {
    let baseDamage = move.power + attacker.attack - defender.defense;
    baseDamage = Math.max(baseDamage, 1);
    const eff = typeEffectiveness(move.type, defender.type);
    return Math.floor(baseDamage * eff);
  };

  const attack = (
    attacker: Pokemon,
    defender: Pokemon,
    setDefender: React.Dispatch<React.SetStateAction<Pokemon>>,
    move: Move
  ) => {
    if (battleOver) return;
    setAttacking(attacker.name);
    playSound("/sounds/attack.mp3");
    setTimeout(() => setAttacking(null), 400);

    const damage = calcDamage(attacker, defender, move);
    const newHP = Math.max(defender.hp - damage, 0);
    setDefender({ ...defender, hp: newHP });

    const eff = typeEffectiveness(move.type, defender.type);
    let text = `${attacker.name} used ${move.name}!`;
    if (eff > 1) text += " It’s super effective!";
    else if (eff < 1) text += " It’s not very effective.";
    text += ` (${damage} damage)`;

    setLog((prev) => [text, ...prev]);
    setMessage(text);

    if (newHP <= 0) {
      playSound("/sounds/faint.mp3");
      const winner = attacker.name;
      setMessage(`${defender.name} fainted! ${winner} wins!`);
      setBattleOver(true);
      setScores((prev) => ({ ...prev, [winner]: (prev[winner] || 0) + 1 }));
    }
  };

  const handlePlayerMove = (move: Move) => {
    if (!player || !enemy || battleOver) return;

    if (player.speed >= enemy.speed) {
      attack(player, enemy, setEnemy, move);
      setTimeout(() => {
        if (enemy.hp > 0) {
          const enemyMove =
            enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
          attack(enemy, player, setPlayer, enemyMove);
        }
      }, 1000);
    } else {
      const enemyMove =
        enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
      attack(enemy, player, setPlayer, enemyMove);
      setTimeout(() => {
        if (player.hp > 0) attack(player, enemy, setEnemy, move);
      }, 1000);
    }
  };

  const resetBattle = () => {
    if (player) setPlayer({ ...player, hp: player.maxHp });
    if (enemy) setEnemy({ ...enemy, hp: enemy.maxHp });
    setBattleOver(false);
    setLog([]);
    setMessage("Battle restarted!");
  };

  const HpBar: React.FC<{ hp: number; maxHp: number }> = ({ hp, maxHp }) => {
    const percent = (hp / maxHp) * 100;
    const color =
      percent > 60
        ? "bg-green-500"
        : percent > 30
        ? "bg-yellow-400"
        : "bg-red-500";
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div
          className={`${color} h-2.5 rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  const attackAnimation = (name: string) => ({
    x: attacking === name ? [0, name === player?.name ? 50 : -50, 0] : 0,
    transition: { duration: 0.4, ease: "easeInOut" },
  });

  const sortedScores = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ---- Pokémon selection ----
  if (!player || !enemy) {
    return (
      <div className="p-6 flex flex-col items-center gap-6 min-h-screen bg-gradient-to-br from-blue-100 to-yellow-100">
        <h1 className="text-3xl font-bold">⚡ Choose Your Pokémon ⚔️</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {userPokemon.length === 0 ? (
            <p>Loading your Pokémon...</p>
          ) : (
            userPokemon.map((p) => (
              <button
                key={p.id}
                onClick={() => handleChoosePokemon(p)}
                className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-xl transition text-center"
              >
                <img src={p.sprite} alt={p.name} className="w-24 mx-auto" />
                <p className="font-semibold mt-2">{p.name}</p>
                <p className="text-sm text-gray-500">{p.type}</p>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ---- Battle screen ----
  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 min-h-screen bg-gradient-to-br from-blue-100 to-yellow-100">
      {/* Left: Battle Arena */}
      <div className="flex-1 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2">⚡ Pokémon Battle ⚔️</h1>
        <p className="text-gray-600 mb-4 text-center">{message}</p>

        {/* Pokémon Field */}
        <div className="flex justify-between w-full max-w-3xl mt-4">
          <motion.div
            animate={attackAnimation(player.name)}
            className="flex flex-col items-center"
          >
            <img src={player.sprite} alt={player.name} className="w-28" />
            <div className="text-center mt-2 bg-white shadow p-2 rounded-xl w-40">
              <p className="font-semibold">{player.name}</p>
              <p className="text-sm text-gray-600">
                HP: {player.hp}/{player.maxHp}
              </p>
              <HpBar hp={player.hp} maxHp={player.maxHp} />
            </div>
          </motion.div>

          <motion.div
            animate={attackAnimation(enemy.name)}
            className="flex flex-col items-center"
          >
            <img src={enemy.sprite} alt={enemy.name} className="w-28" />
            <div className="text-center mt-2 bg-white shadow p-2 rounded-xl w-40">
              <p className="font-semibold">{enemy.name}</p>
              <p className="text-sm text-gray-600">
                HP: {enemy.hp}/{enemy.maxHp}
              </p>
              <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
            </div>
          </motion.div>
        </div>

        {/* Moves */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {player.moves.map((move) => (
            <button
              key={move.name}
              onClick={() => handlePlayerMove(move)}
              disabled={battleOver}
              className={`px-4 py-2 rounded-xl text-white font-semibold shadow transition-all ${
                battleOver
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {move.name}
            </button>
          ))}
        </div>

        <button
          onClick={resetBattle}
          className="mt-4 px-5 py-2 rounded-xl font-semibold border border-gray-400 hover:bg-gray-100"
        >
          Reset Battle
        </button>

        {/* Battle Log */}
        <div className="mt-6 w-full max-w-3xl">
          <h3 className="text-lg font-semibold mb-2">Battle Log</h3>
          <div className="bg-white p-3 rounded-xl h-48 overflow-auto border shadow-sm">
            {log.length === 0 ? (
              <p className="text-gray-500 italic">No moves yet.</p>
            ) : (
              log.map((entry, i) => (
                <p key={i} className="text-sm mb-1">
                  {entry}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Leaderboard */}
      <div className="w-full sm:w-64 bg-white rounded-2xl shadow-md p-4 h-fit self-start">
        <h3 className="text-lg font-bold mb-3 text-center">🏆 Top Pokémon</h3>
        {sortedScores.length === 0 ? (
          <p className="text-center text-gray-500">No scores yet</p>
        ) : (
          <ul>
            {sortedScores.map(([name, score], i) => (
              <li
                key={name}
                className="flex justify-between border-b py-1 text-gray-700"
              >
                <span>
                  {i + 1}. {name}
                </span>
                <span className="font-semibold">{score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PokemonBattle2;
