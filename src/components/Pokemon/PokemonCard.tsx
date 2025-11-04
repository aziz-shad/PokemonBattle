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
    <div className="card bg-base-100 shadow-xl">
      <figure className="bg-white h-48">
        <img src={image} alt={name} className="object-cover h-full w-full" />
      </figure>
      <div className="card-body h-56">
        <h2 className="card-title">{name}</h2>
        <h3>Type : {type}</h3>
        <Link to={`/pkdetail/${id}`} className="btn btn-primary mt-4">
          View details
        </Link>
        <Link to={url} className="btn btn-primary mt-4">
          View details Url
        </Link>
        <button onClick={addToTeam} className="btn btn-ghost">
          Add to Team
        </button>
      </div>
    </div>
  );
};

export default PokemonCard;
