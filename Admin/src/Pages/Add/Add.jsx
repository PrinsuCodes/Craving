import React, { useState, useEffect } from 'react';
import './Add.css';
import { assets } from '../../assets/assets';
import axios from "axios";
import { toast } from "react-toastify";

const STATIC_CATEGORIES = [
  "Salad",
  "Rolls",
  "Desserts",
  "Sandwich",
  "Cake",
  "Pure Veg",
  "Pasta",
  "Noodles",
];

const Add = ({ url }) => {
  const [image, setImage] = useState(false);
  const [categories, setCategories] = useState(STATIC_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad",
  });

  // Fetch any existing custom categories from food list so they appear in options
  useEffect(() => {
    let isMounted = true;
    const fetchExistingCategories = async () => {
      try {
        const response = await axios.get(`${url}/api/food/list`);
        if (isMounted && response.data?.success && Array.isArray(response.data.data)) {
          const fetchedCategories = response.data.data
            .map((item) => item.category)
            .filter((cat) => Boolean(cat && typeof cat === 'string' && cat.trim()));

          setCategories((prev) => {
            const merged = [...prev];
            fetchedCategories.forEach((cat) => {
              const trimmed = cat.trim();
              if (!merged.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
                merged.push(trimmed);
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.warn("Could not load categories from food list:", error.message);
      }
    };

    fetchExistingCategories();
    return () => {
      isMounted = false;
    };
  }, [url]);

  const onchangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onCategoryChange = (event) => {
    const value = event.target.value;
    setData((prev) => ({ ...prev, category: value }));
    if (value !== "New Category") {
      setNewCategory("");
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!image) {
      toast.error("Please upload a product image");
      return;
    }

    let finalCategory = data.category;
    if (data.category === "New Category") {
      const trimmedNew = newCategory.trim();
      if (!trimmedNew) {
        toast.error("Please enter the new category name");
        return;
      }
      finalCategory = trimmedNew;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", data.price);
    formData.append("category", finalCategory);
    formData.append("image", image);

    try {
      const response = await axios.post(`${url}/api/food/add`, formData);
      if (response.data.success) {
        toast.success(response.data.message);

        // Add newly created category to options list if not already present
        setCategories((prev) => {
          if (!prev.some((c) => c.toLowerCase() === finalCategory.toLowerCase())) {
            return [...prev, finalCategory];
          }
          return prev;
        });

        // Reset form and select the category of the newly added item
        setData({
          name: "",
          description: "",
          price: "",
          category: finalCategory,
        });
        setImage(false);
        setNewCategory("");

        const fileInput = document.getElementById("image");
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        toast.error(response.data.message || "Failed to add food item");
      }
    } catch (error) {
      console.error("Error adding food:", error);
      toast.error("Network error while adding food item");
    }
  };

  return (
    <div className='add'>
      <form className='flex-col' onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload image</p>
          <label htmlFor="image">
            <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="Upload preview" />
          </label>
          <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' hidden required />
        </div>

        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input
            onChange={onchangeHandler}
            type="text"
            name='name'
            value={data.name}
            placeholder='Type here'
            required
          />
        </div>

        <div className="add-product-description">
          <p>Product Description</p>
          <textarea
            onChange={onchangeHandler}
            name="description"
            value={data.description}
            rows="6"
            placeholder='Write description here'
            required
          ></textarea>
        </div>

        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Product category</p>
            <select
              onChange={onCategoryChange}
              name='category'
              value={data.category}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="New Category">+ New Category</option>
            </select>
          </div>

          {data.category === "New Category" && (
            <div className="add-new-category flex-col">
              <p>New Category Name</p>
              <input
                type="text"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <div className="add-price flex-col">
            <p>Product Price</p>
            <input
              onChange={onchangeHandler}
              value={data.price}
              type="Number"
              name='price'
              placeholder='$100'
              required
            />
          </div>
        </div>

        <button type='submit' className='add-btn'>ADD</button>
      </form>
    </div>
  );
};

export default Add;
