import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { onFoodListUpdate } from "../services/socketService.js";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const [cartItems, setCartItems] = useState({});
    const url = "https://craving-backend.onrender.com";
    const [token, setToken] = useState("");
    const [food_list, setFoodList] = useState([]);
    const [menu_list, setMenuList] = useState([]);

    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        }
        else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }

        if (token) {
            try {
                await axios.post(`${url}/api/cart/add`, { itemId }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (error) {
                console.error("error adding to cart :", error);
            }
        }
    };

    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
        if (token) {
            try {
                await axios.post(`${url}/api/cart/remove`, { itemId }, { headers: { Authorization: `Bearer ${token}` } });
            } catch (error) {
                console.error("error removing from cart:", error);
            }
        }
    };

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                if (itemInfo) {
                    totalAmount += (itemInfo.price * cartItems[item]);
                }
            }
        }
        return totalAmount;
    };

    const fetchFoodList = async () => {
        try {
            const response = await axios.get(`${url}/api/food/list`);
            const foods = response.data?.data || [];
            setFoodList(foods);
        } catch (error) {
            console.log("error fetching food list", error);
        }
    };

    const fetchMenuList = async () => {
        try {
            const response = await axios.get(`${url}/api/food/categories`);
            if (response.data.data) {
                setMenuList(response.data.data);
            }
        } catch (error) {
            console.log("error fetching menu list", error);
        }
    };

    const loadcartData = async (token) => {
        try {
            const response = await axios.post(`${url}/api/cart/get`, {}, { headers: { Authorization: `Bearer ${token}` } });
            console.log(response.data)
            setCartItems(response.data.cartData);
        } catch (error) {
            console.error("error loading cart data:", error);
        }
    };

    useEffect(() => {
        async function loadData() {
            await fetchMenuList();
            await fetchFoodList();
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                setToken(storedToken);
                await loadcartData(storedToken);
            }
        }
        loadData();
    }, []);

    // Real-time synchronization when admin adds or removes food items
    useEffect(() => {
        const unsubscribe = onFoodListUpdate(async (data) => {
            console.log("[StoreContext] Real-time food update received:", data);
            await fetchFoodList();
            await fetchMenuList();
        });

        const handleFocus = async () => {
            await fetchFoodList();
            await fetchMenuList();
        };
        window.addEventListener("focus", handleFocus);

        return () => {
            unsubscribe();
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    const contextValue = {
        food_list,
        menu_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        fetchFoodList,
        fetchMenuList,
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;
