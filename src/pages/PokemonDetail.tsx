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
    <>
      <section className="">
        <h3 className="font-semibold text-lg mb-3 px-2 ">{pokimonName}</h3>
        <img src={pokimonImage} height={400} width={400} />
        <span className="bg-orange-400 pr-4 pl-4 text-2xl rounded-2xl">
          {pokimonType}
        </span>
      </section>
      <section className="">
        Height : {height}
        Weight : {weight}
        {/* {abilites.map((abilite) => {
          return <p>{abilite}</p>;
        })} */}
        {
          <>
            <h1>Stats</h1>
            <ul>
              {pokemon.stats.map((item, index) => (
                <li key={index} className="text-gray-700">
                  {item.stat.name}: {item.base_stat}
                </li>
              ))}
            </ul>
          </>
        }
      </section>
      <section>
        <h3>Abilities</h3>
        <ul>
          {pokemon.abilities.map((ability) => (
            <li key={ability.ability.name}>
              {ability.ability.name} {ability.is_hidden ? "(Hidden)" : ""}
            </li>
          ))}
        </ul>
      </section>
      {/* <button
        className=" mt-5 p-2 bg-[#4F342F] text-[#ECE2D1] rounded hover:bg-[#3e2723]"
        onClick={showModal}
      >
        View Details
      </button> */}
      <dialog id="pokemon_detail" className="modal">
        <div className="modal-box">
          <h3 className="font-semibold text-lg mb-3 px-2 bg-[#D6C2A7] pt-2 pb-2 rounded text-[#4F342F]">
            {pokimonName}
          </h3>
          <h4>{pokimonType}</h4>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <img
                src={pokimonImage}
                alt={pokimonName}
                className="border-1 border-gray-300 shadow-2xs rounded-lg h-full w-full object-cover"
              />
              <div className="col-span-1 text-left">
                <p className="mt-2 text-[#4F342F]">
                  [Place holder for any detail, if found.]
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-red-700">Press escape to go back</span>
              <button
                className="mt-5 px-4 py-2 bg-[#4F342F] text-white rounded hover:bg-[#3e2723]"
                onClick={handelClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default PokemonDetail;
