import React, { useState, useEffect, useRef } from "react";
// import { useRef } from "react";

import { Chess } from "chess.js";
import {
  StepBackwardFilled,
  StepForwardFilled,
  FastBackwardOutlined,
  FastForwardOutlined,
  BulbFilled,
  FlagFilled,
  SyncOutlined,
} from "@ant-design/icons";
import { Popover } from "antd";
import { Chessboard } from "react-chessboard";
import { useNavigate, useParams } from "react-router-dom";
import moveSound from "../extrafile/move-self.mp3";
import moveCheck from "../extrafile/move-check.mp3";
import checkMate from "../extrafile/game-end.mp3";
import { useSearchParams } from "react-router-dom";
import { animateScroll } from "react-scroll";
// import {stockfish} from 'stockfish'
var stockfish2 = new Worker("stockfish.js");
const checkMateSound = new Audio(checkMate);
const moveCheckSound = new Audio(moveCheck);
const moveAudio = new Audio(moveSound);

stockfish2.postMessage("uci");
stockfish2.postMessage("uci newgame");
// let movesHistory = []
// let moveindex =Number.POSITIVE_INFINITY
// let moveFutures = []
let Computer = () => {
  // console.log('stockfish: ',stockfish2)

  let [searchParams] = useSearchParams();
  const level = searchParams.get("level");

  const [checkmate, setCheckmate] = useState(false);
  const [currGame, setcurrGame] = useState(
    new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  );
  const [analyse, setAnalyse] = useState(false);
  const [reqResign, setreqResign] = useState(false);

  const [whiteMoves, setWhiteMoves] = useState([]);
  const [movesHistory, setMoveHistory] = useState([currGame.pgn()]);
  const [moveFutures, setmoveFuture] = useState([]);
  const [blackMoves, setBlackMoves] = useState([]);
  const [moveFrom, setmoveFrom] = useState(null);
  const [promotionDialog, setPromotionDialog] = useState(false);
  const [moveTo, setMoveTo] = useState(null);
  const [optionsSquare, setOptionSquares] = useState([]);

  const [hintSquare, setHintSquare] = useState([]);
  const [yourturn, setYourTurn] = useState(true);
  const [boardWidth, setBoardWidth] = useState(calculateBoardSize());
  const [rematch, setreMatch] = useState(false);
  const [draw, setDraw] = useState(false);
  const navigate = useNavigate();
  const [currHistoryindex, setCurrHistoryindex] = useState();
  const bottomRef = useRef();
  const clickContent = (
    <div className="h-min-full w-full">
      <div className="text-white text-lg mb-4">Do You Want to Resign ?</div>
      <div className="flex justify-evenly w-full">
        <button
          onClick={() => {
            navigate("/");
          }}
          className="flex justify-center rounded-full p-2 w-4/12 text-white bg-green-500"
        >
          Yes
        </button>
        <button
          onClick={() => {
            // setreqResign(false);
          }}
          className="flex justify-center rounded-full p-2 w-4/12 text-white bg-red-500"
        >
          No
        </button>
      </div>
    </div>
  );
  const clickContentrematch = (
    <div className="h-min-full w-full">
      <div className="text-white text-lg mb-4">Rematch ? ♟️</div>
      <div className="flex justify-evenly w-full">
        <button
          onClick={() => {
            setreMatch(false);            
            setcurrGame(new Chess());
            setCheckmate(false);
            setBlackMoves([]);
            setWhiteMoves([]);
            setAnalyse(false);
            setMoveHistory([new Chess().pgn()]);
            setmoveFuture([]);
          }}
          className="flex justify-center rounded-full p-2 w-4/12 text-white bg-green-500"
        >
          Yes
        </button>
        <button
          onClick={() => {
            setreMatch(false);
          }}
          className="flex justify-center rounded-full p-2 w-4/12 text-white bg-red-500"
        >
          No
        </button>
      </div>
    </div>
  );

  //   const [moveindex,setmoveindex] = useState(Number.POSITIVE_INFINITY)
  //   let futuremove = []

  useEffect(() => {
    if (currGame.isDraw() && !analyse) {
      // console.log('draw')
      setDraw(true);
    } else if (currGame.isCheckmate() && !analyse) {
      setCheckmate(true);
    }
  });
  useEffect(() => {
    if (!(draw || checkmate)) {
      // console.log('hello bhai')
      animateScroll.scrollToBottom({
        containerId: "moves-list",
        duration: 0,
      });
    }
  }, [whiteMoves, blackMoves]);
  // stockfish2.postMessage("go depth 15");
  // stockfish2.onmessage = function(event) {
  //     //NOTE: Web Workers wrap the response in an object.
  //     console.log(event.data ? event.data : event);
  // };
  // Function to calculate the width based on the window size
  function calculateBoardSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minSide = Math.min(screenWidth, screenHeight); // Ensuring the board fits in the screen

    if (minSide < 768) {
      // For smaller devices
      if (minSide == screenHeight) {
        return minSide - 150;
      }
      return minSide - 20; // Subtract some margin for padding
    } else {
      return Math.min(500, minSide - 20); // Max size 600 or less if screen is smaller
    }
  }

  // Effect to update the board width on window resize
  useEffect(() => {
    const handleResize = () => {
      setBoardWidth(calculateBoardSize());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function getmoves(square) {
    const moves = currGame.moves({ square, verbose: true });
    // console.log(moves)
    if (moves.length === 0) {
      return false; // no possible moves
    }
    const newSquares = {};
    moves.map((move) => {
      // Access the piece at the target location
      const targetPiece = currGame.get(move.to);

      // Check if the target piece exists and determine its type and color
      let backgroundStyle =
        "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)";
      if (targetPiece) {
        const isOpponentPiece =
          targetPiece.color !== currGame.get(square).color;
        const isKing = targetPiece.type === "k";

        if (isKing) {
          // Change background to red if there's a king on the target square
          backgroundStyle = "radial-gradient(circle, red 25%, transparent 25%)";
        } else if (isOpponentPiece) {
          // Apply different style for opponent's non-king pieces
          backgroundStyle =
            "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)";
        }
      }

      // Set the style for this square
      newSquares[move.to] = {
        background: backgroundStyle,
        borderRadius: "50%",
      };

      return move;
    });

    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);

    return true;
  }

  function onSquareClicked(square) {
    if (analyse) {
      return;
    }
    // console.log(currGame.turn());
    if (currGame.turn() === "b") {
      return;
    }
    if (!moveFrom) {
      const hasMoves = getmoves(square);
      if (hasMoves) setmoveFrom(square);
      return;
    } // console.log(moveTo);

    if (!moveTo) {
      const moves = currGame.moves({ moveFrom, verbose: true });
      const isValidMove = moves.find(
        (move) => move.from === moveFrom && move.to === square
      );
      if (!isValidMove) {
        const hasValidMove = getmoves(square);
        if (hasValidMove) {
          setmoveFrom(square);
        } else {
          setmoveFrom("");
        }
        return;
      }
      setMoveTo(square);
      if (
        (isValidMove.color === "w" &&
          isValidMove.piece === "p" &&
          square[1] === "8") ||
        (isValidMove.color === "b" &&
          isValidMove.piece === "p" &&
          square[1] === "1")
      ) {
        setPromotionDialog(true);
        return;
      }
      executeMove({ from: moveFrom, to: square });
    }
  }

  function executeMove(moveDetails) {
    const move = currGame.move({
      from: moveDetails.from,
      to: moveDetails.to,
    });

    // const move = gameCopy.move({
    //     from: moveDetails.from,
    //     to: moveDetails.to,
    // });
    // console.log(move);

    if (move === null) {
      const hasMoveOptions = getmoves(moveDetails.to);
      if (hasMoveOptions) setmoveFrom(moveDetails.to);
      return;
    }
    movesHistory.push(currGame.pgn());
    setCurrHistoryindex(movesHistory.length - 1);
    setWhiteMoves((whiteMoves) => whiteMoves.slice(0, currHistoryindex / 2));
    console.log(whiteMoves);
    setWhiteMoves((whiteMoves) => [...whiteMoves, move.san]);
    setBlackMoves((blackMoves) =>
      blackMoves.slice(0, (currHistoryindex + 1) / 2)
    ); // setcurrGame(gameCopy);
    playSoundBasedOnGameState(currGame);

    setmoveFuture([]);
    setYourTurn((yourTurn) => !yourTurn);
    setmoveFrom(null);
    setMoveTo(null);
    setOptionSquares({});
    setHintSquare([]);

    if (!currGame.isGameOver()) {
      setTimeout(() => {
        automateOpponentMove();
      }, 500);
    }
  }

  async function automateOpponentMove() {
    stockfish2.postMessage("position fen " + currGame.fen());
    stockfish2.postMessage(`go depth ${level}`);
    // console.log(currGame.fen());

    stockfish2.onmessage = function (event) {
      // console.log("From Stockfish:", event.data ? event.data : event);
      if (event.data.startsWith("bestmove")) {
        const bestMove = event.data.split(" ")[1];
        console.log("Best Move:", bestMove);
        // You can make the move on the board

        const move = currGame.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: "q",
        }); // Assumes promotion to queen
        movesHistory.push(currGame.pgn());
        setCurrHistoryindex(movesHistory.length - 1);

        setmoveFuture([]);
        setBlackMoves((blackMoves) => [...blackMoves, move.san]);
        playSoundBasedOnGameState(currGame);
        setYourTurn((yourTurn) => !yourTurn);
      }
    };
    // const gamecpy = new Chess(currGame.fen())
    // const nextMove = minmax(gamecpy, level,Number.NEGATIVE_INFINITY,Number.POSITIVE_INFINITY, true, 0, gamecpy.turn())[0];
    // if (nextMove) {
    //     // gamecpy.move(nextMove);
    //     currGame.move(nextMove)
    //     // setcurrGame(gamecpy);
    //     playSoundBasedOnGameState(currGame);
    //     setYourTurn(yourTurn => !yourTurn);
    // }
  }

  function playSoundBasedOnGameState(game) {
    if (game.isCheckmate()) {
      setCheckmate(true);
      checkMateSound
        .play()
        .catch((error) => console.error("Error playing the sound:", error));
    } else {
      moveAudio
        .play()
        .catch((error) => console.error("Error playing the sound:", error));
    }
  }

  function onPromotionPieceSelect(piece) {
    // if no piece passed then user has cancelled dialog, don't make move and reset
    if (piece) {
      //   const gameCopy = currGame ;

      const move = currGame.move({
        from: moveFrom,
        to: moveTo,
        promotion: piece[1].toLowerCase() ?? "q",
      });
      movesHistory.push(currGame.pgn());
      setCurrHistoryindex(movesHistory.length - 1);
      setWhiteMoves((whiteMoves) => [...whiteMoves, move.san]);
    }
    setmoveFrom("");
    setYourTurn((yourturn) => !yourturn);
    moveFutures = [];
    setMoveTo(null);
    setPromotionDialog(false);
    setOptionSquares({});
    setHintSquare([]);
    return true;
  }
  function ShowHint() {
    // console.log(Object.keys(hintSquare).length);
    if (Object.keys(hintSquare).length > 0) {
      setHintSquare([]);
      return;
    }
    if (currGame.turn() === "b") {
      return;
    }

    stockfish2.postMessage("position fen " + currGame.fen());
    stockfish2.postMessage(`go depth ${level}`);
    stockfish2.onmessage = function (event) {
      // console.log("From Stockfish:", event.data ? event.data : event);
      if (event.data.startsWith("bestmove")) {
        const bestMove = event.data.split(" ")[1];
        console.log("Best Move:", bestMove);
        // You can make the move on the board
        const hintmoves = {};
        //   from: bestMove.substring(0, 2),
        //   to: bestMove.substring(2, 4),
        hintmoves[bestMove.substring(0, 2)] = {
          background: "rgba(255, 0, 0, 0.4)", // Semi-transparent red
        };

        hintmoves[bestMove.substring(2, 4)] = {
          background: "rgba(255, 0, 0, 0.4)", // Semi-transparent red
        };
        setHintSquare(hintmoves);
      }
    };
  }
  function undoGame() {
    // currGame.undo()
    if (movesHistory.length - 1 < 1) {
      console.log("no history");
      return false;
    }
    const move = movesHistory.pop();
    moveFutures.push(move);
    const gamecpy = new Chess();
    gamecpy.loadPgn(movesHistory[movesHistory.length - 1]);
    setCurrHistoryindex(movesHistory.length - 1);
    moveAudio.play();
    animateScroll.scrollTo(-15 * currHistoryindex, {
      containerId: "moves-list",
      duration: 0,
    });
    setcurrGame(gamecpy);
    setHintSquare([]);
    setOptionSquares([]);
    return true;
  }

  function redoGame() {
    if (moveFutures.length < 1) {
      console.log("no future");
      return false;
    }
    const move = moveFutures.pop();
    const gamecpy = new Chess();
    gamecpy.loadPgn(move);
    setcurrGame(gamecpy);
    moveAudio.play();
    movesHistory.push(move);
    setCurrHistoryindex(movesHistory.length - 1);
    animateScroll.scrollTo(currHistoryindex * 15, {
      containerId: "moves-list",
      duration: 0,
    });
    setHintSquare([]);
    setOptionSquares([]);
    return true;
  }
  function undoAll() {
    while (undoGame()) {
      console.log("hello bhai");
    }
  }
  function redoAll() {
    while (redoGame()) {
      console.log("hello bhai redo");
    }
  }
  if (level != 2 && level != 8 && level != 15) {
    return (
      <div className="h-screen w-screen bg-black flex justify-center items-center">
        <div className="rounded-lg text-xl font-semibold text-white bg-zinc-800 p-10 ">
          <div>♟️Page Not Found ♟️</div>
          <div
            onClick={() => {
              navigate("/");
            }}
            className="text-purple-300 cursor-pointer w-full flex justify-center mt-5 text-lg underline"
          >
            Click Here To Main Site
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="min-w-screen p-3 min-h-screen flex flex-row justify-evenly items-center bg-black">
        {draw && (
          <div className="flex flex-col items-center w-min-fit bg-zinc-700 rounded-2xl p-5">
            <div className="text-white text-3xl mt-3 mb-5 font-semibold">
              👑 Draw ! 👑
            </div>
            <div className="flex gap-5">
              <button
                onClick={() => {
                  setcurrGame(new Chess());
                  setBlackMoves([]);
                  setWhiteMoves([]);
                  setDraw(false);
                  setAnalyse(false);
                  setMoveHistory([new Chess().pgn()]);
                  setmoveFuture([]);
                }}
                className=" bg-red-500 mt-5 text-white font-bold mb-2 rounded-2xl p-4 px-8   text-2xl flex gap-10 items-center justify-center opacity-90 transition hover:bg-black"
              >
                Rematch
              </button>
              <button
                onClick={() => {
                  navigate("/");
                }}
                className=" bg-green-500 mt-5 text-white font-bold mb-2 rounded-2xl p-4 px-8   text-lg flex gap-10 items-center justify-center opacity-90 transition hover:bg-black"
              >
                Main Menu
              </button>
              <button
                onClick={() => {
                  setAnalyse(true);
                  setDraw(false);
                }}
                className=" bg-green-500 mt-5 text-white font-bold mb-2 rounded-2xl p-4 px-8   text-lg flex gap-10 items-center justify-center opacity-90 transition hover:bg-black"
              >
                Analyse
              </button>
            </div>
          </div>
        )}
        {checkmate && (
          <div className="flex flex-col items-center w-min-fit bg-zinc-700 rounded-2xl p-5">
            <div className="text-white text-3xl mt-3 mb-5 font-semibold">
              👑 Check Mate ! 👑
            </div>
            <div className="text-white text-3xl mt-3 mb-5 font-semibold">
              {currGame.turn() == "b" ? "White" : "Black"} Won
            </div>
            <div className="flex gap-5">
              <button
                onClick={() => {
                  setcurrGame(new Chess());
                  setCheckmate(false);
                  setBlackMoves([]);
                  setWhiteMoves([]);
                  setAnalyse(false);
                  setMoveHistory([new Chess().pgn()]);
                  setmoveFuture([]);
                }}
                className=" bg-red-500 mt-5 text-white font-bold mb-2 rounded-2xl p-4 px-8   text-2xl flex gap-10 items-center justify-center opacity-90 transition hover:bg-black"
              >
                Rematch
              </button>
              <button
                onClick={() => {
                  navigate("/");
                }}
                className=" bg-green-500 mt-5 text-white font-bold mb-2 rounded-2xl p-4 px-8   text-lg flex gap-10 items-center justify-center opacity-90 transition hover:bg-black"
              >
                Main Menu
              </button>
              <button
                onClick={() => {
                  setAnalyse(true);
                  setCheckmate(false);
                }}
                className=" bg-green-500 mt-5 text-white font-bold mb-2 rounded-2xl p-4 px-8   text-lg flex gap-10 items-center justify-center opacity-90 transition hover:bg-black"
              >
                Analyse
              </button>
            </div>
          </div>
        )}

        {!(checkmate || draw) && (
          <div className="flex flex-col gap-10 lg:flex-row items-center">
            <Chessboard
              onSquareClick={onSquareClicked}
              arePiecesDraggable={false}
              autoPromoteToQueen={false}
              position={currGame.fen()}
              areArrowsAllowed={false}
              onPromotionPieceSelect={onPromotionPieceSelect}
              boardWidth={boardWidth}
              promotionToSquare={moveTo}
              showPromotionDialog={promotionDialog}
              customBoardStyle={{
                boxShadow: "0 2px 10px rgba(255, 255, 255, 0.5)", // Centers the board
              }}
              customSquareStyles={{
                ...optionsSquare,
                ...hintSquare,
              }}
            />
            <div
              className="flex flex-col  items-center rounded-xl bg-zinc-900 hover:shadow-xl"
              style={{ width: boardWidth }}
            >
              <div className="w-full flex items-center gap-2 p-5 text-white ">
                <div className="bg-green-600 h-3 w-3 rounded-full"></div>
                Stockfish Level {level}
              </div>
              <div className="bg-gray-800 flex item-center h-10 justify-evenly w-full ">
                <div className="text-lg w-2/12 flex items-center justify-center text-white">
                  #
                </div>
                <div className="flex w-10/12">
                  <button
                    onClick={undoAll}
                    className="hover:bg-green-800 w-3/12"
                  >
                    <StepBackwardFilled
                      style={{ color: "white", fontSize: "1.2rem" }}
                    />
                  </button>
                  <button
                    onClick={undoGame}
                    className="hover:bg-green-800 w-3/12"
                  >
                    <FastBackwardOutlined
                      style={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </button>
                  <button
                    onClick={redoGame}
                    className="hover:bg-green-800 w-3/12"
                  >
                    <FastForwardOutlined
                      style={{ color: "white", fontSize: "1.3rem" }}
                    />
                  </button>
                  <button
                    onClick={redoAll}
                    className="hover:bg-green-800 w-3/12"
                  >
                    <StepForwardFilled
                      style={{ color: "white", fontSize: "1.2rem" }}
                    />
                  </button>
                </div>
              </div>
              <div className="w-full flex  bg-zinc-800">
                <div
                  id="moves-list"
                  className="flex  h-48 w-full overflow-y-auto "
                >
                  <div className="w-2/12 h-full ">
                    {whiteMoves?.map((move, index) => (
                      <div className="p-1 bg-gray-800 flex justify-center text-white">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  <div className="flex  w-10/12">
                    <div className="w-6/12 h-full">
                      {whiteMoves?.map((move, index) => {
                        console.log(currHistoryindex);
                        if (currHistoryindex % 2 == 0) {
                          const temp = currHistoryindex / 2;
                          if (index == temp) {
                            if (index % 2 == 0) {
                              return (
                                <div className="bg-sky-800 p-1 hover:bg-sky-950 text-white rounded-s-sm">
                                  {move}{" "}
                                </div>
                              );
                            }
                            return (
                              <div className="bg-sky-800 p-1 hover:bg-sky-950 text-white rounded-s-sm">
                                {move}{" "}
                              </div>
                            );
                          }
                        }
                        if (index % 2 == 0) {
                          return (
                            <div className="bg-zinc-800 hover:bg-sky-950 p-1 text-white ">
                              {move}{" "}
                            </div>
                          );
                        }
                        return (
                          <div className=" p-1 bg-zinc-800 hover:bg-sky-950 text-white ">
                            {move}
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-6/12 h-full">
                      <div></div>
                      {blackMoves?.map((move, index) => {
                        console.log("black" + currHistoryindex);
                        if (currHistoryindex % 2 == 1) {
                          const temp = (currHistoryindex - 1) / 2;
                          console.log(temp);
                          if (index == temp) {
                            if (index % 2 == 0) {
                              return (
                                <div className="bg-sky-800 p-1 hover:bg-sky-950 text-white rounded-s-sm">
                                  {move}
                                </div>
                              );
                            }
                            return (
                              <div className="bg-sky-800 p-1 hover:bg-sky-950 text-white rounded-s-sm">
                                {move}
                              </div>
                            );
                          }
                        }
                        if (index % 2 == 0) {
                          return (
                            <div className="bg-zinc-800 p-1 hover:bg-sky-950 text-white rounded-e-sm">
                              {move}{" "}
                            </div>
                          );
                        }
                        return (
                          <div className=" p-1 bg-zinc-800 hover:bg-sky-950 text-white rounded-e-sm">
                            {move}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-full justify-between p-5 gap-5">
                <div className="w-full flex items-center  gap-2 text-white ">
                  <div className="bg-green-600 h-3 w-3 rounded-full"></div>
                  Anonymous
                </div>
                <button
                  onClick={ShowHint}
                  className={`bg-${
                    hintSquare.length == 0 ? "zinc-800" : "amber-500"
                  } p-3 text-white font-semibold rounded-md transition ease-in-out delay-150  hover:-translate-y-1 hover:scale-110 hover:bg-amber-700 duration-300`}
                >
                  <BulbFilled
                    style={{
                      color: `${hintSquare.length == 0 ? "white" : "yellow"}`,
                    }}
                  />
                </button>
                <Popover
                  content={clickContentrematch}
                  placement="bottom"
                  color="rgb(39 39 42)"
                  // open={rematch}
                >
                  <button
                    
                    className={` p-3 text-white font-semibold rounded-md transition ease-in-out delay-150  hover:-translate-y-1 hover:scale-110 hover:bg-green-500 duration-300`}
                  >
                    <SyncOutlined
                      style={{ color: `white`, fontWeight: "bolder" }}
                    />
                  </button>
                </Popover>
                <Popover
                  content={clickContent}
                  placement="bottom"
                  color="rgb(39 39 42)"
                  // open={reqResign}
                >
                  <button
                    
                      
                    className={` p-3 text-white font-semibold rounded-md transition ease-in-out delay-150  hover:-translate-y-1 hover:scale-110 hover:bg-red-500 duration-300`}
                  >
                    <FlagFilled style={{ color: `white` }} />
                  </button>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Computer;
