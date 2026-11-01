import React,{useContext, useEffect,useState} from 'react'
import './SearchResult.css'
import { useSearchParams } from 'react-router-dom';
import { StoreContext } from '../../Context/StoreContext';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import FoodItem from '../../components/FoodItem/FoodItem'


const SearchResult = () => {

  const {food_list} = useContext(StoreContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const query = searchParams.get('q') || '';
  const categoriesParam = searchParams.get('categories');
  const selectedCategories = categoriesParam ? categoriesParam.split(',') : [];
  const maxPrice = searchParams.get('price') ? Number(searchParams.get('price')) : 1000;
  const sortOrder = searchParams.get('sort') || 'default';
  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 12;

  // Extract unique categories for the sidebar
  const allCategories = [...new Set(food_list.map(food => food.category))];

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      newParams.delete(key);
    } else {
      newParams.set(key, Array.isArray(value) ? value.join(',') : value);
    }

    // Reset to page 1 if any filter other than page changes
    if (key !== 'page') {
      newParams.delete('page'); 
    }

    setSearchParams(newParams);
  };

  const clearAllFilters = () => setSearchParams({});

  const handleCategoryChange = (category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    updateFilter('categories', newCategories);
  };

  // --- 3. Loading State Simulation ---
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Filtering Pipeline
  // A. Text Search
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.trim() !== '');
  let processedProducts = food_list.filter((food) => {
    if (searchTerms.length === 0) return true;
    const searchableText = `${food.name} ${food.category}`.toLowerCase();
    return searchTerms.every(term => searchableText.includes(term));
  });

  // B. Category Filter
  if (selectedCategories.length > 0) {
    processedProducts = processedProducts.filter(food => 
      selectedCategories.includes(food.category)
    );
  }

  // C. Price Filter
  processedProducts = processedProducts.filter(food => food.price <= maxPrice);

  // D. Sort
  processedProducts.sort((a, b) => {
    if (sortOrder === 'priceAsc') return a.price - b.price;
    if (sortOrder === 'priceDesc') return b.price - a.price;
    return 0; 
  });

  // E. Pagination
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = processedProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="search-page-container">
    
    {/* Sidebar */}
    <div className="search-sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Filters</h3>
        {(selectedCategories.length > 0 || maxPrice < 100) && (
          <button onClick={clearAllFilters} className="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>
      
      {/* Categories */}
      <div className="filter-group">
        <h4 className="filter-title">Categories</h4>
        <div className="category-list">
          {allCategories.map(category => (
            <label key={category} className="category-label">
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                className="category-checkbox"
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Slider */}
      <div className="filter-group">
        <div className="price-header">
          <h4 className="filter-title">Max Price</h4>
          <span className="price-value">${maxPrice}</span>
        </div>
        <input
          type="range"
          min="0" 
          max="1000" 
          value={maxPrice} 
          onChange={(e) => updateFilter('price', e.target.value)}
          className="price-slider"
        />
      </div>
    </div>

    {/* Main Content Area */}
    <div className="search-main-content">
      
      {/* Header & Sorting */}
      <div className="search-results-header">
        <h2>
          {query ? `Search results for "${query}"` : "All Menu Items"}
          <span className="item-count">({processedProducts.length} items)</span>
        </h2>
        
        <select 
          value={sortOrder} 
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="sort-dropdown"
        >
          <option value="default">Sort by: Recommended</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
        </select>
      </div>
      
      {/* Grid / Empty State */}
      {isLoading ? (
        <div className="results-grid">
          {[...Array(itemsPerPage)].map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : paginatedProducts.length === 0 ? (
        <EmptyState onClear={clearAllFilters} />
      ) : (
        <>
          <div className="results-grid">
            {paginatedProducts.map((food,index) => (
              <FoodItem key={index} id={food._id} name={food.name} description={food.description} price={food.price} image={food.image}/>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                onClick={() => updateFilter('page', currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => updateFilter('page', currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
    
  </div>
  )
}



export default SearchResult





















// <div key={food._id} className="food-card">
//   <img src={food.image} alt={food.name} className="food-card-image" />
//   <div className="food-card-info">
//     <h3 className="food-card-title">{food.name}</h3>
//     <span className="food-card-price">${food.price}</span>
//   </div>
//   <p className="food-card-category">{food.category}</p>
//   <button className="add-to-cart-btn">
//     Add to Cart
//   </button>
// </div>
