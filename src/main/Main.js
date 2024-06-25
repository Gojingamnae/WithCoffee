import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MBTIbackground from './coffeembti.png';
import { authService, dbService } from '../fbase';
import { getDocs, collection, query, orderBy, limit, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const Main = () => {
  const [popularKeywords, setPopularKeywords] = useState([]);
  const [testData, setTestData] = useState(null);
  const [bestBeans, setBestBeans] = useState([]);
  const [bestTools, setBestTools] = useState([]);
  const [bestItems, setBestItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularKeywords = async () => {
      const searchKeywordsRef = collection(dbService, 'searchKeywords');
      const q = query(
        searchKeywordsRef,
        orderBy('count', 'desc'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const keywords = querySnapshot.docs.map((doc, index) => `${index + 1}. ${doc.data().keyword}`);
      setPopularKeywords(keywords);
    };

    fetchPopularKeywords();
    const fetchData = async () => {
      try {
        const response = await fetch('../MBTI/data.json'); // 파일 경로에 따라 수정
        const data = await response.json();
        setTestData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const fetchBestItems = async () => {
      const beansRef = collection(dbService, 'Beans');
      const toolsRef = collection(dbService, 'Tools');

      const beansQuery = query(
        beansRef,
        orderBy('purchaseCnt', 'desc'),
        limit(2)
      );

      const toolsQuery = query(
        toolsRef,
        orderBy('purchaseCnt', 'desc'),
        limit(2)
      );

      const beansSnapshot = await getDocs(beansQuery);
      const beans = beansSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setBestBeans(beans);

      const toolsSnapshot = await getDocs(toolsQuery);
      const tools = toolsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setBestTools(tools);

      const bestItems = [...beans, ...tools];
      setBestItems(bestItems);
    };

    fetchData();
    fetchBestItems();
  }, []);

  const handleSearch = async (keyword) => {
    if (keyword.trim() !== '') {
      const keywordRef = doc(dbService, 'searchKeywords', keyword.toLowerCase());

      try {
        const keywordDoc = await getDoc(keywordRef);

        if (keywordDoc.exists()) {
          // If the keyword already exists, update the count
          await updateDoc(keywordRef, {
            count: keywordDoc.data().count + 1,
            timestamp: serverTimestamp(),
          });
        } else {
          // If the keyword does not exist, create a new document
          await setDoc(keywordRef, {
            keyword: keyword.toLowerCase(),
            count: 1,
            timestamp: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('Error saving search keyword to Firebase:', error);
      }
    }

    // Navigate to search page
    navigate(`/shop/Search/${keyword}`);
  };

  return (
    <>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <br/>
        <img src={MBTIbackground} alt="Example" style={{ maxWidth: '100%', height: 'auto', borderRadius: '10px' }} />
        <div
          id="mbti_box"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Link to="/MBTI/MBTIMain" style={{ textDecoration: 'none', marginBottom: '10px' }}>
            <button style={{ backgroundColor: '#ffffff', color: '#000000', padding: '10px 20px', border: 'none' }}>커피 MBTI</button>
          </Link>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', marginLeft: '10%', marginRight: '10%', marginBottom: '4px' }}>
        <div style={{ flex: '2', border: '1px solid #ddd', borderRadius: '10px', marginRight: '30px' }}>
          <h2 style={{ textAlign: 'center' }}>실시간 인기 검색어</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {popularKeywords.map((keyword) => (
              <li
                key={keyword}
                style={{ fontSize: '1.2rem', margin: '8px 0', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => handleSearch(keyword.replace(/^\d+\.\s*/, ''))}
                dangerouslySetInnerHTML={{ __html: keyword }}
              />
            ))}
          </ul>
        </div>
        <div style={{ flex: '8', border: '1px solid #ddd', borderRadius: '10px' }}>
  <h2 style={{ textAlign: 'center' }}>쇼핑 Best</h2>
  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
    {bestItems.map(item => (
      <div key={item.id} style={{ flex: '1', textAlign: 'center', margin: '10px' }}>
        <Link to={`/shop/Detail/${item.id}`} style={{ textDecoration: 'none', color: '#000' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={item.image} alt={item.name} style={{ width: '100px', height: '100px', marginBottom: '4px' }} />
            <p style={{ textAlign: 'center', marginBottom: 0 }}>{item.name}</p>
          </div>
        </Link>
      </div>
    ))}
  </div>
</div>
      </div>
      <br/>
      <div>
        <p style={{ textAlign: 'center' }}>
          사업자 : 한혜진, 제서영<br />
          주소: 진주시 진주대로 501, 30동<br />
          문의사항: hanhj13733@gmail.com
        </p>
      </div>
    </>
  );
};

export default Main;
