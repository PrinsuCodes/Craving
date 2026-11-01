import React from 'react'
import './AppDownload.css'
import { assets } from '../../assets/assets'

const AppDownload = () => {
  return (
    <div className='app-download' id='app-download'>
      <p>For Better Experience Download <br /> Craving App</p>
      <div className="app-download-plateform">
        <img src={assets.play_store} alt="" onClick={() => window.open('https://play.google.com/store/apps', '_blank')} />
        <img src={assets.app_store} alt="" onClick={() => window.open('https://www.apple.com/app-store/', '_blank')} />
      </div>
    </div>
  )
}

export default AppDownload
