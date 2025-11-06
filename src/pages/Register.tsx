import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "react-toastify";
import { useAuthContext } from "@/contexts";
import { div } from "framer-motion/client";

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const AUTH_URL = import.meta.env.VITE_APP_AUTH_SERVER_URL as string | undefined;

if (!AUTH_URL) {
  throw new Error(
    "AUTH URL is required, are you missing VITE_APP_AUTH_SERVER_URL in .env?"
  );
}

const baseAuthURL = `${AUTH_URL}/auth`;

const Register = () => {
  const { setUser } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [{ firstName, lastName, email, password, confirmPassword }, setForm] =
    useState<RegisterFormState>({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!firstName || !lastName || !email || !password || !confirmPassword)
        throw new Error("All fields are required");
      if (password !== confirmPassword)
        throw new Error("Passwords do not match");
      setLoading(true);

      // TODO: Implement registration logic
      const res = await fetch(`${baseAuthURL}/register`, {
        method: "POST",
        credentials: "include", // important for cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
        }),
      });

      if (!res.ok) {
        let message = "Registration failed";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      const data = await res.json();
      // data.user: { id, email, firstName, lastName, roles }
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          roles: data.user.roles,
        });
      }
      toast.success("Registration successful!");
      navigate("/");
    } catch (error: unknown) {
      const message = (error as { message: string }).message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
  className="min-h-screen -mt-30  items-center justify-center mx-auto flex flex-col  rounded-2xl text-white"
  onSubmit={handleSubmit}
>
  <div className="grid grid-cols-1 md:grid-cols-2 ">
    {/* Image Side */}
    <div className="flex justify-center items-center scale-200">
      <img src="/public/login.png" alt="Login" className="w-48 md:w-66" />
    </div>

    {/* Inputs Side */}
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <label className="grow flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-pink-500 bg-purple-700 focus-within:border-yellow-300 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            name="firstName"
            value={firstName}
            onChange={handleChange}
            className="grow bg-transparent outline-none placeholder-gray-300 text-white"
            placeholder="First name"
          />
        </label>
        <label className="grow flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-pink-500 bg-purple-700 focus-within:border-yellow-300 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            name="lastName"
            value={lastName}
            onChange={handleChange}
            className="grow bg-transparent outline-none placeholder-gray-300 text-white"
            placeholder="Last name"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-pink-500 bg-purple-700 focus-within:border-yellow-300 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
          <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
          <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
        </svg>
        <input
          name="email"
          value={email}
          onChange={handleChange}
          type="email"
          className="grow bg-transparent outline-none placeholder-gray-300 text-white"
          placeholder="Email"
        />
      </label>

      <div className="flex gap-2">
        <label className="grow flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-pink-500 bg-purple-700 focus-within:border-yellow-300 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
          </svg>
          <input
            name="password"
            value={password}
            onChange={handleChange}
            type="password"
            className="grow bg-transparent outline-none placeholder-gray-300 text-white"
            placeholder="Password"
          />
        </label>
        <label className="grow flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-pink-500 bg-purple-700 focus-within:border-yellow-300 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-70">
            <path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" />
          </svg>
          <input
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            type="password"
            className="grow bg-transparent outline-none placeholder-gray-300 text-white"
            placeholder="Confirm your password..."
          />
        </label>
      </div>

      <small className="text-gray-300">
        Already have an account?{" "}
        <Link to="/login" className="text-yellow-300 hover:underline">
          Log in!
        </Link>
      </small>

      <button
        className="hover:brightness-100 hover:-translate-y-1 btn w-full text-white text-lg font-bold transition-all duration-300"
        style={{ 
          borderColor: '#4EC307',
            borderRadius: '12px',
            borderWidth: '2px',
            backgroundColor: '#A6F208',
            height: '2.5rem',
            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.4,)',
            textShadow: '1px 1px 5px rgba(0,0,0,0.6)', }}
        disabled={loading}
      >
        Create Account
      </button>
    </div>
  </div>
</form>

  );
};

export default Register;
