import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBootstrap } from './hooks/useBootstrap';
import { useGetBooster } from './hooks/useGetBooster';
import { MagicCardDetails } from './components/MagicCardDetails/MagicCardDetails';
import { MagicCardSetDetails } from './components/MagicCardSetDetails/MagicCardSetDetails';
import { MagicCardFan } from './components/MagicCardFan/MagicCardFan';
import { MagicCardLarge } from './components/MagicCardLarge/MagicCardLarge';
import { Spinner } from './components/Spinner/Spinner';
import { Status } from './components/Status/Status';
import { dollarize } from './lib/currency';

import './App.css';

/**
 * Given a set of cards, gets the sum for all cards that have a value;
 * ignores any cards that have an unknown value.
 * @param {{amount:number}} cards
 * @returns {number}
 */
const getBoosterValue = cards => {
  let sum = 0;
  if (Array.isArray(cards) && cards.length > 0) {
    for (let card of cards) {
      if (card.price !== null) {
        sum += card.price;
      }
    }
  }
  return sum;
};

const App = () => {
  const cardSetRef = useRef(null);
  const [cardSetCode, setCardSetCode] = useState('');
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(undefined);
  const {
    generatedCardSetCode,
    cards,
    getBoosterStatus,
    error,
    cacheSize,
    generateBooster,
  } = useGetBooster();
  const { isBootstrapping, bootstrapError, cardSets } = useBootstrap();
  const isGeneratingBooster = getBoosterStatus !== '';
  const selectedCardSet = useMemo(
    () => {
      if (!Array.isArray(cardSets) || !cardSetCode) {
        return null;
      }
      return cardSets.find(cardSet => cardSet.code === cardSetCode);
    },
    [cardSets, cardSetCode],
  );

  useEffect(
    () => {
      const handleBootstrapCompleted = () => {
        if (cardSets.length > 0) {
          setCardSetCode(cardSets[0].code);
          if (cardSetRef.current) {
            cardSetRef.current.focus();
          }
        }
      };

      if (!isBootstrapping && !bootstrapError) {
        handleBootstrapCompleted();
      }
    },
    [isBootstrapping, bootstrapError],
  );

  const handleGetBooster = () => {
    setSelectedCardIndex(undefined);
    generateBooster(cardSetCode);
  };

  const handleCardSetChange = e => {
    const newCardSetCode = e.target.value;
    if (newCardSetCode !== cardSetCode) {
      setSelectedCardIndex(undefined);
      setCardSetCode(newCardSetCode);
    }
  };

  const handleCardClick = cardIndex => {
    setSelectedCardIndex(cardIndex);
  };

  const toggleStatus = () => {
    setIsStatusExpanded(!isStatusExpanded);
  };

  if (isBootstrapping) {
    return (
      <div className="bootstrapping">
        <Spinner />
        Fetching card set data...
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="app">
        <main className="pageWrapper">
          <div className="content">
            <div>Error: {bootstrapError.message}</div>
          </div>
        </main>
      </div>
    );
  }

  const boosterValue = dollarize(getBoosterValue(cards));
  const selectedCard =
    selectedCardIndex !== undefined && cards[selectedCardIndex]
      ? cards[selectedCardIndex]
      : undefined;
  const generatedCardSet =
    generatedCardSetCode && Array.isArray(cardSets)
      ? cardSets.find(cardSet => cardSet.code === generatedCardSetCode)
      : undefined;

  return (
    <div className="app">
      <header>
        <Status
          isExpanded={isStatusExpanded}
          cacheSize={cacheSize}
          getBoosterStatus={getBoosterStatus}
          fetchError={error}
          onClick={toggleStatus}
        />
      </header>
      <main className="pageWrapper">
        <h1 className="title">Magic The Gathering Booster Pack Generator</h1>
        <div className="content">
          <div className="leftSide">
            <div className="controls">
              <div>
                <label htmlFor="cardSet">Set: </label>
                <select
                  id="cardSet"
                  ref={cardSetRef}
                  disabled={isGeneratingBooster}
                  onChange={handleCardSetChange}
                  value={cardSetCode}
                >
                  {cardSets.map(cardSet => (
                    <option key={cardSet.code} value={cardSet.code}>
                      {cardSet.name}
                    </option>
                  ))}
                </select>
              </div>
              <button disabled={getBoosterStatus} onClick={handleGetBooster}>
                Generate Booster
              </button>
            </div>
            {generatedCardSet && (
              <div className="generatedCardSetName">
                Generated Set:
                <img
                  className="generatedCardSetIcon"
                  src={generatedCardSet.imgUrl}
                  alt={generatedCardSet.name}
                />
                {generatedCardSet.name}
              </div>
            )}
            {Array.isArray(cards) && cards.length > 0 && (
              <div className="totalPrice">Booster Value: {boosterValue}</div>
            )}
            {Array.isArray(cards) && !error && (
              <div className="cardsContainer">
                <MagicCardFan cards={cards} handleCardClick={handleCardClick} />
              </div>
            )}
            {selectedCard !== undefined && (
              <MagicCardDetails
                name={selectedCard.name}
                type={selectedCard.type}
                rarity={selectedCard.rarity}
                price={selectedCard.price}
              />
            )}
          </div>
          <div className="rightSide">
            {selectedCard && (
              <MagicCardLarge
                name={selectedCard.name}
                imgUrl={selectedCard.imgUrl}
              />
            )}

            {!selectedCard && selectedCardSet && (
              <MagicCardSetDetails
                name={selectedCardSet.name}
                imgUrl={selectedCardSet.imgUrl}
                cardCount={selectedCardSet.cardCount}
                year={selectedCardSet.year}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
