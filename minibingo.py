import contextlib
import random


def do_log(msg):
    print(("    " * LOG_INDENT) + msg)


def no_log(msg):
    pass


log = do_log
LOG_INDENT = 0


@contextlib.contextmanager
def indent_log():
    global LOG_INDENT
    LOG_INDENT += 1
    yield
    LOG_INDENT -= 1


@contextlib.contextmanager
def suppress_log():
    global log
    orig_log = log
    log = no_log
    yield
    log = orig_log


def draw(n=30):
    """Draw a sample of 'n' different numbers in the range [1, 60]."""
    return set(random.sample(range(1, 61), n))


def str_to_mask(mask_str, hit_symbol="X"):
    """Convert a string representing a card mask to a list of booleans."""
    return [char == hit_symbol for char in mask_str]


def mask_to_str(mask, hit_symbol="X", miss_symbol="-"):
    """Inverse of str_to_mask()."""
    return "".join(hit_symbol if m else miss_symbol for m in mask)


class Card(object):
    def __init__(self, nums):
        self.nums = list(nums)

    def __repr__(self):
        return repr(self.nums)

    def hits(self, draw):
        """List of booleans indicating whether each cell's number is part of the 'draw'."""
        """
        Here we check if each number on the card is in the drawn numbers.
        It returns a list of True/False values:
        - True if the number is in the draw
        - False if it's not
        """
        return [num in draw for num in self.nums]


class Prize(object):
    def __init__(self, value, mask):
        self.value = value
        self.mask = mask

    def __repr__(self):
        return "{} (value={})".format(mask_to_str(self.mask), self.value)

    def check(self, card_hits):
        """True iff the given 'card_hits' list contains this prize."""
        """
        And here we checks if the 'card_hits' match the prize pattern.
        - It compares each hit on the card to the prize's mask.
        - If all the numbers that should be marked (based on the mask) are hit,
          it returns True (meaning the prize is won).
        """
        return all(ch or not pm for ch, pm in zip(card_hits, self.mask))


class Game(object):
    def __init__(self, prizes=()):
        self.prizes = list(prizes)


class Player(object):
    def __init__(self, game, cards, balance=100):
        self.game = game
        self.cards = cards
        self.balance = balance

    def play(self, bet=1):
        self.place_bet(bet)
        nums = draw()
        log("Draw: {}".format(sorted(nums)))
        prizes_won = list(self.check_cards(nums))
        if len(prizes_won) > 0:
            log("Awarding prizes:")
            with indent_log():
                for prize in prizes_won:
                    self.award_winnings(prize, bet)
        log("Balance after play: {}".format(self.balance))
        return prizes_won

    def check_cards(self, nums):
        """Verify prizes against all cards and return an iterable of all prizes won."""
        """
        Here we go through each card and check if it hits any prize.
        - It looks at all the cards the player has and checks if they hit any prize
          based on the drawn numbers.
        """
        for card in self.cards:
            yield from self.check_card(card, nums)

    def check_card(self, card, nums):
        """Verify prizes against a given card and return an iterable of all prizes won."""
        log("Checking card: {}".format(card))
        card_hits = card.hits(nums)
        with indent_log():
            log("Card hits: {}".format(mask_to_str(card_hits)))
            for prize in self.game.prizes:
                log("Checking prize: {}".format(prize))
                if prize.check(card_hits):
                    with indent_log():
                        log("Prize won!")
                        yield prize

    def place_bet(self, bet):
        log("Placing bet: {}".format(bet))
        """
        We check if the player can afford the bet and subtract it from their balance.
        - The bet is multiplied by the number of cards the player has.
        - If the balance is insufficient, an error is raised.
        """
        total_bet = bet * len(self.cards)
        if self.balance < total_bet:
            raise ValueError("Insufficient balance")
        self.add_balance(-total_bet)

    def award_winnings(self, prize, bet):
        log("Awarding winnings for {} with bet {}.".format(prize, bet))
        """
        Award the player their winnings based on the prize and bet amount.
        - The prize value is multiplied by the bet to calculate the winnings.
        """
        winnings = prize.value * bet
        self.add_balance(winnings)

    def add_balance(self, delta):
        new_balance = self.balance + delta
        log("Balance change: {} {:+d} => {}".format(self.balance, delta, new_balance))
        if new_balance < 0.0:
            raise ValueError("attempting to set negative balance")
        self.balance = new_balance


# Global list of bingo prizes.
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


def init(seed=None):
    random.seed(seed)
    return Player(
        game=Game(prizes=PRIZES),
        cards=[Card(draw(15)) for _ in range(5)],
        balance=2000,
    )


def main(nplays=11883):
    player = init(seed=0)
    with suppress_log():
        for _ in range(nplays-1):
            player.play(bet=random.choice([1, 2, 3]))
    player.play(bet=random.choice([1, 2, 3]))
    return player


# VERSION: 0.4
if __name__ == "__main__":
    main()
