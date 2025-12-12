"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { gameData, Poll } from "@/lib/game-data";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type GamePhase = "waiting" | "voting" | "revealing" | "results";

export default function GamePage() {
  const { socket, isConnected, userId } = useSocket();
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>("waiting");
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showReconnecting, setShowReconnecting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize first poll
  useEffect(() => {
    if (gameData.length > 0) {
      setCurrentPoll(gameData[0]);
    }
  }, []);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Watch connection status
  useEffect(() => {
    if (!isConnected) {
      setShowReconnecting(true);
    } else {
      setShowReconnecting(false);
    }
  }, [isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handlePollStarted = (data: { pollId: string; options: string[] }) => {
      console.log("Poll started:", data);
      setGamePhase("voting");
      setUserVote(null);

      // Initialize votes
      const initialVotes: Record<string, number> = {};
      data.options.forEach((option) => {
        initialVotes[option] = 0;
      });
      setVotes(initialVotes);
      setTotalVotes(0);
    };

    const handleVoteUpdate = (data: {
      pollId: string;
      votes: Record<string, number>;
      totalVotes: number;
    }) => {
      console.log("Vote update:", data);
      setVotes(data.votes);
      setTotalVotes(data.totalVotes);
    };

    const handleVoteConfirmed = (data: { pollId: string; option: string }) => {
      console.log("Vote confirmed:", data);
      setUserVote(data.option);
    };

    const handlePollClosed = (data: {
      pollId: string;
      finalResults: Record<string, number>;
      totalVotes: number;
    }) => {
      console.log("Poll closed:", data);
      setGamePhase("revealing");
      setVotes(data.finalResults);
      setTotalVotes(data.totalVotes);
      setTimer(3);
    };

    const handleGameStateSync = (data: {
      pollId: string;
      phase: string;
      votes: Record<string, number>;
      totalVotes: number;
    }) => {
      console.log("Game state synced:", data);
      // Find the poll by ID
      const poll = gameData.find((p) => p.id === data.pollId);
      if (poll) {
        const pollIndex = gameData.findIndex((p) => p.id === data.pollId);
        setCurrentPollIndex(pollIndex);
        setCurrentPoll(poll);
        setGamePhase(data.phase as GamePhase);
        setVotes(data.votes);
        setTotalVotes(data.totalVotes);
      }
    };

    const handleError = (data: { message: string }) => {
      console.error("Socket error:", data.message);
      // Don't use alert, use a toast or notification instead
      // For now, just log to console
    };

    socket.on("poll-started", handlePollStarted);
    socket.on("vote-update", handleVoteUpdate);
    socket.on("vote-confirmed", handleVoteConfirmed);
    socket.on("poll-closed", handlePollClosed);
    socket.on("game-state-sync", handleGameStateSync);
    socket.on("error", handleError);

    return () => {
      socket.off("poll-started", handlePollStarted);
      socket.off("vote-update", handleVoteUpdate);
      socket.off("vote-confirmed", handleVoteConfirmed);
      socket.off("poll-closed", handlePollClosed);
      socket.off("game-state-sync", handleGameStateSync);
      socket.off("error", handleError);
    };
  }, [socket]);

  // Timer countdown and auto-progression
  useEffect(() => {
    if (timer > 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Timer expired, handle phase transition
            if (gamePhase === "voting") {
              // Auto-close poll after voting time
              if (socket && currentPoll) {
                socket.emit("close-poll", { pollId: currentPoll.id });
              }
            } else if (gamePhase === "revealing") {
              // Move to results after reveal animation
              setGamePhase("results");
              if (currentPoll) {
                setTimer(currentPoll.revealTime);
              }
            } else if (gamePhase === "results") {
              // Auto-advance to next poll after results time
              const nextIndex = currentPollIndex + 1;
              if (nextIndex < gameData.length) {
                setCurrentPollIndex(nextIndex);
                setCurrentPoll(gameData[nextIndex]);
                setGamePhase("waiting");
                setVotes({});
                setTotalVotes(0);
                setUserVote(null);
                setTimer(0);
                setImageLoaded(false);
                setImageError(false);
                // Auto-start next poll if host mode
                if (isHost) {
                  setTimeout(() => {
                    if (socket && gameData[nextIndex]) {
                      setGamePhase("voting");
                      setTimer(gameData[nextIndex].votingTime);
                      socket.emit("start-poll", {
                        pollId: gameData[nextIndex].id,
                        options: gameData[nextIndex].options,
                      });
                    }
                  }, 2000);
                }
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timer, gamePhase, socket, currentPoll, currentPollIndex, isHost]);

  const handleStartPoll = useCallback(() => {
    if (!socket || !currentPoll || !isHost) return;

    setGamePhase("voting");
    setTimer(currentPoll.votingTime);
    setUserVote(null);
    setVotes({});
    setTotalVotes(0);

    socket.emit("start-poll", {
      pollId: currentPoll.id,
      options: currentPoll.options,
    });
  }, [socket, currentPoll, isHost]);

  const handleVote = useCallback(
    (option: string) => {
      if (!socket || !userId || !currentPoll || userVote) return;

      socket.emit("submit-vote", {
        pollId: currentPoll.id,
        option,
        userId,
      });
    },
    [socket, userId, currentPoll, userVote]
  );

  const handleClosePoll = useCallback(() => {
    if (!socket || !currentPoll || !isHost) return;

    socket.emit("close-poll", {
      pollId: currentPoll.id,
    });
  }, [socket, currentPoll, isHost]);

  const handleNextPoll = useCallback(() => {
    if (!isHost) return;

    const nextIndex = currentPollIndex + 1;
    if (nextIndex < gameData.length) {
      setCurrentPollIndex(nextIndex);
      setCurrentPoll(gameData[nextIndex]);
      setGamePhase("waiting");
      setVotes({});
      setTotalVotes(0);
      setUserVote(null);
      setTimer(0);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [currentPollIndex, isHost]);

  const handlePreviousPoll = useCallback(() => {
    if (!isHost) return;

    const prevIndex = currentPollIndex - 1;
    if (prevIndex >= 0) {
      setCurrentPollIndex(prevIndex);
      setCurrentPoll(gameData[prevIndex]);
      setGamePhase("waiting");
      setVotes({});
      setTotalVotes(0);
      setUserVote(null);
      setTimer(0);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [currentPollIndex, isHost]);

  const getPercentage = useCallback(
    (option: string): number => {
      if (totalVotes === 0) return 0;
      return Math.round((votes[option] / totalVotes) * 100);
    },
    [votes, totalVotes]
  );

  const isCorrectAnswer = useCallback(
    (option: string): boolean => {
      if (!currentPoll) return false;
      if (Array.isArray(currentPoll.correctAnswer)) {
        return currentPoll.correctAnswer.includes(option);
      }
      return currentPoll.correctAnswer === option;
    },
    [currentPoll]
  );

  if (!currentPoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Reconnection Banner */}
      {showReconnecting && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 text-sm">
          ⚠️ Connection lost. Reconnecting...
        </div>
      )}

      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                🧠 Optical Illusions Game
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 truncate">
                Segment {currentPoll.segment}: {currentPoll.segmentName}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-300">
                  {currentPollIndex + 1}/{gameData.length}
                </p>
                {isConnected ? (
                  <p className="text-xs text-green-400">● Live</p>
                ) : (
                  <p className="text-xs text-red-400">● Offline</p>
                )}
              </div>
              <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={isHost}
                  onChange={(e) => setIsHost(e.target.checked)}
                  className="rounded"
                />
                <span className="hidden sm:inline">Host Mode</span>
                <span className="sm:hidden">Host</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-4 sm:gap-8">
          {/* Left Side - Illusion Image */}
          <div className="flex flex-col order-1 lg:order-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 flex flex-col h-[300px] sm:h-[400px] lg:h-[calc(100vh-180px)]">
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 truncate">
                {currentPoll.title}
              </h2>
              <div className="flex-1 relative bg-black/20 rounded-lg sm:rounded-xl overflow-hidden">
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  </div>
                )}
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                    <div>
                      <p className="text-lg mb-2">🖼️</p>
                      <p className="text-sm">Image not available</p>
                    </div>
                  </div>
                )}
                <Image
                  src={currentPoll.imageUrl}
                  alt={currentPoll.title}
                  fill
                  className={`object-contain transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  priority
                  unoptimized
                  onLoad={() => {
                    setImageLoaded(true);
                    setImageError(false);
                  }}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(false);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Side - Polling Interface */}
          <div className="flex flex-col order-2 lg:order-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 flex flex-col min-h-[400px] lg:h-[calc(100vh-180px)]">
              {/* Question */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-semibold mb-2 leading-tight">
                  {currentPoll.question}
                </h3>
                {gamePhase === "voting" && timer > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-green-400 h-full"
                        initial={{ width: "100%" }}
                        animate={{
                          width: `${(timer / currentPoll.votingTime) * 100}%`,
                        }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                    <span className="text-sm sm:text-base font-bold min-w-[3ch] text-right">
                      {timer}s
                    </span>
                  </div>
                )}
                {gamePhase === "revealing" && (
                  <div className="text-center text-base sm:text-lg text-green-300 animate-pulse mt-2">
                    ✨ Revealing results...
                  </div>
                )}
                {gamePhase === "results" && timer > 0 && (
                  <div className="text-center text-sm sm:text-base text-blue-300 mt-2">
                    Next poll in {timer}s...
                  </div>
                )}
              </div>

              {/* Voting/Results Area */}
              <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <AnimatePresence mode="wait">
                  {gamePhase === "waiting" && (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full text-center p-4"
                    >
                      <div className="text-4xl sm:text-6xl mb-4">🎮</div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-2">
                        Ready to Start?
                      </h3>
                      {isHost ? (
                        <p className="text-sm sm:text-base text-gray-300">
                          Click &quot;Start Poll&quot; when ready!
                        </p>
                      ) : (
                        <p className="text-sm sm:text-base text-gray-300">
                          Waiting for host to start the poll...
                        </p>
                      )}
                    </motion.div>
                  )}

                  {gamePhase === "voting" && (
                    <motion.div
                      key="voting"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-2 sm:space-y-3"
                    >
                      {currentPoll.options.map((option, index) => (
                        <motion.button
                          key={option}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleVote(option)}
                          disabled={!!userVote}
                          className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-left font-semibold text-sm sm:text-base transition-all touch-manipulation ${
                            userVote === option
                              ? "bg-green-500 text-white ring-2 ring-green-300"
                              : userVote
                              ? "bg-white/5 text-gray-400 cursor-not-allowed"
                              : "bg-white/20 hover:bg-white/30 active:bg-white/40 hover:scale-[1.02]"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-xs sm:text-sm">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {userVote === option && (
                              <span className="text-lg sm:text-xl">✓</span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                      {userVote && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-xs sm:text-sm text-green-300 mt-4"
                        >
                          ✓ Your vote has been recorded!
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  {(gamePhase === "revealing" || gamePhase === "results") && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      {currentPoll.options.map((option, index) => {
                        const percentage = getPercentage(option);
                        const voteCount = votes[option] || 0;
                        const isCorrect = isCorrectAnswer(option);
                        const isUserChoice = userVote === option;

                        return (
                          <motion.div
                            key={option}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15 }}
                            className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl overflow-hidden ${
                              isCorrect
                                ? "ring-2 ring-green-400"
                                : isUserChoice
                                ? "ring-2 ring-blue-400"
                                : ""
                            }`}
                          >
                            <motion.div
                              className={`absolute inset-0 ${
                                isCorrect
                                  ? "bg-green-500/30"
                                  : "bg-white/10"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{
                                duration: 0.8,
                                delay: index * 0.15,
                                ease: "easeOut",
                              }}
                            />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center text-xs sm:text-sm font-bold">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                  <span className="font-semibold truncate text-sm sm:text-base">
                                    {option}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-base sm:text-xl">✓</span>
                                  )}
                                  {isUserChoice && !isCorrect && (
                                    <span className="text-xs sm:text-sm text-blue-300">
                                      (You)
                                    </span>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-lg sm:text-2xl font-bold">
                                    {percentage}%
                                  </div>
                                  <div className="text-xs text-gray-300">
                                    {voteCount} {voteCount === 1 ? "vote" : "votes"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {gamePhase === "results" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500/20 rounded-lg sm:rounded-xl border border-blue-400/30"
                        >
                          <p className="text-xs sm:text-sm font-semibold mb-1 text-blue-300">
                            💡 Explanation
                          </p>
                          <p className="text-xs sm:text-base leading-relaxed">
                            {currentPoll.explanation}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Host Controls */}
              {isHost && (
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-2">
                    {gamePhase === "waiting" && (
                      <button
                        onClick={handleStartPoll}
                        disabled={!isConnected}
                        className="col-span-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-colors text-sm sm:text-base touch-manipulation"
                      >
                        Start Poll
                      </button>
                    )}
                    {gamePhase === "voting" && (
                      <button
                        onClick={handleClosePoll}
                        disabled={!isConnected}
                        className="col-span-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-colors text-sm sm:text-base touch-manipulation"
                      >
                        Close Poll Early
                      </button>
                    )}
                    <button
                      onClick={handlePreviousPoll}
                      disabled={currentPollIndex === 0 || !isConnected}
                      className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-colors text-xs sm:text-sm touch-manipulation"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={handleNextPoll}
                      disabled={
                        currentPollIndex === gameData.length - 1 || !isConnected
                      }
                      className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-colors text-xs sm:text-sm touch-manipulation"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Total Votes Display */}
              {totalVotes > 0 && (
                <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-300">
                  {totalVotes} {totalVotes === 1 ? "participant" : "participants"}{" "}
                  voted
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
