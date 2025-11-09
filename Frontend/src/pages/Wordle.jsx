import "react-toastify/dist/ReactToastify.css";
import "../styles/App.css";

import { createContext, useState, useEffect } from "react";

import Modal from "../components/Modal";
import { toast, Slide } from "react-toastify";

import Board from "../components/Game/Board";
import Keyboard from "../components/Game/Keyboard";
import GameOver from "../components/Game/GameOver";
import { boardDefault, generateGameWords } from "../components/Game/Words";
import { useNavigate } from "react-router-dom";

import { getToken, checkToken } from "../services/Token.services";
import LogoutButton from "../components/LogoutButton";

export const WordleContext = createContext();

const Wordle = () => {
  // Estados
  const [board, setBoard] = useState(boardDefault);
  const [currAttempt, setCurrAttempt] = useState({ attempt: 0, letterPos: 0 });
  const [wordBank, setWordBank] = useState(new Set());
  const [correctWord, setCorrectWord] = useState("");
  const [disabledLetters, setDisabledLetters] = useState([]);
  const [gameOver, setGameOver] = useState({
    gameOver: false,
    guessedWord: false,
  });

  const navigate = useNavigate();

  const toastConfig = {
    autoClose: 3000,
    theme: "dark",
    transition: Slide,
  };

  const saveGame = async (didWin, attemptsCount) => {
    const token = getToken(navigate);
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/save_game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ didWin, attemptsCount }),
      });

      checkToken(response, navigate);

      const data = await response.json();
      console.log("Partida guardada:", data.message);
    } catch (error) {
      console.error("Error al guardar partida:", error);
      toast.error("Error al guardar la partida.", toastConfig);
    }
  };

  const resetGame = async () => {
    const newBoard = boardDefault.map((row) => row.map(() => ""));

    setBoard(newBoard);
    setCurrAttempt({ attempt: 0, letterPos: 0 });
    setDisabledLetters([]);
    setGameOver({ gameOver: false, guessedWord: false });

    const words = await generateGameWords(navigate);
    if (words) {
      setWordBank(words.wordBank);
      setCorrectWord(words.correctWord);
      console.log("Nueva partida:", words);
    }
  };

  useEffect(() => {
    generateGameWords(navigate).then((words) => {
      if (words) {
        setWordBank(words.wordBank);
        setCorrectWord(words.correctWord);
        console.log("Palabras cargadas:", words);
      }
    });
  }, [navigate]);

  const onSelectLetter = (keyVal) => {
    if (currAttempt.letterPos > 4) return;
    const newBoard = board.map((row) => [...row]);
    newBoard[currAttempt.attempt][currAttempt.letterPos] = keyVal;
    setBoard(newBoard);
    setCurrAttempt({ ...currAttempt, letterPos: currAttempt.letterPos + 1 });
  };

  const onEnter = () => {
    if (currAttempt.letterPos !== 5) return; // No completó la fila entera de letras

    let currWord = "";
    for (let i = 0; i < 5; i++) {
      currWord += board[currAttempt.attempt][i];
    }

    const currentAttemptIndex = currAttempt.attempt; // Se guarda el intento actual por el que vamos

    //  Valida si la palabra existe
    if (!wordBank.has(currWord.toUpperCase())) {
      toast.error("Palabra no válida", toastConfig);
      return;
    }

    // La palabra es válida, pasar al siguiente intento
    setCurrAttempt({ attempt: currentAttemptIndex + 1, letterPos: 0 });

    // Se chequea si ganó
    if (currWord.toUpperCase() === correctWord) {
      setGameOver({ gameOver: true, guessedWord: true });
      // Llamamos a saveGame para guardar la partida (true, y el número de intento 1-6)
      saveGame(true, currentAttemptIndex + 1);
      return;
    }

    // 4. Se chequea si PERDIÓ (si acaba de terminar el último intento, índice 5)
    if (currentAttemptIndex === 5) {
      setGameOver({ gameOver: true, guessedWord: false });
      // Llamamos a saveGame para guardar la partida (false, -1 para indicar derrota)
      saveGame(false, -1);
    }
  };

  const onDelete = () => {
    if (currAttempt.letterPos === 0) return;
    const newBoard = board.map((row) => [...row]);
    newBoard[currAttempt.attempt][currAttempt.letterPos - 1] = "";
    setBoard(newBoard);
    setCurrAttempt({ ...currAttempt, letterPos: currAttempt.letterPos - 1 });
  };

  return (
    <div className="App">
      <WordleContext.Provider
        value={{
          board,
          setBoard,
          currAttempt,
          setCurrAttempt,
          onSelectLetter,
          onEnter,
          onDelete,
          correctWord,
          setDisabledLetters,
          disabledLetters,
          gameOver,
          setGameOver,
          resetGame,
        }}
      >
        <nav>
          <h1>Wordle</h1>
          <LogoutButton />
        </nav>

        <div className="botones">
          <button onClick={() => navigate("/ranking")}>Ranking</button>
          <button onClick={() => navigate("/perfil")}>Perfil</button>
          <button onClick={() => navigate("/equipos")}>Equipos</button>
          <button onClick={() => navigate("/torneos")}>Torneos</button>
        </div>

        <div className="game">
          <Board />

          {gameOver.gameOver ? (
            <Modal isOpen={gameOver.gameOver} onClose={resetGame}>
              <GameOver />
            </Modal>
          ) : (
            <Keyboard />
          )}
        </div>
      </WordleContext.Provider>
    </div>
  );
};

export default Wordle;
