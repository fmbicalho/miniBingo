const PrizeList = ({ prizeWon }) => {
  // If `prizeWon` is null or its status is 'initial', don't render anything
  if (!prizeWon || prizeWon.status === "initial") {
    return null;
  }

  return (
    <div className="mt-6 text-center">
      {/* Check if the player has won */}
      {prizeWon.status === "win" ? (
        <div className="bg-green-500 p-6 rounded-lg shadow-lg text-white font-bold text-2xl">
          <h3>Congratulations!</h3>
          <p>You won {prizeWon.value} coins!</p>
          {/* Display the pattern associated with the prize */}
          <p className="text-lg mt-2">Pattern:</p>
          <pre className="bg-black text-yellow-500 p-4 mt-2 font-mono text-lg">
            {prizeWon.pattern}
          </pre>
        </div>
      ) : (
        <div className="bg-red-500 p-6 rounded-lg shadow-lg text-white font-bold text-xl">
          <h3>Game Over</h3>
          <p>No prizes this time, better luck next round!</p>
        </div>
      )}
    </div>
  );
};

export default PrizeList;
