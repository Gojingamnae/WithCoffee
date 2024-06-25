// Details.js
import React, { useEffect, useState } from 'react';
import { dbService, authService} from '../fbase';
import { doc, getDoc, getDocs, query, where, collection, setDoc, updateDoc} from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import shop from './shop.css';

const Detail = () => {
   const [selectedProduct, setSelectedProduct] = useState(null);
   const [reviews, setReviews] = useState([]);
   const [isLiked, setIsLiked] = useState(false);
   const [likeCount, setLikeCount] = useState(0);

  const location = useLocation();
  const productId = location.pathname.split('/').pop();

  const navigate = useNavigate();

  const fetchProduct = async () => {
    try {
      let productData = null;
      const beansProductDoc = doc(dbService, 'Beans', productId);
      const beansProductSnapshot = await getDoc(beansProductDoc);

      if (beansProductSnapshot.exists()) {
        productData = { id: beansProductSnapshot.id, ...beansProductSnapshot.data() };
      } else {
        const toolsProductDoc = doc(dbService, 'Tools', productId);
        const toolsProductSnapshot = await getDoc(toolsProductDoc);

        if (toolsProductSnapshot.exists()) {
          productData = { id: toolsProductSnapshot.id, ...toolsProductSnapshot.data() };
        } else {
          console.error('Product not found');
          return;
        }
      }

      setSelectedProduct(productData);

      // Fetch like status and count
      const user = authService.currentUser;
      if (user) {
        const likedDoc = doc(dbService, 'Liked', productId);
        const likedDocSnapshot = await getDoc(likedDoc);

        if (likedDocSnapshot.exists()) {
          const likedByArray = likedDocSnapshot.data().likedBy || [];
          const liked = likedByArray.includes(user.uid);

          setIsLiked(liked);
          setLikeCount(likedByArray.length);
        } else {
          setIsLiked(false);
          setLikeCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);


  const fetchLikeCount = async () => {
    try {
      const likedDocRef = doc(dbService, 'Liked', productId);
      const likedDocSnapshot = await getDoc(likedDocRef);
  
      if (likedDocSnapshot.exists()) {
        const likedByArray = likedDocSnapshot.data().likedBy || [];
        console.log('Number of userIds in likedBy:', likedByArray.length);
        setLikeCount(likedByArray.length);
      }
    } catch (error) {
      console.error('Error fetching like count:', error);
    }
  };

  useEffect(() => {
    fetchLikeCount();
  }, [productId]);

  const handleWriteReview = (productId) => {
    const user = authService.currentUser;

    if (user) {
      navigate(`/Review/Write/${productId}`);
    } else {
      navigate('/Auth');
    }
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

  const getCaffeineInfo = (caffeineValue) => {
    return caffeineValue === 1 ? '카페인' : '디카페인';
  };

  const handleLike = async () => {
    const user = authService.currentUser;

    if (user) {
      const likedDocRef = doc(dbService, 'Liked', productId);

      if (!isLiked) {
        const likedDocSnapshot = await getDoc(likedDocRef);
        if (likedDocSnapshot.exists()) {
          // Update existing document
          await updateDoc(likedDocRef, {
            likedBy: [...likedDocSnapshot.data().likedBy, user.uid],
          });
        } else {
          // Create new document
          await setDoc(likedDocRef, {
            productId,
            likedBy: [user.uid],
            name: selectedProduct.name,
            image: selectedProduct.image,
            type: selectedProduct.type,
            brand: selectedProduct.brand,
            rate: selectedProduct.rate,
            price: selectedProduct.price
          });
        }
        setLikeCount(prevCount => prevCount + 1);
      } else {
        const likedDocSnapshot = await getDoc(likedDocRef);
        const likedBy = likedDocSnapshot.data()?.likedBy || [];
        const updatedLikedBy = likedBy.filter((userId) => userId !== user.uid);
        await setDoc(likedDocRef, { likedBy: updatedLikedBy }, { merge: true });
        setLikeCount(prevCount => prevCount - 1);
      }

      setIsLiked(prevLiked => !prevLiked);
    } else {
      navigate('/Auth');
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsQuery = query(collection(dbService, 'Reviews'), where('ID', '==', productId));
        const reviewsSnapshot = await getDocs(reviewsQuery);
  
        const reviewsData = reviewsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data };
        });
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
  
    fetchReviews();
  }, [productId]);

  const fetchUserNickname = async (userId) => {
    try {
      const userDoc = doc(dbService, 'Users', userId);
      const userDocSnapshot = await getDoc(userDoc);
  
      if (userDocSnapshot.exists()) {
        return userDocSnapshot.data().nickname;
      } else {
        console.error('User not found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };
        
  
  if (!selectedProduct) {
    return (
      <div className="loading-container">
        Loading...
      </div>
    );
  }
  
  return (
    <div className='detail-container'>
      <h2>{selectedProduct.name}</h2>
      {selectedProduct.image && (
        <div style={{ display: 'flex'}}>
          <img
            src={selectedProduct.image}
            style={{ maxWidth: '300px', maxHeight: '300px', marginRight: '20px' }}
            alt="Product"
          />
          <div>
            <table>
              <tbody>
                <tr>
                  <th>카테고리</th>
                  <td>{getTypeString(selectedProduct.type)}</td>
                </tr>
                <tr>
                  <th>브랜드</th>
                  <td>{selectedProduct.brand}</td>
                </tr>
                {selectedProduct.type === 0 && (
                  <tr>
                    <th>카페인 여부</th>
                    <td>{getCaffeineInfo(selectedProduct.caffeine)}</td>
                  </tr>
                )}
                <tr>
                  <th>가격</th>
                  <td>{formatPrice(selectedProduct.price)}</td>
                </tr>
                <tr>
                  <th>인터넷 평점</th>
                  <td>{selectedProduct.rate}/5</td>
                </tr>
                <tr>
                  <th>좋아요 개수</th>
                  <td>{likeCount}</td>
                </tr>
              </tbody>
            </table>
            <nav className="detail-button-container" style={{marginLeft:'30px', height:'15%'}}>
            <a
                  href={
                    selectedProduct.lowest_link
                      ? selectedProduct.lowest_link
                      : selectedProduct.link
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{textDecoration: 'none', color:'white'}}
                >
              <button>
                  🧺 구매하러 가기
              </button>
              </a>
              <button onClick={() => handleWriteReview(selectedProduct.id)}>
                🖋️ 리뷰쓰기
              </button>
              <button onClick={handleLike}>
                {isLiked ? '💔 좋아요 해제' : '❤️ 좋아요'}
              </button>
            </nav>
          </div>
        </div>
      )}

      <hr style={{width:'60%'}}/>
  
      <div className='user-review-container'>
        <h2>회원들의 리뷰 목록</h2>
        <hr style={{margin:'25px'}}/>
        {reviews.map((review) => (
          <div className='detail-review' key={review.id}>
            <span className='detail-rating'>
              {[0, 1, 2, 3, 4].map((index) => (
                <FaStar
                  key={index}
                  size="17"
                  color={index < review.userrate ? 'gold' : 'lightGray'}
                ></FaStar>
              ))}
              &nbsp;&nbsp;{review.userrate}
            </span>
            <div className="detail-image-containr" style={{ display: 'flex', alignItems: 'center' }}>
              {review.reviewimage && (
                <img src={review.reviewimage} alt="Review" className="detail-image" />
              )}
              <p>{review.text}</p>
            </div>
          </div>
        ))}
        <hr style={{margin:'20px'}}/>
      </div>

    </div>
  );
}
export default Detail;
