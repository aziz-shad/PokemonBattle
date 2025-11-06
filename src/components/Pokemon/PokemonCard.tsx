import { useEffect, useState } from "react";
import { Link } from "react-router";
import { addToTeam } from "@/data";
import { useAuthContext } from "@/contexts";
import { toast } from "react-toastify";

const PokemonCard = ({ name, url }: PokemonInput) => {
  const { user } = useAuthContext();

  const [image, setImage] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [id, setId] = useState<number | null>(null);
  const [pokemon, setPokemon] = useState<PokemonInput | {}>({});

  useEffect(() => {
    const fetchPokemon = async () => {
      const resposne = await fetch(url);
      if (!resposne.ok) throw new Error("Api response error");
      const data = await resposne.json();
      setImage(data.sprites.front_default);
      setType(data.types[0].type.name);
      setId(data.id);
      setPokemon({
        userId: user?.id,
        id: data.id,
        name: name,
        type: data.types[0].type.name,
        sprites: data.sprites.front_default,
        height: data.height,
        weight: data.weight,
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        specialattack: data.stats[3].base_stat,
        specialdefence: data.stats[4].base_stat,
        speed: data.stats[5].base_stat,
        //abilities: string[];
      });
    };
    fetchPokemon();
  }, []);

  const savePokemon = async () => {
    //Will call an api to add this pokemon team, but need to check it should not alread be in team
    if (!user) {
      alert(`Please login to make this pokemon as a team member.`);
      return;
    }
    console.log("Pokemon to Save : ", pokemon);
    try {
      await addToTeam(pokemon);
      toast.success("Sucssfully added to team");
    } catch (error: any) {
      if (error.status === 409) {
        toast.error("This Pokémon is already in your team ⚠️");
      } else {
        toast.error("Something went wrong. Please try again ❌");
      }
    }
  };
  return (
    <div className=" hover:-translate-y-1 hover:scale-[1.02] card h-100 w-72 items-center justify-center bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-200"
    style={{
            padding: '1rem',
            margin: '1rem',
            flexDirection: 'column',
            borderRadius: '40px',
            border: '5px solid #E0BBFF',
            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)',
            height: '23rem',          
          }}>
    

      <div className="card-body text-center p-4">
        <h2 className="mt-8 card-title text-purple-800 capitalize text-xl font-g font-bold text-primary justify-center">
          {name}
        </h2>
          <figure className=" from-base-200 to-base-100 h-30 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={name}
            className="object-contain  h-40 w-40 transition-transform duration-300 hover:scale-110 drop-shadow-md"
          />
        ) : (
          <div className="skeleton w-24 h-24"></div>
        )}
      </figure>
        <h3 className="text-sm text-black">Type: {type}</h3>

        <div className="">
          <div className="m-3 flex flex-col gap-2">
             <Link
            to={`/pkdetail/${id}`}
            className="hover:brightness-100 hover:-translate-y-1 btn w-full text-white text-lg font-bold transition-all duration-300"
          style={{
            backgroundColor: '#FDC0FF',
            height: '2.5rem',
            borderColor: '#DA57F0',
            borderRadius: '12px',
            borderWidth: '2px',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4)',
            textShadow: '1px 1px 5px rgba(0,0,0,0.6)',
          }}
        >
            View Details
          </Link>

               <button onClick={addToTeam} 
          className="hover:brightness-100 hover:-translate-y-1 btn w-full text-white text-lg font-bold transition-all duration-300"
          style={{
               borderColor: '#4EC307',
            borderRadius: '12px',
            borderWidth: '2px',
            backgroundColor: '#A6F208',
            height: '2.5rem',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4,)',
            textShadow: '1px 1px 5px rgba(0,0,0,0.6)',
          }}
        >
            Add to Team
          </button>

          </div>
         
          <Link
            to={url}
            className="hover:brightness-100 hover:-translate-y-1 btn w-full text-white text-lg font-bold transition-all duration-300"
          style={{
              borderColor: '#4EC307',
            borderRadius: '12px',
            borderWidth: '2px',
            backgroundColor: '#A6F208',
            height: '2.5rem',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4,)',
            textShadow: '1px 1px 5px rgba(0,0,0,0.6)',
          }}
        >
            View details Url
          </Link>

     
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;
