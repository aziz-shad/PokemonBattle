import { useEffect, useState } from "react";
import { Link } from "react-router";

const PokemonCard = ({ name, url }: Pokemon) => {
  const [image, setImage] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    const fetchPokemon = async () => {
      const resposne = await fetch(url);
      if (!resposne.ok) throw new Error("Api response error");
      const data = await resposne.json();
      setImage(data.sprites.front_default);
      setType(data.types[0].type.name);
      setId(data.id);
    };
    fetchPokemon();
  }, []);

  const addToTeam = () => {
    //Will call an api to add this pokemon team, but need to check it should not alread be in team
    alert(
      `Provide functionality to this Button to make this pokemon ${id} a team member.`
    );
  };
  return (
    <div className=" hover:-translate-y-1 hover:scale-[1.02] card w-72 items-center justify-center bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-200"
    style={{
            padding: '1rem',
            margin: '1rem',
            flexDirection: 'column',
            borderRadius: '40px',
            border: '10px solid #E0BBFF',
            boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)',
          
          }}>
      <figure className=" from-base-200 to-base-100 h-48 flex items-center justify-center">
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

      <div className="card-body text-center p-4">
        <h2 className="card-title capitalize text-lg font-bold text-primary justify-center">
          {name}
        </h2>
        <h3 className="text-sm text-black">Type: {type}</h3>

        <div className="card-actions flex flex-col gap-2 mt-3">
          <Link
            to={`/pkdetail/${id}`}
            className="hover:brightness-100 hover:-translate-y-1 btn w-full text-white text-lg font-bold transition-all duration-300"
          style={{
            backgroundColor: '#D6AFFE',
            height: '3rem',
            borderColor: '#A75CF4',
            borderRadius: '12px',
            borderWidth: '2px',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4)',
            textShadow: '1px 1px 5px rgba(0,0,0,0.6)',
          }}
        >
            View details
          </Link>

          <Link
            to={url}
            className="hover:brightness-100 hover:-translate-y-1 btn w-full text-white text-lg font-bold transition-all duration-300"
          style={{
              borderColor: '#4EC307',
            borderRadius: '12px',
            borderWidth: '2px',
            backgroundColor: '#A6F208',
            height: '3rem',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4,)',
            textShadow: '1px 1px 5px rgba(0,0,0,0.6)',
          }}
        >
            View details Url
          </Link>

          <button onClick={addToTeam} 
          className="hover:brightness-100 hover:-translate-y-1 btn w-full text-white text-lg font-bold transition-all duration-300"
          style={{
              borderColor: '#DA57F0',
            borderRadius: '12px',
            borderWidth: '2px',
            backgroundColor: '#FDC0FF',
            height: '3rem',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4)',
            textShadow: '1px 1px 5px rgba(0,0,0,0.6)',
          }}
        >
            Add to Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;
