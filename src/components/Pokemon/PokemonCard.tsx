import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts";

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
  const { user } = useAuthContext();

  const addToTeam = async () => {
    if (!user) {
      alert("You must log in to add Pokémon to your team!");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/pokemon/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          id,
          name,
          type,
          image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add Pokémon");
        return;
      }

      alert(`✅ ${name} added to your team!`);
    } catch (error) {
      console.error("Error adding to team:", error);
      alert("Error adding Pokémon to team.");
    }
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
