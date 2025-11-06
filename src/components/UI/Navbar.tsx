import { Link, NavLink, useNavigate } from "react-router";
import { useAuthContext } from "@/contexts";

const Navbar = () => {
  const { user, loading, logout } = useAuthContext();
  const navigate = useNavigate();

  const handelLogout = async () => {
    await logout();
    navigate("/");
  };
  return (
    <div className="navbar px-20 p-10 " style={{ backgroundColor: "#6F53FD" }}>
      {/* Left Section: Logo */}
      <div className="flex items-center flex-1">
        <Link to="/" className=" p-0">
          <img className="max-w-40" src="/public/logo.png" alt="Logo" />
        </Link>
      </div>
      <div className="flex-2">
        <div>
          
        </div>
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          {/* <li>
            <NavLink to="/battle">Battle 1</NavLink>
          </li> */}
          {user && (
            <>
              <li>
                <NavLink to="/battle2">Battle Ground</NavLink>
              </li>
              <li>
                <NavLink to="/team">Team</NavLink>
              </li>
            </>
          )}
          {loading ? null : user ? (
            <>
              <li className="pointer-events-none">
                <span className="opacity-70 cursor-default">
                  {user.firstName
                    ? `Hi, ${user.firstName}`
                    : user.email.split("@")[0]}
                </span>
              </li>

      {/* Center Section: Navigation Links */}
      <div className="flex-2 flex justify-center">
  <ul className="menu menu-horizontal text-xl px-1 gap-4">
    <li>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `${isActive ? "text-yellow-300 font-semibold" : "text-white font-semibold"} px-3 py-1 rounded hover:bg-purple-700 transition-all`
        }
      >
        Home
      </NavLink>
    </li>
    <li>
      <NavLink
        to="/battle"
        className={({ isActive }) =>
          `${isActive ? "text-yellow-300 font-semibold" : "text-white font-semibold"} px-3 py-1 rounded hover:bg-purple-700 transition-all`
        }
      >
        💥 Battle 1
      </NavLink>
    </li>
    <li>
      <NavLink
        to="/battle2"
        className={({ isActive }) =>
          `${isActive ? "text-yellow-300 font-semibold" : "text-white font-semibold"} px-3 py-1 rounded hover:bg-purple-700 transition-all`
        }
      >
        💥 Battle 2
      </NavLink>
    </li>
    {user && (
      <li>
        <NavLink
          to="/team"
          className={({ isActive }) =>
            `${isActive ? "text-yellow-300 font-semibold" : "text-white font-semibold"} px-3 py-1 rounded hover:bg-purple-700 transition-all`
          }
        >
          Team
        </NavLink>
      </li>
    )}
  </ul>
</div>


      {/* Right Section: Auth */}
      <div className="flex items-center text-xl  flex-1 justify-end gap-4">
        {!loading && !user && (
          <>
            <NavLink
              to="/register"
              className="text-white font-semibold px-3 py-1 rounded hover:bg-purple-700 transition-all"
            >
              Register
            </NavLink>
            <NavLink
              to="/login"
              className="text-white font-semibold px-3 py-1 rounded hover:bg-purple-700 transition-all"
            >
              Login
            </NavLink>
          </>
        )}

        {!loading && user && (
          <>
            <span className="text-white opacity-80">
              Hi, {user.firstName ? user.firstName : user.email.split("@")[0]}
            </span>
            <button
              className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-1 rounded transition-all"
              onClick={handelLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;