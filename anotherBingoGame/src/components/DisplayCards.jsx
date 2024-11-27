import React from "react";
import BingoCard from "./BingoCard";

const DisplayCards = ({ cards = [], drawnNumbers = [] }) => {

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-xl text-white font-semibold mb-4">Your Cards:</h2>

      {/* Container for the list of cards */}
      <div className="flex flex-wrap text-green-500 gap-4">
        {/* Check if there are cards to display */}
        {cards.length > 0 ? (
          // Map through each card and render a BingoCard component
          cards.map((card, index) => (
            <BingoCard
              key={index} // Unique key for each card
              numbers={card.nums || []} // Pass card numbers to the BingoCard component
              drawnNumbers={drawnNumbers} // Pass the drawn numbers to highlight matches
            />
          ))
        ) : (
          // Display a placeholder message if no cards are available
          <p className="text-red-500">No cards to display.</p>
        )}
      </div>
    </div>
  );
};

export default DisplayCards;
