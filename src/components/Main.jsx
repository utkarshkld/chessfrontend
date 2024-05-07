import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button, Input, Select, Space } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import moveSound from "../extrafile/move-self.mp3";
import moveCheck from "../extrafile/move-check.mp3";
import checkMate from "../extrafile/game-end.mp3";
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
import { animateScroll } from "react-scroll";
const checkMateSound = new Audio(checkMate);
const moveCheckSound = new Audio(moveCheck);
const moveAudio = new Audio(moveSound);
// window.addEventListener("beforeunload", function (e) {
//   this.localStorage.setItem(
//     "desiredUrlAfterReload",
//     "https://chessxchat.netlify.app"
//   );
//   e.preventDefault();
// });
const Main = ({ socket }) => {
  // const board = Chessborad('myboard','start')
  const { id, color } = useParams();
  const [currGame, setcurrGame] = useState(
    new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  );
  const [moveFrom, setmoveFrom] = useState(null);
  const [promotionDialog, setPromotionDialog] = useState(false);
  const [moveTo, setMoveTo] = useState(null);
  const [optionsSquare, setOptionSquares] = useState([]);
  const [yourturn, setYourTurn] = useState(
    color != currGame.turn() ? false : true
  );
  const [iresinged,setiresigned] = useState(false);
  const [resignreq,setResignreq] = useState(false);
  const [opponentdisconnected, setOpponentDisconnected] = useState(false);
  const [boardWidth, setBoardWidth] = useState(calculateBoardSize());
  const [messageList, setMessageList] = useState([]);
  const messageRef = useRef();
  const [whiteMoves, setWhiteMoves] = useState([]);
  const [blackMoves, setBlackMoves] = useState([]);
  const navigate = useNavigate();
  const clickContent = (
    <div className="h-min-full w-full">
      <div className="text-white text-lg mb-4">Do You Want to Resign ?</div>
      <div className="flex justify-evenly w-full">
        <button
          onClick={() => {
            // navigate("/");
            setiresigned(true)
            socket.emit("resign_message",{opponent:id})
          }}
          className="flex justify-center rounded-full p-2 w-4/12 text-white bg-green-500"
        >
          Yes
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
            
          }}
          className="flex justify-center rounded-full p-2 w-4/12 text-white bg-green-500"
        >
          Yes
        </button>
        
      </div>
    </div>
  );

  //   useEffect(() => {
  //     const urlAfterReload = localStorage.getItem("desiredUrlAfterReload");
  //     // console.log(urlAfterReload)
  //     if (urlAfterReload) {
  //       window.location.href = urlAfterReload;
  //       localStorage.removeItem("desiredUrlAfterReload");
  //     }
  //   }, []);

  // Function to calculate the width based on the window size
  useEffect(() => {
    animateScroll.scrollToBottom({
      containerId: "moves-list",
      duration: 0,
    });
  }, [whiteMoves, blackMoves]);
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
      return Math.min(600, minSide - 20); // Max size 600 or less if screen is smaller
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

  
  useEffect(() => {
    // Proper place to set up socket event listeners
    const receiveMessage = (data) => {
      setMessageList((messageList) => [
        { message: data.message, id: data.id },
        ...messageList,
      ]);
    };

    const receiveGameDetails = (data) => {
      const gamecpy = new Chess();
      console.log(data);
      gamecpy.loadPgn(data.currpgn);
      const opponent_move = data.moveSan;
      if (color == "w") {
        setBlackMoves((blackMoves) => [...blackMoves, opponent_move]);
      } else {
        setWhiteMoves((whiteMoves) => [...whiteMoves, opponent_move]);
      }
      setcurrGame(gamecpy);
      if (currGame.isCheckmate()) {
        checkMateSound
          .play()
          .catch((error) => console.error("Error playing the sound:", error));
      } else {
        moveAudio
          .play()
          .catch((error) => console.error("Error playing the sound:", error));
      }
      setYourTurn(currGame.turn() !== color);
    };
    const resignGame = (data) => {
      // setYourTurn(false);
      // setResignreq(true);
      setResignreq(true)
      console.log('Opponent Resigned')
    };
    const recievedisconnect = (data) => {
      // setYourTurn(false);
      // setResignreq(true);
      setOpponentDisconnected(true);
      console.log('Opponent Disconnected') 
    };
    socket.on('receive_resign_message',resignGame)
    socket.on("receive_message", receiveMessage);
    socket.on("receive_game_details", receiveGameDetails);
    socket.on('receive_disconnect',recievedisconnect)

    return () => {
      // Clean up the event listeners when the component unmounts
      socket.off("receive_message", receiveMessage);
      socket.off("receive_game_details", receiveGameDetails);
    };
  }, [socket, currGame, color]);

  function getmoves(square) {
    const moves = currGame.moves({ square, verbose: true });
    console.log(moves);
    if (moves.length === 0) {
      return false; // no possible moves
    }
    const newSquares = {};
    moves.map((move) => {
      // Access the piece at the target location
      const targetPiece = currGame.get(move.to);
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
    console.log(currGame.turn());
    // console.log(square)
    if (currGame.turn() != color) {
      return;
    }

    if (!moveFrom) {
      // when no move from is selected
      // get moves

      const hasMoves = getmoves(square);
      if (hasMoves) setmoveFrom(square);
      return;
    }
    console.log(moveTo);

    if (!moveTo) {
      // moveTo is empty
      const moves = currGame.moves({ moveFrom, verbose: true });
      // console.log(moves)
      // console.log(currGame.fen())
      const isValidmove = moves.find(
        (move) => move.from === moveFrom && move.to === square
      );
      if (!isValidmove) {
        // no valid moves to currentsquare from currently selected
        const hasValidMove = getmoves(square);
        // console.log(hasValidMove)
        // console.log(currGame.fen())
        if (hasValidMove) {
          setmoveFrom(square);
        } else {
          setmoveFrom("");
        }
        return;
      }
      setMoveTo(square);
      // console.log(square[1])
      if (
        (isValidmove.color == "w" &&
          isValidmove.piece == "p" &&
          square[1] == "8") ||
        (isValidmove.color == "b" &&
          isValidmove.piece == "p" &&
          square[1] == "1")
      ) {
        setPromotionDialog(true);
        // console.log('ok')
        return;
      }
      const gamecpy = currGame;
      const move = gamecpy.move({
        from: moveFrom,
        to: square,
      });
      if (move === null) {
        const hasMoveOptions = getmoves(square);
        if (hasMoveOptions) setmoveFrom(square);
        return;
      }
      if (color == "w") {
        setWhiteMoves((whiteMoves) => [...whiteMoves, move.san]);
      } else {
        setBlackMoves((blackMoves) => [...blackMoves, move.san]);
      }
      socket.emit("share_game_details", {
        currpgn: currGame.pgn(),
        opponent: id,
        moveSan: move.san,
      });
      setcurrGame(gamecpy);
      if (gamecpy.isCheckmate()) {
        checkMateSound
          .play()
          .catch((error) => console.error("Error playing the sound:", error));
      } else {
        moveAudio
          .play()
          .catch((error) => console.error("Error playing the sound:", error));
      }
      setYourTurn(false);
      setmoveFrom(null);
      setMoveTo(null);
      setOptionSquares({});
    }
  }
  function onPromotionPieceSelect(piece) {
    // if no piece passed then user has cancelled dialog, don't make move and reset
    if (piece) {
      const gameCopy = currGame;
      const move = gameCopy.move({
        from: moveFrom,
        to: moveTo,
        promotion: piece[1].toLowerCase() ?? "q",
      });
      setcurrGame(gameCopy);
      if (color == "w") {
        setWhiteMoves((whiteMoves) => [...whiteMoves, move.san]);
      } else {
        setBlackMoves((blackMoves) => [...blackMoves, move.san]);
      }
      socket.emit("share_game_details", {
        currFen: currGame.fen(),
        opponent: id,
        moveSan: move.san,
      });
      if (gameCopy.isCheckmate()) {
        checkMateSound
          .play()
          .catch((error) => console.error("Error playing the sound:", error));
      } else {
        moveAudio
          .play()
          .catch((error) => console.error("Error playing the sound:", error));
      }
    }

    setmoveFrom("");
    setYourTurn(false);
    setMoveTo(null);
    setPromotionDialog(false);
    setOptionSquares({});
    return true;
  }

  async function sendMessage() {
    const message = messageRef.current.value;
    await socket.emit("send_message", { message: message, opponent: id });
    messageRef.current.value = "";
    setMessageList((messageList) => [
      { message: message, id: socket.id },
      ...messageList,
    ]);
  }
  return (
    <>
    <div className="min-w-screen min-h-screen flex items-center justify-center bg-black">
      {opponentdisconnected && !(resignreq || iresinged) && <div
        className=" bg-zinc-800 justify-center rounded-lg text-lg p-10 text-white"
      >
        <div>👑 Opponent Disconnected</div>
        <div className="w-full flex justify-center items-center">
        <button onClick={()=>{navigate('/')}} className="bg-red-500 mt-5 text-white font-bold mb-2 rounded-2xl p-4 px-8   text-2xl flex gap-10 items-center justify-center opacity-90 transition hover:bg-black">Main Menu</button>
        </div>
      </div>}
      {(resignreq || iresinged) && 
        <div
        className=" bg-zinc-800 justify-center rounded-lg text-lg p-10 text-white"
      >
        <div>👑 {resignreq ? "Opponent" : "You"} Resigned</div>
        <div className="w-full flex justify-center items-center">
        <button onClick={()=>{navigate('/')}} className="bg-red-500 mt-3 text-white font-bold  rounded-2xl p-4 px-8   text-2xl flex items-center justify-center opacity-90 transition hover:bg-black">Main Menu</button>
        </div>
      </div>
      }
      {!(opponentdisconnected || resignreq || iresinged)&&<div className="w-full min-h-screen flex flex-col  lg:flex-row gap-10 justify-center items-center bg-black">
        {/* <div className="flex flex-col h-72 w-30 items-center rounded-xl bg-zinc-900 hover:shadow-xl">
              <div className="w-full flex justify-center items-center p-5 text-white ">
                Moves Table ...
              </div>
              <div
                id="moves-list"
                className="flex  h-5/6 w-full overflow-y-auto bg-zinc-800"
              >
                <div className="w-6/12 h-full">
                  {whiteMoves?.map((move, index) => {
                    if (index % 2 == 0) {
                      return (
                        <div className="bg-black p-1 text-white rounded-s-sm">
                          {index + 1}.{move}{" "}
                        </div>
                      );
                    }
                    return (
                      <div className=" p-1 bg-zinc-800 text-white rounded-s-sm">
                        {index + 1}.{move}
                      </div>
                    );
                  })}
                </div>
                <div className="w-6/12 h-full">
                  {blackMoves?.map((move, index) => {
                    if (index % 2 == 0) {
                      return (
                        <div className="bg-black p-1 text-white rounded-e-sm">
                          {move}{" "}
                        </div>
                      );
                    }
                    return (
                      <div className=" p-1 bg-zinc-800 text-white rounded-e-sm">
                        {move}
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div> */}
        {/* </div> */}
        <div className="flex flex-col  items-center rounded-xl bg-zinc-900 hover:shadow-xl">
          <div className="w-full flex items-center gap-2 p-5 text-white ">
            <div className="bg-green-600 h-3 w-3 rounded-full"></div>
            {id?.slice(0,5)}...
          </div>
          {/* <div className="bg-gray-800 flex item-center h-10 justify-evenly w-full ">
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
              </div> */}
          <div className="w-full flex  bg-zinc-800">
            <div id="moves-list" className="flex  h-48 w-full overflow-y-auto ">
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
                    {
                      /* console.log(currHistoryindex);
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
                        } */
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
                    
                      /* console.log("black" + currHistoryindex); */
                    
                    {
                      /* if (currHistoryindex % 2 == 1) {
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
                        } */
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
              {String(socket.id).slice(0,5)}...
            </div>

            <Popover
              content={clickContentrematch}
              placement="bottom"
              color="rgb(39 39 42)"
              // open={rematch}
            >
              <button
                // onClick={() => {
                //   setreMatch(true);
                //   setTimeout(() => {
                //     setreMatch(false);
                //   }, 5000);
                // }}
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
              // open={resignreq}
            >
              <button
                onClick={() => {
                  setResignreq(resignreq=>!resignreq);
                  if(resignreq){
                  setTimeout(() => {
                    setResignreq(false);
                  }, 5000);
                  }
                }}
                className={` p-3 text-white font-semibold rounded-md transition ease-in-out delay-150  hover:-translate-y-1 hover:scale-110 hover:bg-red-500 duration-300`}
              >
                <FlagFilled style={{ color: `white` }} />
              </button>
            </Popover>
          </div>
        </div>
        <div>
          {/* <div className='text-white m-3'>opponent id : {id}</div>             */}
          {/* {!yourturn && (
            <div className="flex justify-center items-center w-full text-white mt-3">
              <div className=" bg-red-500 text-white font-bold mb-8 rounded-2xl p-4 px-8   text-2xl flex gap-10 items-center justify-center opacity-90 transition hover:bg-green-500">
                Opponent's Turn
              </div>
            </div>
          )} */}
          <div className="ms-5">
            <Chessboard
              boardOrientation={color == "w" ? "white" : "black"}
              onSquareClick={onSquareClicked}
              arePiecesDraggable={false}
              autoPromoteToQueen={false}
              onPieceDragEnd={() => {
                console.log("onPieceDragEnd");
              }}
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
              }}
            />
            {/* {yourturn && (
              <div className="flex justify-center items-center w-full text-white mt-3">
                <div className=" bg-green-500 text-white font-bold mt-8 rounded-2xl p-4 px-8 bg-black  text-2xl flex gap-10 items-center justify-center opacity-90 transition hover:bg-red-500">
                  Your Turn
                </div>
              </div>
            )} */}
          </div>
          {/* <div className='text-white'>Your id : {socket.id}</div> */}
        </div>

        <div className="bg-zinc-950 rounded-lg">
          <div className="bg-zinc-900 rounded-t-lg text-white p-3 text-lg w-full flex justify-center">
            🗨️ Chat Room 💬
          </div>
          
            <div className="flex flex-col-reverse  h-72 lg:h-96 w-full p-2 overflow-y-auto">
              {messageList?.map((currentMessage) => {
                const isOpponent = id === currentMessage.id;
                console.log(currentMessage.id + " " + id)
                return (
                  <div
                    className={`flex w-full justify-${ isOpponent ? 'start': 'end'} my-2 `}
                  >
                    <div
                      className={`bg-${
                        isOpponent ? 'red-500' : 'green-600'
                      } h-full text-white p-2 mx-2 rounded-br-md rounded-tl-md max-w-44 whitespace-normal break-words`}
                    >
                      {currentMessage.message}
                    </div>
                  </div>
                );
              })}
            </div>
          
          <div className="flex bg-zinc-900 w-full p-4 rounded-b-lg gap-3">
            
            <Space.Compact
              style={{
                width: "100%",
              }}
            >
              <input ref={messageRef} className="text-lg rounded-l-lg text-white p-2 outline-none bg-gray-800 border-0 hover:bg-gray-800"  placeholder="Type Message..." ></input>
              <button onClick={() => {if(messageRef.current.value){sendMessage()}}} className="bg-sky-600 text-white text-lg rounded-r-lg px-3 hover:bg-sky-800">Send</button>
            </Space.Compact>
          </div>
        </div>
      </div>}
      </div>
    </>
  );
};

export default Main;
