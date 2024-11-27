import React, { useState, useEffect } from "react";
import DisplayCards from "../components/DisplayCards";
import PrizeList from "../components/PrizeList";
import BallDispenser from "../components/BallDispenser";

// Main component for the Bingo game page
const Home = () => {
  // State variables to manage the game's logic
  const [coins, setCoins] = useState(200); // User's starting coins
  const [cards, setCards] = useState([]); // Bingo cards
  const [balls, setBalls] = useState([]); // Numbers drawn in the current game
  const [gameStarted, setGameStarted] = useState(false); // Whether the game has started
  const [prizeWon, setPrizeWon] = useState({
    status: "initial", // Initial, win, or lost status
    value: null, // Prize value
    pattern: null, // Winning pattern (if applicable)
  });
  const [gameEnded, setGameEnded] = useState(false); // Whether the game has ended
  const [ballsDispensed, setBallsDispensed] = useState(0); // Number of balls drawn
  const [message, setMessage] = useState(""); // Status message
  const [ballsDispensedComplete, setBallsDispensedComplete] = useState(false); // All balls dispensed flag

  // List of prize patterns with their values
  const prizes = [
    // Full card pattern
    {
      value: 2000,
      pattern: [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ],
    },
    // Cross pattern
    {
      value: 200,
      pattern: [
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
      ],
    },
    // Vertical line pattern
    {
      value: 20,
      pattern: [
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
      ],
    },
    // X-shaped pattern
    {
      value: 10,
      pattern: [
        [0, 0, 1, 0, 0],
        [0, 1, 0, 1, 0],
        [1, 0, 0, 0, 1],
      ],
    },
    // Horizontal middle line
    {
      value: 10,
      pattern: [
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
      ],
    },
    // Diagonal corners
    {
      value: 5,
      pattern: [
        [1, 0, 0, 0, 1],
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1],
      ],
    },
  ];

  // Function to render a prize pattern as a grid of "X" (filled) and "-" (empty)
  const renderPrizePattern = (pattern) => {
    return pattern.map((row, rowIndex) => (
      <div key={rowIndex} className="flex justify-center space-x-1">
        {row.map((cell, colIndex) => (
          <div
            key={colIndex}
            className={`w-8 h-8 flex justify-center mb-1 items-center rounded-lg ${
              cell === 1 ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            {cell === 1 ? "X" : "-"}
          </div>
        ))}
      </div>
    ));
  };

  // Effect to handle ball dispensing at regular intervals
  useEffect(() => {
    let interval;
    if (gameStarted && ballsDispensed < 40 && !ballsDispensedComplete) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:8000/dispense"); // API call to dispense a ball
          const data = await response.json();

          if (data.ball) {
            setBalls((prev) => [...prev, data.ball]); // Add ball to list
            setBallsDispensed((prev) => prev + 1); // Update count of balls dispensed
          } else {
            clearInterval(interval); // Stop interval when no more balls
            setGameStarted(false);
            setGameEnded(true);
            setBallsDispensedComplete(true);
          }
        } catch (error) {
          clearInterval(interval); // Handle errors gracefully
          console.error("Error dispensing ball:", error);
        }
      }, 500); // Dispense a ball every 500ms
    }

    return () => clearInterval(interval); // Cleanup interval on unmount or dependency change
  }, [gameStarted, ballsDispensed, ballsDispensedComplete]);

  // Function to check for winning patterns on the user's cards
  const checkWinningPattern = () => {
    if (!cards.length || !balls.length) {
      return;
    }

    let totalPrize = 0; // Total prize won
    let anyWinningPattern = false; // Flag to check if any pattern matches

    cards.forEach((card) => {
      prizes.forEach(({ pattern, value }) => {
        let match = true;

        // Compare card numbers with the prize pattern
        for (let rIndex = 0; rIndex < 3; rIndex++) {
          for (let cIndex = 0; cIndex < 5; cIndex++) {
            if (
              pattern[rIndex][cIndex] === 1 &&
              !balls.includes(card[rIndex][cIndex])
            ) {
              match = false;
              break;
            }
            if (
              pattern[rIndex][cIndex] === 0 &&
              balls.includes(card[rIndex][cIndex])
            ) {
              match = false;
              break;
            }
          }
        }

        if (match) {
          totalPrize += value; // Add prize value
          anyWinningPattern = true;
        }
      });
    });

    // Update game state based on winning or losing
    if (anyWinningPattern) {
      setPrizeWon({
        status: "win",
        value: totalPrize,
        pattern: "Matching prize pattern found!",
      });
      setCoins((prev) => prev + totalPrize);
      setMessage(`You won a total of ${totalPrize} coins!`);
    } else {
      setPrizeWon({
        status: "lost",
        value: 0,
        pattern: null,
      });
      setMessage("Game Over. No prizes this time, better luck next round!");
    }
  };

  // Handle card purchase and game initialization
  const handlePurchase = async (numBets) => {
    if (gameStarted) return;

    if (coins < numBets * 5) {
      alert("Not enough coins to place the bet.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/start_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet: 5, num_bets: numBets }),
      });

      if (!response.ok) throw new Error("Failed to purchase cards");

      const data = await response.json();
      console.log("Data received from backend:", data);

      // Convert received cards into a 3x5 format
      const formattedCards = data.cards.map((card) => {
        if (!card.nums || card.nums.length !== 15) {
          throw new Error("Invalid card format. Check data.");
        }
        return Array.from({ length: 3 }, (_, rowIndex) =>
          card.nums.slice(rowIndex * 5, rowIndex * 5 + 5)
        );
      });

      // Initialize game state
      setCards(formattedCards);
      setBalls([]);
      setBallsDispensed(0);
      setPrizeWon({ status: "initial", value: null, pattern: null });
      setGameEnded(false);
      setGameStarted(true);
      setMessage("");
      setCoins(coins - numBets * 5);
    } catch (error) {
      console.error("Failed to purchase cards:", error);
    }
  };

  // Reset game to initial state
  const handleReset = () => {
    setCards([]);
    setBalls([]);
    setBallsDispensed(0);
    setPrizeWon({ status: "initial", value: null, pattern: null });
    setGameStarted(false);
    setGameEnded(false);
    setMessage("");
    setBallsDispensedComplete(false);
  };

  return (
    <div className="p-8 bg-gray-900 text-white rounded-none shadow-none">
      <h1 className="text-4xl font-bold text-center mb-6">Bingo Royale</h1>
      <p className="text-center text-2xl font-semibold mb-4">Coins: {coins}</p>

      {/* Buttons to start a game with 1, 2, or 3 bets */}
      <div className="flex justify-center gap-6 mb-6">
        <button
          onClick={() => handlePurchase(1)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg hover:scale-105 transition-all duration-300"
        >
          1 Bet
        </button>
        <button
          onClick={() => handlePurchase(2)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg hover:scale-105 transition-all duration-300"
        >
          2 Bets
        </button>
        <button
          onClick={() => handlePurchase(3)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg hover:scale-105 transition-all duration-300"
        >
          3 Bets
        </button>
      </div>

      {/* Display user cards */}
      <DisplayCards cards={cards} drawnNumbers={balls} />

      {/* Display ball dispenser */}
      <BallDispenser
        gameStarted={gameStarted}
        balls={balls}
        ballsDispensed={ballsDispensed}
        setBallsDispensed={setBallsDispensed}
        ballsDispensedComplete={ballsDispensedComplete}
      />

      {/* Display prize information */}
      <PrizeList prizeWon={prizeWon} />

      {/* Display game status messages */}
      {message && !gameStarted && !gameEnded && (
        <p className="text-center text-xl mt-4 font-semibold">{message}</p>
      )}
      {gameEnded && !message && (
        <p className="text-center text-xl mt-10 font-semibold">
          Game Over! No prizes this time, better luck next round!
        </p>
      )}

      {/* Button to reset and start a new game */}
      {gameEnded && (
        <div className="flex items-center justify-center mt-8">
          <button
            onClick={handleReset}
            className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white hover:scale-105 transition-all duration-300"
          >
            Start New Game
          </button>
        </div>
      )}

      {/* Display winning patterns */}
      <div className="mt-6">
        <h3 className="text-2xl font-semibold text-center mb-4">
          Winning Patterns
        </h3>
        <div className="grid grid-cols-6 gap-4">
          {prizes.map((prize, idx) => (
            <div
              key={idx}
              className="border-2 w-50 border-gray-300 p-4 rounded-lg"
            >
              <h4 className="text-xl font-semibold text-center">
                {prize.value} Coins
              </h4>
              {renderPrizePattern(prize.pattern)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
