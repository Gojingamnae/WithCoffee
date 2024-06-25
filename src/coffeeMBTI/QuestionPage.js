// Question.js
import React, { useState, useEffect } from 'react';
import { dbService } from '../fbase';
import {
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import coffee from './coffee.jpg';
import { useNavigate } from 'react-router-dom';
import img1 from './1.png';
import img2 from './2.png';
import img3 from './3.png';
import img4 from './4.png';
import img5 from './5.png';
import img6 from './6.png';
import img7 from './7.png';
import img8 from './8.png';
import img9 from './9.png';
import img10 from './10.png';

const Question = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState([0, 0, 0, 0, 0]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [matchingCoffee, setMatchingCoffee] = useState(null);
  const [matchingurl, setMatchingurl] = useState(null);
  const [matchingdec, setMatchingdec] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const questions = [
    'Q1: 어떤 타입의 커피를 더 좋아하시나요?',
    'Q2: 어떤 사탕을 더 좋아하시나요?',
    'Q3: 어떤 초콜릿을 더 좋아하시나요?',
    'Q4: 어떤 향의 향수를 더 좋아하시나요?',
    'Q5: 음식을 씹을 때, 몇 번 정도 씹고 삼키시나요?',
  ];

  const handleButtonClick = async (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    setCurrentQuestion(currentQuestion + 1);

    if (currentQuestion === questions.length - 1) {
      const mbtiCollection = collection(dbService, 'mbti');
      const q = query(
        mbtiCollection,
        where('body', '==', newAnswers[0]),
        where('acidity', '==', newAnswers[1]),
        where('sweet', '==', newAnswers[2]),
        where('cove', '==', newAnswers[3]),
        where('flavor', '==', newAnswers[4])
      );

      const matchingCoffeeSnapshot = await getDocs(q);

      if (matchingCoffeeSnapshot.docs.length > 0) {
        const matchingCoffeeData = matchingCoffeeSnapshot.docs[0].data();
        setMatchingCoffee(matchingCoffeeData.name);
        setMatchingurl(matchingCoffeeData.url);
        setMatchingdec(matchingCoffeeData.dec);
      }
    }
  };

  const Shops = () => {
    if (matchingurl) {
      window.open(matchingurl, '_blank'); // 새로운 창에서 URL 열기
    }
  };

  useEffect(() => {
    setImagesLoaded(true); // Set the state to indicate that images are loaded
  }, [currentQuestion]);

  const buttonStyle = {
    margin: '0 10px',
    padding: '0px 0px',
    cursor: 'pointer',
    border: '0px',
    borderColor: 'white',
    color: 'white',
  };

  const imageStyle = {
    width: '230px',
    height: '230px',
  };

  const textContainerStyle = {
    textAlign: 'center',
    marginBottom: '20px',
  };

  const textStyles = {
    fontSize: '16px',
    marginBottom: '10px',
    textAlign: 'center'    
  };
  const textStylesTitle = {
    fontSize: '20px',
    marginBottom: '10px',
    textAlign: 'center'
  };

  const mainContainerStyle = {
    backgroundColor: 'black',
    alignItems: 'center',
    color: 'white',
    minHeight: '100vh', // 100% of viewport height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'repeat(4, auto)',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    width: '80%',
    margin: '0 auto',
  };

  const buttonFullStyle = {
    gridColumn: '1 / span 2',
    display: 'flex',
    justifyContent: 'center',
  };

  const leftCellStyle = {
    marginRight: '30%',
  };

  const rightCellStyle = {
    marginLeft: '30%',
  };

  return (
    <div style={mainContainerStyle}>
      {currentQuestion < questions.length && imagesLoaded && (
        <div style={textContainerStyle}>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {questions[currentQuestion]}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              style={buttonStyle}
              onClick={() => handleButtonClick(0)}
            >
              <img
                src={
                  currentQuestion === 0
                    ? img1
                    : currentQuestion === 1
                    ? img3
                    : currentQuestion === 2
                    ? img5
                    : currentQuestion === 3
                    ? img7
                    : img9
                }
                alt={`img${currentQuestion * 2 + 1}`}
                style={imageStyle}
              />
            </button>
            <button
              style={buttonStyle}
              onClick={() => handleButtonClick(1)}
            >
              <img
                src={
                  currentQuestion === 0
                    ? img2
                    : currentQuestion === 1
                    ? img4
                    : currentQuestion === 2
                    ? img6
                    : currentQuestion === 3
                    ? img8
                    : img10
                }
                alt={`img${currentQuestion * 2 + 2}`}
                style={imageStyle}
              />
            </button>
          </div>
        </div>
      )}
      {matchingCoffee && (
        <>
          <div style={gridContainerStyle}>
            <p style={{ ...textStylesTitle, gridColumn: '1 / span 2' }}>당신의 커피 취향은?</p>
            <p style={{ ...textStyles, ...leftCellStyle }}>{matchingCoffee}</p>
            <img
              style={{
                maxWidth: '30%',
                height: 'auto',
                gridRow: '2 / span 2',
                ...rightCellStyle,
              }}
              alt={'커피이미지'}
              src={coffee}
            />
            <p style={{ ...textStyles, ...leftCellStyle }}>: {matchingdec}</p>
            <div style={{ ...buttonFullStyle, gridColumn: '1 / span 2' }}>
              <button
                style={{
                  padding: '10px 15px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  borderColor: 'white',
                  color: 'black',
                }}
                onClick={Shops}
              >
                구매하러 가기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Question;