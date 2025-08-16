"use client";

import React, { useEffect, useState } from "react";
import { words } from "../Constants/words";
import { useAccount } from 'wagmi';
// Removed direct database imports - using API routes instead

const today = new Date().toISOString().slice(0, 10);
const wordOfTheDay = words[Math.floor(
  (new Date(today).getTime() / (1000 * 60 * 60 * 24)) % words.length
)].toUpperCase();

const MAX_ATTEMPTS = 5;
const WORD_LENGTH = 5;

interface WordleProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  selectedMarket?: string;
}

export default function Wordle({ activeSection, setActiveSection, selectedMarket }: WordleProps) {
  const { address, isConnected } = useAccount();
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [isWinner, setIsWinner] = useState(false);
  const [error, setError] = useState("");
  const [canPlay, setCanPlay] = useState<boolean | null>(null);
  const [timeUntilNextPlay, setTimeUntilNextPlay] = useState<string>("");
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);

  // Check if user can play when component mounts
  useEffect(() => {
    const checkEligibility = async () => {
      if (!address || !isConnected) {
        setCanPlay(true); // Anonymous users can play
        setIsCheckingEligibility(false);
        return;
      }

      try {
        const response = await fetch(`/api/wordle/check-eligibility?wallet=${address}`);
        const data = await response.json();
        setCanPlay(data.canPlay);
        
        if (!data.canPlay && data.nextPlayTime) {
          // Calculate time remaining
          const nextPlay = new Date(data.nextPlayTime);
          const now = new Date();
          const timeLeft = nextPlay.getTime() - now.getTime();
          
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            setTimeUntilNextPlay(`${hours}h ${minutes}m`);
          }
        }
      } catch (err) {
        console.error("Error checking eligibility:", err);
        setCanPlay(true); // Default to allowing play on error
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [address, isConnected]);

  useEffect(() => {
    // Check if someone already won today
    (async () => {
      try {
        const response = await fetch(`/api/wordle/winner?date=${today}`);
        const data = await response.json();
        if (data.winners && data.winners.length > 0) {
          setMessage("Today's puzzle has already been solved by someone else!");
        }
      } catch (err) {
        console.error("Error fetching winner:", err);
        setError("Failed to check today's winner. Try again later.");
        setGameOver(true);
      }
    })();
  }, []);

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (gameOver) return;
    if (e.key === "Enter" && currentGuess.length === WORD_LENGTH) {
      submitGuess();
    }
  }

  async function submitGuess() {
    const guess = currentGuess.toUpperCase();
    if (guess.length !== WORD_LENGTH ) {
      setError("Please enter a valid 5-letter word.");
      return;
    }
    setError("");

    // Record play on first guess for connected users
    if (guesses.length === 0 && address && isConnected) {
      try {
        await fetch('/api/wordle/record-play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address })
        });
      } catch (err) {
        console.error("Error recording play:", err);
      }
    }

    const updatedGuesses = [...guesses, guess];
    setGuesses(updatedGuesses);
    setCurrentGuess("");

    if (guess === wordOfTheDay) {
      // Re-check for winner to prevent race condition
      try {
        const checkResponse = await fetch(`/api/wordle/winner?date=${today}`);
        const checkData = await checkResponse.json();
        if (checkData.winners && checkData.winners.length > 0) {
          setGameOver(true);
          setMessage("Too late! Someone else solved today's puzzle first!");
          return;
        }

        // Attempt to save as winner
        try {
          const saveResponse = await fetch('/api/wordle/winner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: today, word: wordOfTheDay, winner: address || "Anonymous" })
          });
          
          if (saveResponse.ok) {
            setIsWinner(true);
            setGameOver(true);
            setMessage("🎉 You won! You're the first to solve today's puzzle! 🎁 Free pot entry earned!");
          } else {
            setError("Failed to save your win. Someone may have won first.");
            setGameOver(true);
          }
        } catch (err) {
          console.error("Error saving winner:", err);
          setError("Failed to save your win. Someone may have won first.");
          setGameOver(true);
        }
      } catch (err) {
        console.error("Error checking winner:", err);
        setError("Network error. Please try again.");
        setGameOver(true);
      }
    } else if (updatedGuesses.length >= MAX_ATTEMPTS) {
      setGameOver(true);
      setMessage("Game Over! Try again tomorrow.");
    }
  }

  function isGuessCorrect(guess: string) {
    return guess === wordOfTheDay;
  }

  function getAttemptLabel(attemptNumber: number) {
    const labels = [
      "First attempt",
      "Second attempt", 
      "Third attempt",
      "Fourth attempt",
      "Fifth attempt"
    ];
    return labels[attemptNumber] || `Attempt ${attemptNumber + 1}`;
  }

  function getLetterStatus(letter: string, index: number, guess: string) {
    if (wordOfTheDay[index] === letter) return "correct";

    // Count letters in wordOfTheDay and guess to handle duplicates
    const wordLetters = wordOfTheDay.split("");
    const guessLetters = guess.split("");
    const letterCountInWord = wordLetters.reduce((count, l) => (l === letter ? count + 1 : count), 0);
    let correctOrPresentCount = 0;

    // Count correct or present instances of this letter up to index
    for (let i = 0; i < guessLetters.length; i++) {
      if (guessLetters[i] === letter) {
        if (wordLetters[i] === letter) {
          correctOrPresentCount++; // Correct position counts toward limit
        } else if (wordLetters.includes(letter)) {
          correctOrPresentCount++; // Present counts if letter exists in word
        }
      }
      if (i >= index) break;
    }

    // Mark as present only if we haven't exceeded the letter's count and it's in the word
    if (wordLetters.includes(letter) && correctOrPresentCount < letterCountInWord) {
      return "present";
    }
    return "absent";
  }

  // Show loading while checking eligibility
  if (isCheckingEligibility) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Wordle</h1>
        <div style={styles.loading}>
          <p>Checking game eligibility...</p>
        </div>
      </div>
    );
  }

  // Show cooldown message if user can't play
  if (canPlay === false && isConnected) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Wordle</h1>
        <div style={styles.cooldownMessage}>
          <h2>🕐 Come back later!</h2>
          <p>You can play Wordle once every 24 hours.</p>
          {timeUntilNextPlay && (
            <p>Next game available in: <strong>{timeUntilNextPlay}</strong></p>
          )}
          <p style={styles.cooldownHint}>
            💡 Connect your wallet to track your progress and earn rewards!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Wordle</h1>

      {guesses.map((guess, i) => (
        <div key={i} style={styles.rowContainer}>
          <div 
            style={{
              ...styles.attemptLabel,
              color: isGuessCorrect(guess) ? "#4caf50" : "#d32f2f"
            }}
          >
            {getAttemptLabel(i)}
          </div>
          <div style={styles.row}>
            {guess.split("").map((letter, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.cell,
                  ...(getLetterStatus(letter, idx, guess) === "correct"
                    ? styles.correct
                    : getLetterStatus(letter, idx, guess) === "present"
                    ? styles.present
                    : styles.absent),
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      ))}

      {Array.from({ length: MAX_ATTEMPTS - guesses.length }).map((_, i) => (
        <div key={i} style={styles.rowContainer}>
          <div style={styles.attemptLabel}>
            {getAttemptLabel(guesses.length + i)}
          </div>
          <div style={styles.row}>
            {Array.from({ length: WORD_LENGTH }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.cell,
                  ...(i === 0 && !gameOver && idx < currentGuess.length
                    ? { ...styles.cell, backgroundColor: "#e0e0e0", color: "#000" }
                    : {}),
                }}
              >
                {i === 0 && idx < currentGuess.length ? currentGuess[idx] : ""}
              </div>
            ))}
          </div>
        </div>
      ))}

      {!gameOver && (
        <div style={styles.inputSection}>
          <div style={styles.inputLabel}>
            Enter your 5-letter word below:
          </div>
          <input
            type="text"
            maxLength={WORD_LENGTH}
            value={currentGuess}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z]*$/.test(value)) setCurrentGuess(value);
            }}
            onKeyDown={handleKeyPress}
            style={styles.input}
            autoFocus
            disabled={gameOver}
            placeholder="GUESS"
          />
          <div style={styles.inputHint}>
            Press Enter to submit your guess
          </div>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
    color: "#000",
    minHeight: "100vh",
    padding: "10px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "100vw",
    overflow: "hidden",
  },
  title: {
    fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
  },
  rowContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "10px",
  },
  attemptLabel: {
    fontSize: "0.9rem",
    fontWeight: "500",
    textAlign: "center",
    color: "#666",
    marginBottom: "5px",
  },
  row: {
    display: "flex",
    gap: "clamp(3px, 1.5vw, 5px)",
    justifyContent: "center",
  },
  cell: {
    width: "clamp(40px, 12vw, 50px)",
    height: "clamp(40px, 12vw, 50px)",
    border: "2px solid #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "#fff",
  },
  correct: { backgroundColor: "#4caf50", color: "#fff", borderColor: "#4caf50" },
  present: { backgroundColor: "#ffca28", color: "#000", borderColor: "#ffca28" },
  absent: { backgroundColor: "#b0bec5", color: "#000", borderColor: "#b0bec5" },
  inputSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "20px",
    gap: "8px",
  },
  inputLabel: {
    fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  input: {
    padding: "10px",
    fontSize: "clamp(1rem, 3vw, 1.2rem)",
    border: "2px solid #333",
    outline: "none",
    width: "clamp(120px, 40vw, 150px)",
    textAlign: "center",
    textTransform: "uppercase",
    borderRadius: "5px",
    maxWidth: "90vw",
  },
  inputHint: {
    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  message: {
    marginTop: "15px",
    fontWeight: "bold",
    fontSize: "1.1rem",
    color: "#1a3c34",
  },
  error: {
    marginTop: "10px",
    fontWeight: "bold",
    fontSize: "1rem",
    color: "#d32f2f",
  },
  loading: {
    textAlign: "center",
    fontSize: "1.1rem",
    color: "#666",
    marginTop: "50px",
  },
  cooldownMessage: {
    textAlign: "center",
    backgroundColor: "#fff3cd",
    border: "2px solid #ffeaa7",
    borderRadius: "10px",
    padding: "30px",
    margin: "50px auto",
    maxWidth: "400px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  cooldownHint: {
    fontSize: "0.9rem",
    color: "#666",
    fontStyle: "italic",
    marginTop: "15px",
  },
};