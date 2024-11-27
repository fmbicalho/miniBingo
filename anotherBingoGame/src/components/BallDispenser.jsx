import React, { useEffect } from "react";

// Component for displaying the current state of the ball dispenser
const BallDispenser = ({ gameStarted, balls }) => {
  
  useEffect(() => {
  }, [gameStarted]); // Dependency array ensures this effect runs only when gameStarted changes

  return (
    <div className="mt-6 text-center">
      <div className="flex justify-center items-center space-x-4">
        <div
          className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-center items-center text-4xl font-bold shadow-2xl animate-pulse"
          style={{ animationDuration: "2s" }}
        >
          {balls.length > 0 ? balls[balls.length - 1] : "?"}
        </div>

        {gameStarted && balls.length < 40 && (
          <p className="text-white text-lg font-semibold animate-pulse">
            Ball Dispensing...
          </p>
        )}
      </div>
    </div>
  );
};

export default BallDispenser;
