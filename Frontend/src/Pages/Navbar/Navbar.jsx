import React, { useContext, useState } from 'react';
import './Navbar.css';
import { StoreContext } from '../../Context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const Navbar = ({ setShowLogin }) => {
    const [menu, setMenu] = useState("home");
    const [searchTerm, setSearchTerm] = useState("");
    const { getTotalCartAmount, token, setToken } = useContext(StoreContext);

    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        navigate("/");
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <div className='navbar'>
            <Link to='/'><b className='logo-img'>Craving</b></Link>
            <ul className='navbar-menu'>
                <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>Home</Link>
                <a href="#explore-menu" onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>Menu</a>
                <a href="#app-download" onClick={() => setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>Mobile-App</a>
                <a href="#footer" onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>Contact Us</a>
            </ul>

            <div className="navbar-right">
                <div className="navbar-search-container">
                    <form onSubmit={handleSearch} className='search-form'>
                        <input
                            type="text"
                            placeholder="Search food..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                            required
                        />
                        <img src={assets.search_icon} alt="search" onClick={handleSearch} className="search-submit-icon" />
                    </form>
                </div>
                <div className="navbar-search-icon">
                    <Link to='/cart'><img src={assets.basket_icon} alt='' /></Link>
                    <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
                </div>

                {!token ? (
                    <button onClick={() => setShowLogin(true)}>Sign in</button>
                ) : (
                    <div className='navbar-profile'>
                        <img src={assets.profile_icon} alt="" />
                        <ul className='nav-profile-dropdown'>
                            <li onClick={() => navigate('/myorders')}>
                                <img src={assets.bag_icon} alt="" /> <p>Orders</p>
                            </li>
                            <hr />
                            <li onClick={logout}>
                                <img src={assets.logout_icon} alt="" /> <p>Logout</p>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;
