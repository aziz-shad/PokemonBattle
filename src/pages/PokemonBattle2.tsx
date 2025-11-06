import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

// ---- Pokémon Data (same as before) ----
const POKEMON_LIST: Pokemon[] = [
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
      { name: "Electro Ball", power: 80, type: "Electric" },
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
      { name: "Tackle", power: 40, type: "Normal" },
      { name: "Razor Leaf", power: 55, type: "Grass" },
      { name: "Sludge Bomb", power: 65, type: "Poison" },
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
      { name: "Flamethrower", power: 90, type: "Fire" },
      { name: "Scratch", power: 40, type: "Normal" },
      { name: "Ember", power: 60, type: "Fire" },
      { name: "Slash", power: 70, type: "Normal" },
    ],
  },
];

// ---- Utility ----
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

// ---- Sound helper ----
const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.volume = 0.5;
  audio.play();
};

const PokemonBattle2: React.FC = () => {
  const [player, setPlayer] = useState<Pokemon | null>(null);
  const [enemy, setEnemy] = useState<Pokemon | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("Choose your Pokémon!");
  const [attacking, setAttacking] = useState<string | null>(null);
  const [battleOver, setBattleOver] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  // ---- Load saved state ----
  useEffect(() => {
    const savedPokemon = localStorage.getItem("selectedPokemon");
    const savedScores = localStorage.getItem("pokemonScores");

    if (savedScores) setScores(JSON.parse(savedScores));

    if (savedPokemon) {
      const p = POKEMON_LIST.find((x) => x.name === savedPokemon);
      if (p) {
        setPlayer({ ...p });
        const enemy = POKEMON_LIST.filter((x) => x.name !== p.name);
        const randomEnemy = enemy[Math.floor(Math.random() * enemy.length)];
        setEnemy({ ...randomEnemy });
        setMessage(`A wild ${randomEnemy.name} appeared!`);
      }
    }
  }, []);

  // ---- Save scores persistently ----
  useEffect(() => {
    localStorage.setItem("pokemonScores", JSON.stringify(scores));
  }, [scores]);

  const handleChoosePokemon = (chosen: Pokemon) => {
    const enemies = POKEMON_LIST.filter((p) => p.name !== chosen.name);
    const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
    setPlayer({ ...chosen });
    setEnemy({ ...randomEnemy });
    setMessage(
      `You chose ${chosen.name}! A wild ${randomEnemy.name} appeared!`
    );
    localStorage.setItem("selectedPokemon", chosen.name);
    playSound("/sounds/start.mp3");
  };

  // ---- Battle Logic ----
  const calcDamage = (
    attacker: Pokemon,
    defender: Pokemon,
    move: Move
  ): number => {
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

    // ---- Check Winner ----
    if (newHP <= 0) {
      playSound("/sounds/faint.mp3");
      const winner = attacker.name;
      setMessage(`${defender.name} fainted! ${winner} wins!`);
      setBattleOver(true);

      // ✅ Update Score
      setScores((prev) => ({
        ...prev,
        [winner]: (prev[winner] || 0) + 1,
      }));
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

  // ---- Leaderboard sorted descending ----
  const sortedScores = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5

  // ---- Pokémon selection ----
  if (!player || !enemy) {
    return (
      <div className="p-6 flex flex-col items-center gap-6 min-h-screen bg-gradient-to-br from-blue-100 to-yellow-100">
        <h1 className="text-3xl font-bold">⚡ Choose Your Pokémon ⚔️</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {POKEMON_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => handleChoosePokemon(p)}
              className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-xl transition text-center"
            >
              <img src={p.sprite} alt={p.name} className="w-24 mx-auto" />
              <p className="font-semibold mt-2">{p.name}</p>
              <p className="text-sm text-gray-500">{p.type}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---- Battle screen with leaderboard ----
  return (
  <div className="flex flex-col sm:flex-row gap-6 p-6 min-h-screen text-white bg-gradient-to-b ">
    
    {/* Left: Battle Arena */}
    <div className="flex-1 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-1 text-yellow-400 text-shadow-lg">⚡ Pokémon Battle ⚔️</h1>
      <p className="text-gray-200 mb-4 text-center">{message}</p>

      {/* Pokémon Field */}
      <div className="flex justify-between w-full max-w-3xl mt-0">
        
        {/* Player */}
        <motion.div animate={attackAnimation(player.name)} className="flex flex-col items-center">
          <img src={player.sprite} alt={player.name} className="w-48 mb-2 drop-shadow-xl" />
          <div
            className="text-center mt-2 p-3 w-80"
            style={{
              borderRadius: '24px',
              borderWidth: '2px',
              borderColor: '#FFFFFF',          
              background: '#4E19A5', 
              color: '#FFFFFF',
              textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
            }}
          >
            <p className="font-bold text-lg mb-1">{player.name}</p>
            <p className="text-sm mb-2">HP: {player.hp}/{player.maxHp}</p>
            <div className="m-1">
              <HpBar hp={player.hp} maxHp={player.maxHp} />
            </div>
          </div>
        </motion.div>

        <div className="mt-12">
          <img src="/public/VS.png" alt="VS" />
        </div>

        {/* Enemy */}
        <motion.div animate={attackAnimation(enemy.name)} className="flex flex-col items-center">
          <img src={enemy.sprite} alt={enemy.name} className="w-48 mb-2 drop-shadow-xl" />
          <div
            className="text-center mt-2 p-3 w-80"
            style={{
              borderRadius: '24px',
              borderWidth: '2px',
              borderColor: '#FF0000', 
              background: 'linear-gradient(145deg, #2A1A1A, #1C0F0F)', 
              color: '#FFFFFF',
              textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
            }}
          >
            <p className="font-bold text-lg mb-1">{enemy.name}</p>
            <p className="text-sm mb-2">HP: {enemy.hp}/{enemy.maxHp}</p>
            <div className="m-1">
              <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Moves */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 w-full max-w-3xl">
        {player.moves.map((move) => (
          <button
            key={move.name}
            onClick={() => handlePlayerMove(move)}
            disabled={battleOver}
            className={` hover:brightness-100 hover:-translate-y-1 w-48 text-white text-lg font-bold transition-all duration-300 ${
              battleOver
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-700"
            }`}
            style={{
              borderColor: '#4EC307',
              borderRadius: '12px',
              borderWidth: '2px',
              backgroundColor: '#67EB00',
              height: '3rem',
              boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4)',
              textShadow: '1px 1px 5px rgba(0,0,0,0.6)',
            }}
          >
            {move.name}
          </button>
        ))}
      </div>

      {/* Reset Battle */}
      <button
        onClick={resetBattle}
        className="hover:brightness-100 hover:-translate-y-1 mt-4 px-5 py-2 rounded-xl font-semibold border-black bg-red-500"
      >
        Reset Battle
      </button>

      {/* Battle Log */}
      <div className="mt-1 w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-2 text-yellow-300">Battle Log</h3>
        <div className="bg-black p-3 rounded-xl h-48 overflow-auto border shadow-sm text-gray-200">
          {log.length === 0 ? (
            <p className="text-gray-400 italic">No moves yet.</p>
          ) : (
            log.map((entry, i) => (
              <p key={i} className="text-sm mb-1">{entry}</p>
            ))
          )}
        </div>
      </div>
    </div>

    {/* Right: Leaderboard (keep as-is) */}
    <div className="w-full sm:w-64 relative mt-8">
      <div className="absolute -top-1 scale-200 left-1/2 transform -translate-x-1/2 z-10">
        <img className="scale-150" src="/public/leader-board.png" alt="Leaderboard" />
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-5 h-fit mt-16">
        <h3 className="text-[1.5rem] font-bold mb-4 text-center text-purple-800 mt-14">
          🏆 Top Pokémon
        </h3>
        {sortedScores.length === 0 ? (
          <p className="text-center text-gray-400">No scores yet</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedScores.map(([name, score], i) => (
              <li
                key={name}
                className="flex justify-between py-2 text-gray-700 hover:bg-purple-50 px-3 rounded transition-colors"
              >
                <span className="font-medium">{i + 1}. {name}</span>
                <span className="font-semibold text-purple-800">{score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);
};

export default PokemonBattle2;
