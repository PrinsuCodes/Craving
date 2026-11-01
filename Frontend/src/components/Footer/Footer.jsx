import React from 'react'
import './Footer.css'
import {assets} from "../../assets/assets.js"

const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
            <b className='img-logo'>Craving</b>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio corporis quia quam laborum fuga error ipsa eveniet ipsum dolore ratione hic accusantium obcaecati quaerat culpa totam quibusdam, aliquid voluptatem cupiditate.</p>
            <div className="footer-social-icons">
                <img src={assets.facebook_icon} alt="" onClick={() => window.open('https://www.facebook.com/', '_blank')}/>
                <img src={assets.twitter_icon} alt="" onClick={() => window.open('https://x.com', '_blank')}/>
                <img src={assets.linkedin_icon} alt="" onClick={() => window.open('https://www.linkedin.com', '_blank')}/>
            </div>
        </div>

        <div className="footer-content-center">
            <h2>COMPANY</h2>
            <ul>
                <li>Home</li>
                <li>About us</li>
                <li>Delivery</li>
                <li>Privacy Policy</li>
            </ul>
        </div>

        <div className="footer-content-right">
            <h2>GET IN TOUCH</h2>
            <ul>
                <li>+91-1234-5678</li>
                <li>contact@craving.com</li>
            </ul>
        </div>

      </div>
      <hr />
      <p className="footer-copyright">Copyright 2026  © craving.com - All Right Reserved.</p>
    </div>
  )
}

export default Footer
