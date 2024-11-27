import React from "react";

const BingoCard = ({ card, drawnNumbers }) => {
  // Function to generate a random Bingo card
  const generateRandomCard = () => {
    // Create an array of numbers from 1 to 60, shuffle them, and split into a 3x5 grid
    const shuffledNumbers = Array.from({ length: 60 }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5
    );
    return Array.from({ length: 3 }, (_, rowIndex) =>
      shuffledNumbers.slice(rowIndex * 5, rowIndex * 5 + 5)
    );
  };

  // Function to validate the provided card
  const isValidCard = (card) => {
    // Ensure the card is an array and contains unique numbers
    if (!Array.isArray(card)) {
      console.error("Invalid card format", card);
      return false;
    }

    // Flatten the card into a single array and check for duplicate numbers
    const flatNumbers = card.flat();
    const uniqueNumbers = new Set(flatNumbers);
    return flatNumbers.length === uniqueNumbers.size;
  };

  // Determine the valid card: use the provided card if valid, otherwise generate a new one
  const validCard = isValidCard(card) ? card : generateRandomCard();

  // Function to check if a number has been drawn
  const isNumberDrawn = (number) => drawnNumbers.includes(number);

  return (
    <div className="bingo-card p-4 rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
      {/* Render the rows and columns of the Bingo card */}
      {validCard.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center space-x-2 mb-3">
          {row.map((number, colIndex) => (
            <div
              key={colIndex}
              className={`w-10 h-10 flex justify-center items-center text-purple-600 rounded-lg font-semibold text-lg transition-all duration-300 ${
                isNumberDrawn(number) // If the number has been drawn, highlight it
                  ? "bg-green-200" // Highlight color for drawn numbers
                  : "bg-white" // Default color for undrawn numbers
              }`}
            >
              {number}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default BingoCard;
