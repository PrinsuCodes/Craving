import React, { useState } from 'react'
import './Home.css'
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import AppDownload from '../../components/AppDownload/AppDownload';
import TrustBar from '../../components/TrustBar/TrustBar';

const Home = () => {

  const [category, setCategory] = useState("All");

  return (
    <div>
      <Header />
      <TrustBar />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category} />
      <AppDownload />
    </div>
  )
}

export default Home
