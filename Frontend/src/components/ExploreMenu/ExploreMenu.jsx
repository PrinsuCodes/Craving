import React, { useContext } from 'react';
import './ExploreMenu.css';
import { StoreContext } from '../../Context/StoreContext.jsx';
import { assets } from '../../assets/assets.js';

const ExploreMenu = ({ category, setCategory }) => {
  const { menu_list, url } = useContext(StoreContext);
  // const effectiveMenuList = store?.menu_list?.length > 0 ? store.menu_list : fallbackMenuList;

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Explore our menu</h1>
      <p className='explore-menu-text'>
        Dive into our menu and discover a world of flavors. Whatever you are in the mood for, we have the perfect dish waiting for you
      </p>
      <div className="explore-menu-list">
        {menu_list.map((item, index) => (
          <div key={index} className="explore-menu-list-item" onClick={() => setCategory(prev => prev === item.menu_name ? "All" : item.menu_name)}>
            <img className={category === item.menu_name ? "active" : ""} src={url + "/image/" + item.menu_image} alt="" />
            <p>{item.menu_name}</p>
          </div>
        ))}
      </div>
      <hr />
    </div>
  )
}

export default ExploreMenu
