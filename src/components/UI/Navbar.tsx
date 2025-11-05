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
    <div className="navbar text-white px-6" style={{ backgroundColor: '#6F53FD' }}>
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl m-9 text-purple-700 font-bold">
        <img className="max-w-40" src="/public/logo.png" alt="" />
          
        </Link>
      </div>
      <div className="flex-2">
        <div>
          
        </div>
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/battle">Battle 1</NavLink>
          </li>
          <li>
            <NavLink to="/battle2">Battle 2</NavLink>
          </li>
          {user && (
            <li>
              <NavLink to="/team">Team</NavLink>
            </li>
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

              <li>
                <button className="btn btn-primary" onClick={handelLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/register">Register</NavLink>
              </li>
              <li>
                <NavLink to="/login">Login</NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
