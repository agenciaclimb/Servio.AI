import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductListing.css';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  stock: number;
  status: 'active' | 'archived';
  rating?: number;
  reviews?: number;
}

interface ProductListingProps {
  onAddToCart?: (productId: string, quantity: number) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating';

const ProductListing: React.FC<ProductListingProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 12;
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  
  // Categories (in real app, fetch from API)
  const categories = [
    'all',
    'Eletricista',
    'Encanador',
    'Pintor',
    'Marceneiro',
    'Pedreiro',
    'Jardineiro',
    'Limpeza',
    'Outros'
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, priceRange, minRating, inStockOnly, sortBy, currentPage]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (priceRange.min > 0) {
        params.append('minPrice', priceRange.min.toString());
      }
      if (priceRange.max < 10000) {
        params.append('maxPrice', priceRange.max.toString());
      }
      if (inStockOnly) {
        params.append('status', 'active');
      }
      params.append('limit', productsPerPage.toString());

      const response = await fetch(`/api/ecommerce/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar produtos');
      }

      const data = await response.json();
      let fetchedProducts = data.products || data;

      // Apply rating filter
      if (minRating > 0) {
        fetchedProducts = fetchedProducts.filter((p: Product) => 
          (p.rating || 0) >= minRating
        );
      }

      // Apply sorting
      fetchedProducts = sortProducts(fetchedProducts, sortBy);

      // Calculate pagination
      const total = Math.ceil(fetchedProducts.length / productsPerPage);
      setTotalPages(total);

      // Get current page products
      const startIndex = (currentPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      setProducts(fetchedProducts.slice(startIndex, endIndex));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortProducts = (prods: Product[], sort: SortOption): Product[] => {
    const sorted = [...prods];
    
    switch (sort) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'newest':
        return sorted; // Assume products are already sorted by newest
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'relevance':
      default:
        return sorted;
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (onAddToCart) {
      onAddToCart(productId, 1);
      return;
    }

    // Default implementation
    try {
      const response = await fetch('/api/ecommerce/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user', // Replace with actual user ID
          productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar ao carrinho');
      }

      alert('Produto adicionado ao carrinho!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao adicionar ao carrinho');
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setPriceRange({ min: 0, max: 10000 });
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('relevance');
    setCurrentPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="product-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ← Anterior
        </button>
        {pages}
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Próxima →
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="product-listing-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-listing-container">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchProducts} className="retry-btn">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-listing-container">
      <div className="product-listing-header">
        <h1>Produtos</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Visualização em grade"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Visualização em lista"
            >
              ☰
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="sort-select"
          >
            <option value="relevance">Relevância</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="newest">Mais recentes</option>
            <option value="rating">Melhor avaliados</option>
          </select>
        </div>
      </div>

      <div className="product-listing-content">
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filtros</h2>
            <button onClick={resetFilters} className="reset-filters-btn">
              Limpar
            </button>
          </div>

          <div className="filter-group">
            <h3>Categoria</h3>
            <div className="category-filters">
              {categories.map((cat) => (
                <label key={cat} className="filter-checkbox">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={selectedCategory === cat}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                  <span>{cat === 'all' ? 'Todas' : cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3>Faixa de Preço</h3>
            <div className="price-range">
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Mín"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, min: Number(e.target.value) })
                  }
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({ ...priceRange, max: Number(e.target.value) })
                  }
                  className="price-input"
                />
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: Number(e.target.value) })
                }
                className="price-slider"
              />
            </div>
          </div>

          <div className="filter-group">
            <h3>Avaliação Mínima</h3>
            <div className="rating-filters">
              {[0, 3, 4, 5].map((rating) => (
                <label key={rating} className="filter-checkbox">
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    checked={minRating === rating}
                    onChange={() => setMinRating(rating)}
                  />
                  <span>
                    {rating === 0 ? 'Todas' : `${rating}+ estrelas`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>Apenas em estoque</span>
            </label>
          </div>
        </aside>

        <main className="products-main">
          {products.length === 0 ? (
            <div className="no-products">
              <p>Nenhum produto encontrado com os filtros selecionados.</p>
              <button onClick={resetFilters} className="reset-btn">
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className={`products-${viewMode}`}>
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/placeholder-product.png';
                          }}
                        />
                      ) : (
                        <div className="image-placeholder">📦</div>
                      )}
                      {product.stock === 0 && (
                        <div className="out-of-stock-badge">Sem estoque</div>
                      )}
                    </div>

                    <div className="product-info">
                      <h3
                        className="product-name"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        {product.name}
                      </h3>
                      <p className="product-category">{product.category}</p>

                      {product.rating && (
                        <div className="product-rating-section">
                          {renderStars(product.rating)}
                          {product.reviews && (
                            <span className="reviews-count">
                              ({product.reviews} avaliações)
                            </span>
                          )}
                        </div>
                      )}

                      <p className="product-description">
                        {product.description && product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description}
                      </p>

                      <div className="product-footer">
                        <div className="product-price">
                          R$ {product.price.toFixed(2)}
                        </div>
                        <button
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock === 0}
                        >
                          {product.stock === 0 ? 'Indisponível' : '🛒 Adicionar'}
                        </button>
                      </div>

                      {product.stock > 0 && product.stock <= 5 && (
                        <p className="low-stock-warning">
                          ⚠️ Apenas {product.stock} em estoque
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {renderPagination()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListing;
