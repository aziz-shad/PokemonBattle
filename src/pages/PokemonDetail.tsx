import { useState, useEffect } from "react";
import { useParams } from "react-router";


interface StatInfo {
  name: string;
  url: string;
}

interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: StatInfo;
}

interface AbilityInfo {
  name: string;
  url: string;
}

interface PokemonAbility {
  ability: AbilityInfo;
  is_hidden: boolean;
  slot: number;
}

interface PokemonData {
  stats: PokemonStat[];
  abilities: PokemonAbility[];
}

const PokemonDetail = () => {
  const { id } = useParams();
  console.log("Passed Id: ", id);
  const [pokimonName, setPokimonName] = useState<string | undefined>(undefined);
  const [pokimonType, setPokimonType] = useState<string | undefined>(undefined);
  //const [weakneses, setWeakneses] = useState<string | undefined>(undefined);
  //const [stats, setStats] = useState<PokemonStat[]>([]); //stats[0].stat.name --> hp,attack
  //const [abilites, setAbilites] = useState<string[] | []>([]);
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [pokimonImage, setPokimonImage] = useState<string | undefined>(
    undefined
  );
  const [pokemon, setPokemon] = useState<PokemonData>({
    stats: [],
    abilities: [],
  });

  useEffect(() => {
    const pokemon_detail = async () => {
      const uri = `https://pokeapi.co/api/v2/pokemon/${id}/`;
      console.log("API : ", uri);
      const response = await fetch(uri);
      if (!response.ok) throw new Error("Error while fetching pokemon details");
      const data = await response.json();
      setPokimonName(data.name);
      setPokimonImage(data.sprites.front_default);
      setPokimonType(data.types[0].type.name);
      //setStats(data.stats);
      //setAbilites(data.abilites);
      setHeight(data.height);
      setWeight(data.weight);
      setPokemon({ stats: data.stats, abilities: data.abilities });
    };
    pokemon_detail();
  }, [id]);

  // const showModal = () => {
  //   document.getElementById("pokemon_detail").showModal();
  // };

  const handelClose = () => {
    document.getElementById("pokemon_detail").close();
  };

return (
  <div className="flex flex-row gap-10 p-10">
    
    <div className="hover:-translate-y-1 hover:scale-[1.02] card h-100  justify-center bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-200 flex flex-col items-center w-1/3 text-purple-800"
    style={{
            
            flexDirection: 'column',
            borderRadius: '40px',
            border: '5px solid #E0BBFF',
            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)',
            height: '23rem',          
          }}>
      <h3 className=" capitalize text-5xl font-bold mb-4 tracking-wide">
        {pokimonName}
      </h3>
      {pokimonImage ? (
        <img
          src={pokimonImage}
          alt={pokimonName}
          className="object-contain h-48 w-48 drop-shadow-lg transition-transform duration-300 hover:scale-110"
        />
      ) : (
        <div className="skeleton w-32 h-32"></div>
      )}
      <div>
     <span
  className="text-lg text-black font-medium px-4 py-1 rounded-full capitalize"
  style={{
    
    
  }}
>
  {pokimonType}
</span>
      </div>
    </div>

   
    <div className="flex flex-col w-2/3 gap-6 bg-[#FFF2A9] p-6 rounded-3xl shadow-lg">
    
      <div className="bg-white border-[#FFB213] border-2 rounded-2xl p-5 shadow-inner text-gray-800 flex gap-8 justify-around">
        <p className="text-center">
          <span className="font-semibold text-purple-800">Height:</span> {height}
        </p>
        <p className="text-center">
          <span className="font-semibold text-purple-800">Weight:</span> {weight}
        </p>
      </div>

   
      <div>
        <h4 className="text-xl font-semibold text-purple-800 mb-2">Stats</h4>
        <ul className="bg-white rounded-2xl border-2 p-4 grid grid-cols-2 gap-3 border border-[#E0BBFF]">
          {pokemon.stats.map((item, index) => (
            <li
              key={index}
              className="flex justify-between text-gray-700 font-medium capitalize px-3 py-1 rounded hover:bg-purple-50 transition-colors"
            >
              <span>{item.stat.name}</span>
              <span>{item.base_stat}</span>
            </li>
          ))}
        </ul>
      </div>

   
      <div>
        <h4 className="text-xl font-semibold text-purple-800 mb-2">Abilities</h4>
        <ul className="bg-white rounded-2xl p-4 border-2 space-y-2 border border-[#A6F208]">
          {pokemon.abilities.map((ability) => (
            <li
              key={ability.ability.name}
              className="text-gray-800 capitalize font-medium px-3 py-1 rounded hover:bg-green-50 transition-colors"
            >
              {ability.ability.name}{" "}
              {ability.is_hidden && <span className="text-xs text-gray-500">(Hidden)</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex justify-start">
        <button
          className="hover:brightness-100 hover:-translate-y-1 w-48 text-white text-lg font-bold transition-all duration-300"
          style={{
            backgroundColor: "#FDC0FF",
            height: "2.8rem",
            borderColor: "#DA57F0",
            borderRadius: "14px",
            borderWidth: "2px",
            boxShadow: "0 2px 2px rgba(0, 0, 0, 0.4)",
            textShadow: "1px 1px 5px rgba(0,0,0,0.6)",
          }}
    onClick={() => window.location.href = "/"}
        >
          Back to List
        </button>
      </div>
    </div>

    
    <dialog id="pokemon_detail" className="modal">
      <div className="modal-box bg-white rounded-2xl shadow-lg border border-[#E0BBFF]">
        <h3 className="font-semibold text-lg mb-3 text-purple-800">{pokimonName}</h3>
        <h4 className="text-sm text-gray-600 mb-4">{pokimonType}</h4>

        <div className="p-4 grid grid-cols-2 gap-3 items-center">
          <img
            src={pokimonImage}
            alt={pokimonName}
            className="rounded-lg h-full w-full object-contain shadow-md"
          />
          <div>
            <p className="text-gray-700 text-sm">
              [Placeholder for additional details if found.]
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5">
          <span className="text-xs text-gray-500">Press escape to go back</span>
          <button
            className="px-4 py-2 bg-[#FDC0FF] text-white rounded-lg hover:bg-[#DA57F0] transition-all duration-300"
            onClick={handelClose}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  </div>
);
};
export default PokemonDetail;
