import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PokemonCard } from "@/components";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await fetch(
          "https://pokeapi.co/api/v2/pokemon?limit=20"
        );
        if (!response.ok) throw new Error("Fetch api response error");
        const data = await response.json();

        setPokemons(data.results);
      } catch (error: unknown) {
        const message = (error as { message: string }).message;
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchPokemon();
  }, []);

  if (loading) return <div>Loading</div>;
  return (
    <div className=" grid grid-cols-1 lg:grid-cols-4 gap-10 m-10  ">
      {pokemons.map((pokemon) => (
        <PokemonCard key={pokemon.name} name={pokemon.name} url={pokemon.url} />
      ))}
    </div>
  );
};

export default Home;
