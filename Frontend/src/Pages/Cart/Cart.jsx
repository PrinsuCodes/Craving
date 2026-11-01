import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom';
import {toast} from 'react-toastify'


const Cart = () => {

    const {cartItems,food_list,removeFromCart,getTotalCartAmount,url} = useContext(StoreContext);
    const navigate = useNavigate();

    // console.log("Cart Items:", cartItems);
    // console.log("Food List:", food_list);

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
            <p>Items</p>
            <p>Title</p>
            <p>Price</p>
            <p>Quantity</p>
            <p>Total</p>
            <p>Remove</p>
        </div>
        <br></br>
        <hr></hr>

        {food_list.map((item)=>{
            if(cartItems[item._id] > 0){
                return (
                    <div key={item._id}>
                        <div className='cart-items-title cart-items-item'>
                            {/* src={url + "/images/" + item.image} */}
                            <img src={url+"/image/"+item.image} alt="" />
                            <p>{item.name}</p>
                            <p>{item.price}</p>
                            <p>{cartItems[item._id]}</p>
                            <p>${item.price * cartItems[item._id]}</p>
                            <p onClick={()=>removeFromCart(item._id)} className='cross'>X</p>
                        </div>
                        <hr />
                    </div>
                );
            }
            return null; // Return null if the item is not in the cart
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
            <h2>Cart Totals</h2>
            <div>
                <div className="cart-total-details">
                    <p>Subtotal</p>
                    <p>${getTotalCartAmount()}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                    <p>Delivery Fee</p>
                    <p>${getTotalCartAmount()===0?0:2}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                    <b>Total</b>
                    <b>${getTotalCartAmount()===0?0:getTotalCartAmount()+2}</b>
                </div>
            </div>
            <button onClick={()=> (getTotalCartAmount()===0?toast.warning("cart is empty"):navigate('/order'))}>PROCEED TO CHECKOUT</button>
        </div>
        <div className="cart-promocode">
            <div>
                <p>If you have a promo code, enter it here</p>
                <div className="cart-promocart-input">
                    <input type="text" placeholder='Promo-code' />
                    <button>Submit</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
