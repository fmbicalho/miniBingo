from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional

# Initialize FastAPI application
app = FastAPI()

# Global variable to store drawn numbers
drawn_numbers = []

# CORS middleware to allow requests from a specific origin (frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend address
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Prize model representing a prize with a value and a pattern mask
class Prize(BaseModel):
    value: int
    mask: List[bool]

    def check(self, card_hits):
        # Check if the card's hits match the prize's mask
        return all(ch or not pm for ch, pm in zip(card_hits, self.mask))

    def mask_string(self):
        # Generate a string representation of the prize mask (for frontend display)
        return "\n".join(
            "".join("X" if x else "-" for x in self.mask[i:i+5])
            for i in range(0, len(self.mask), 5)
        )

# Bingo card model with a list of numbers
class Card(BaseModel):
    nums: List[int]

    def hits(self, draw):
        # Check which numbers from the card are in the drawn numbers
        return [num in draw for num in self.nums]

# Player class representing a player with a balance and a list of cards
class Player:
    def __init__(self, balance=100):
        self.cards = []
        self.balance = balance

    def play(self, bet):
        # Draw numbers for the game and return the result
        nums = draw()  # Draw numbers for the game
        return {"draw": sorted(nums), "balance": self.balance}

# Function to draw 'n' random numbers between 1 and 60 (inclusive)
def draw(n=40):  # Limit to 40 numbers drawn
    return set(random.sample(range(1, 61), n))

# Convert a mask string (e.g., "XXXXX") to a list of booleans (True for 'X', False for '-')
def str_to_mask(mask_str, hit_symbol="X"):
    return [char == hit_symbol for char in mask_str]

# List of predefined Bingo prize patterns
PRIZES = [
    Prize(
        value=2000,
        mask=str_to_mask(
            "XXXXX"
            "XXXXX"
            "XXXXX"
        ),
    ),
    Prize(
        value=200,
        mask=str_to_mask(
            "X---X"
            "XXXXX"
            "X---X"
        ),
    ),
    Prize(
        value=20,
        mask=str_to_mask(
            "X---X"
            "X---X"
            "X---X"
        ),
    ),
    Prize(
        value=10,
        mask=str_to_mask(
            "--X--"
            "-X-X-"
            "X---X"
        ),
    ),
    Prize(
        value=10,
        mask=str_to_mask(
            "-----"
            "XXXXX"
            "-----"
        ),
    ),
    Prize(
        value=5,
        mask=str_to_mask(
            "X---X"
            "-----"
            "X---X"
        ),
    ),
]

# Request model for playing the game with a bet and number of bets
class PlayRequest(BaseModel):
    bet: int
    num_bets: int

# Response model for playing the game, including cards, draw, balance, and prize won
class PlayResponse(BaseModel):
    cards: List[Card]
    draw: list
    balance: int
    prize_won: Optional[Prize] = None

    class Config:
        arbitrary_types_allowed = True

# Handle preflight requests for CORS (to allow cross-origin requests)
@app.options("/play")
async def preflight():
    return JSONResponse(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "http://127.0.0.1:5173",  # Frontend address
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, *",
        }
    )

# Root endpoint to test if the server is running
@app.get("/")
async def root():
    return {"message": "Hello World"}

# GET endpoint to fetch the list of prizes with their value and mask patterns
@app.get("/prizes")
async def get_prizes():
    return {
        "prizes": [
            {"value": prize.value, "pattern": prize.mask_string()}
            for prize in PRIZES
        ]
    }

# GET endpoint to draw a set of random numbers for the game
@app.get("/numbers")
async def get_numbers():
    drawn_numbers = draw()  # Draw the numbers
    return {"numbers": sorted(drawn_numbers)}

# Endpoint to dispense a ball (random number) that hasn't been drawn yet
@app.get("/dispense")
async def dispense_ball():
    global drawn_numbers  # Access the global list of drawn numbers

    print(f"Current drawn numbers: {drawn_numbers}")  # Debug log

    if len(drawn_numbers) >= 40:  # Limit to 40 balls
        print("No more balls to dispense.")  # Debug log
        return {"ball": None}
    
    # Choose a random ball that hasn't been drawn yet
    ball = random.choice([i for i in range(1, 61) if i not in drawn_numbers])
    drawn_numbers.append(ball)  # Mark the ball as drawn
    print(f"Dispensed ball: {ball}")  # Debug log

    return {"ball": ball}

# POST endpoint to simulate a player playing the game, including betting and drawing numbers
@app.post("/play", response_model=PlayResponse)
async def play_game(request: PlayRequest):
    player = Player(balance=100)  # Create a player with a starting balance
    
    # Generate cards for the player based on the number of bets
    for _ in range(request.num_bets):
        player.cards.append(Card(nums=list(draw(15))))  # 15 numbers per card
    
    # Simulate the draw (numbers drawn for this round)
    drawn_nums = draw()  # Draw 30 random numbers for the round
    player.balance -= request.bet * request.num_bets  # Deduct bet amount from balance
    
    # Check if any player cards match any prize patterns
    prize_won = None
    for card in player.cards:
        card_hits = card.hits(drawn_nums)  # Get the hits (numbers on the card)
        for prize in PRIZES:
            if prize.check(card_hits):  # Check if the prize conditions are met
                prize_won = prize
                break
        if prize_won:
            break
    
    return {
        "draw": sorted(drawn_nums),
        "balance": player.balance,
        "prize_won": prize_won  # Include prize details if won
    }

# POST endpoint to start a new game and generate player cards
@app.post("/start_game", response_model=PlayResponse)
async def start_game(request: PlayRequest):
    player = Player(balance=100)  # Create a player with a starting balance

    # Generate cards for the player
    cards = []
    for _ in range(request.num_bets):
        card = list(draw(15))  # Draw 15 random numbers for each card
        cards.append(Card(nums=card))  # Add the card to the player's list

    # Deduct the player's balance by the total bet amount
    player.balance -= request.bet * request.num_bets

    # Simulate drawing numbers for the game
    drawn_nums = draw()

    return {
        "cards": cards,  # Return generated cards
        "balance": player.balance,
        "draw": sorted(drawn_nums),  # Return the drawn numbers
        "prize_won": None,  # No prize won initially
    }

# Default handler for unknown routes
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not Found"})
