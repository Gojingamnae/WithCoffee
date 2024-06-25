// Search.js
import React, { useEffect, useState } from 'react';
import { dbService } from '../fbase';
import { Link, useLocation } from 'react-router-dom';
import { getDatabase, ref, get } from 'firebase/database';
import { query, collection, getDocs } from 'firebase/firestore';
import { LazyLoadImage, trackWindowScroll } from 'react-lazy-load-image-component';
import shop from './shop.css';

const Search = () => {
  const location = useLocation();
  const searchQuery = decodeURIComponent(location.pathname.split('/').pop());

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchResults, setSearchResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true); // 추가: 로딩 상태

  const db = getDatabase();
  const BeansRef = ref(db, 'Beans');
  const ToolsRef = ref(db, 'Tools');

  const fetchData = async () => {
    try {
      setLoading(true);
      const beansSnapshot = await get(BeansRef);
      const toolsSnapshot = await get(ToolsRef);

      if (beansSnapshot.exists() && toolsSnapshot.exists()) {
        const beansData = beansSnapshot.val();
        const toolsData = toolsSnapshot.val();

        // Convert beans and tools data to array and include the id
        const beansResults = Object.keys(beansData).map(key => ({
          id: key,
          ...beansData[key]
        }));
        const toolsResults = Object.keys(toolsData).map(key => ({
          id: key,
          ...toolsData[key]
        }));

        const combinedResults = [...beansResults, ...toolsResults];

        const filteredResults = combinedResults.filter(result => {
          // 제품 이름을 공백을 기준으로 분리하여 토큰 배열로 만듭니다.
          const nameTokens = result.name.split(' ');
        
          // 검색어를 공백을 기준으로 분리합니다.
          const searchTokens = searchQuery.split(' ');
        
          // 모든 검색어 단어가 포함되었는지를 확인하기 위해 every 메서드를 사용합니다.
          const allTokensMatched = searchTokens.every(queryWord => {
            // 현재 검색어 단어가 제품 이름의 어떤 토큰에 포함되어 있는지 확인합니다.
            return nameTokens.some(token => token.includes(queryWord));
          });
        
          // 모든 검색어 단어가 포함된 경우에만 true를 반환하여 결과에 포함시킵니다.
          return allTokensMatched;
        });        

        const totalItems = filteredResults.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        setTotalPages(totalPages);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        setSearchResults(filteredResults.slice(startIndex, endIndex));
      } else {
        console.log('No data available');
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price);
  };

  const getTypeString = (type) => {
    switch (type) {
      case 0:
        return '로스팅 홀빈';
      case 1:
        return '분쇄';
      case 2:
        return '생두';
      default:
        return type;
    }
  };

  const renderPaginationButtons = () => {
    const maxPagesToShow = 10;
    let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination-button">
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={currentPage === page ? 'active product-list-next-button' : 'product-list-next-button'}
            disabled={currentPage === page}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="shop-container">
      {loading ? ( // 로딩 중일 때 "검색 중입니다"를 출력
      <p>검색 중입니다...</p>
       ) : (
         <>
      {searchResults.length > 0 ? (
        <>
        <h3>'{searchQuery}'에 대한 검색 결과</h3>
        <ul className="products-list">
        {searchResults.map((result) => {
          console.log('search result:', result);
          return (
            <li className="products-list-item" key={result.id}>
              <Link to={`/shop/Detail/${result.id}`}>
                {result.image && (
                  <LazyLoadImage
                    src={result.image}
                    alt="Product"
                    effect="blur"
                    style={{ width: '100px', height: '100px' }}
                  />
                )}
              </Link>
              <div className="product-details">
                <h3><Link to={`/shop/Detail/${result.id}`}>{result.name}</Link></h3>
                <p className="products-metadata">
                  카테고리: {getTypeString(result.type)} | 브랜드: {result.brand} | 
                  가격: {formatPrice(result.price)} | 인터넷 별점: {result.rate}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    
    {renderPaginationButtons()}
        </>
      ) : (
        <p>검색 결과가 없습니다.</p>
      )}
      </>
       )}
    </div>
  );
};

export default Search;
