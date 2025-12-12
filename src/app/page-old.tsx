"use client";

import { useEffect, useState } from "react";
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

  // Initialize first poll
  useEffect(() => {
    if (gameData.length > 0) {
      setCurrentPoll(gameData[0]);
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("poll-started", (data: { pollId: string; options: string[] }) => {
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
    });

    socket.on(
      "vote-update",
      (data: {
        pollId: string;
        votes: Record<string, number>;
        totalVotes: number;
      }) => {
        console.log("Vote update:", data);
        setVotes(data.votes);
        setTotalVotes(data.totalVotes);
      }
    );

    socket.on("vote-confirmed", (data: { pollId: string; option: string }) => {
      console.log("Vote confirmed:", data);
      setUserVote(data.option);
    });

    socket.on(
      "poll-closed",
      (data: {
        pollId: string;
        finalResults: Record<string, number>;
        totalVotes: number;
      }) => {
        console.log("Poll closed:", data);
        setGamePhase("revealing");
        setVotes(data.finalResults);
        setTotalVotes(data.totalVotes);
        // Start reveal timer - short pause to see results
        setTimer(3); // 3 seconds to show the reveal animation
      }
    );

    socket.on("error", (data: { message: string }) => {
      console.error("Socket error:", data.message);
      alert(data.message);
    });

    return () => {
      socket.off("poll-started");
      socket.off("vote-update");
      socket.off("vote-confirmed");
      socket.off("poll-closed");
      socket.off("error");
    };
  }, [socket]);

  // Timer countdown and auto-progression
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            // Timer expired, handle phase transition
            if (gamePhase === "voting") {
              // Auto-close poll after voting time
              if (socket && currentPoll) {
                socket.emit("close-poll", { pollId: currentPoll.id });
              }
            } else if (gamePhase === "revealing") {
              // Move to results after reveal animation and set results timer
              setGamePhase("results");
              if (currentPoll) {
                setTimer(currentPoll.revealTime); // Use revealTime for results display
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
                  }, 2000); // 2 second pause between polls
                }
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, gamePhase, socket, currentPoll, currentPollIndex, isHost]);

  const handleStartPoll = () => {
    if (!socket || !currentPoll) return;

    setGamePhase("voting");
    setTimer(currentPoll.votingTime);
    setUserVote(null);
    setVotes({});
    setTotalVotes(0);

    socket.emit("start-poll", {
      pollId: currentPoll.id,
      options: currentPoll.options,
    });
  };

  const handleVote = (option: string) => {
    if (!socket || !userId || !currentPoll || userVote) return;

    socket.emit("submit-vote", {
      pollId: currentPoll.id,
      option,
      userId,
    });
  };

  const handleClosePoll = () => {
    if (!socket || !currentPoll) return;

    socket.emit("close-poll", {
      pollId: currentPoll.id,
    });
  };

  const handleNextPoll = () => {
    const nextIndex = currentPollIndex + 1;
    if (nextIndex < gameData.length) {
      setCurrentPollIndex(nextIndex);
      setCurrentPoll(gameData[nextIndex]);
      setGamePhase("waiting");
      setVotes({});
      setTotalVotes(0);
      setUserVote(null);
      setTimer(0);
    }
  };

  const handlePreviousPoll = () => {
    const prevIndex = currentPollIndex - 1;
    if (prevIndex >= 0) {
      setCurrentPollIndex(prevIndex);
      setCurrentPoll(gameData[prevIndex]);
      setGamePhase("waiting");
      setVotes({});
      setTotalVotes(0);
      setUserVote(null);
      setTimer(0);
    }
  };

  const getPercentage = (option: string): number => {
    if (totalVotes === 0) return 0;
    return Math.round((votes[option] / totalVotes) * 100);
  };

  const isCorrectAnswer = (option: string): boolean => {
    if (!currentPoll) return false;
    if (Array.isArray(currentPoll.correctAnswer)) {
      return currentPoll.correctAnswer.includes(option);
    }
    return currentPoll.correctAnswer === option;
  };

  if (!currentPoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🧠 Optical Illusions Game</h1>
              <p className="text-sm text-gray-300">
                Segment {currentPoll.segment}: {currentPoll.segmentName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">
                  Poll {currentPollIndex + 1} of {gameData.length}
                </p>
                {isConnected ? (
                  <p className="text-xs text-green-400">● Connected</p>
                ) : (
                  <p className="text-xs text-red-400">● Disconnected</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isHost}
                  onChange={(e) => setIsHost(e.target.checked)}
                  className="rounded"
                />
                Host Mode
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-180px)]">
          {/* Left Side - Illusion Image */}
          <div className="flex flex-col">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex-1 flex flex-col">
              <h2 className="text-3xl font-bold mb-4">{currentPoll.title}</h2>
              <div className="flex-1 relative bg-black/20 rounded-xl overflow-hidden">
                <Image
                  src={currentPoll.imageUrl}
                  alt={currentPoll.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Side - Polling Interface */}
          <div className="flex flex-col">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex-1 flex flex-col">
              {/* Question */}
              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">
                  {currentPoll.question}
                </h3>
                {gamePhase === "voting" && timer > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-yellow-400">
                      ⏱️ {timer}s
                    </div>
                    <div className="text-sm text-gray-300">
                      remaining to vote
                    </div>
                  </div>
                )}
                {gamePhase === "revealing" && (
                  <div className="text-center text-lg text-green-300 animate-pulse">
                    ✨ Revealing results...
                  </div>
                )}
                {gamePhase === "results" && timer > 0 && (
                  <div className="text-center text-lg text-purple-300 animate-pulse">
                    Next poll in {timer}s...
                  </div>
                )}
              </div>

              {/* Voting/Results Area */}
              <div className="flex-1 overflow-y-auto space-y-3">
                <AnimatePresence mode="wait">
                  {gamePhase === "waiting" && (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full space-y-4"
                    >
                      <p className="text-xl text-gray-300">
                        Waiting to start poll...
                      </p>
                      {isHost && (
                        <button
                          onClick={handleStartPoll}
                          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-xl hover:scale-105 transition-transform"
                        >
                          Start Poll
                        </button>
                      )}
                    </motion.div>
                  )}

                  {gamePhase === "voting" && (
                    <motion.div
                      key="voting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {currentPoll.options.map((option, index) => (
                        <motion.div
                          key={option}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <button
                            onClick={() => handleVote(option)}
                            disabled={!!userVote}
                            className={`w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                              userVote === option
                                ? "border-yellow-400 bg-yellow-500/20"
                                : userVote
                                ? "border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed"
                                : "border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50 cursor-pointer"
                            }`}
                          >
                            {/* Vote count bar */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                              initial={{ width: 0 }}
                              animate={{ width: `${getPercentage(option)}%` }}
                              transition={{ duration: 0.5 }}
                            />

                            <div className="relative flex items-center justify-between">
                              <span className="text-lg font-semibold">
                                {option}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-300">
                                  {votes[option] || 0} votes
                                </span>
                                <span className="text-xl font-bold">
                                  {getPercentage(option)}%
                                </span>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                      <div className="mt-6 p-4 bg-black/30 rounded-xl">
                        <p className="text-center text-lg">
                          Total Votes:{" "}
                          <span className="font-bold text-2xl text-blue-400">
                            {totalVotes}
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {(gamePhase === "revealing" || gamePhase === "results") && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        {currentPoll.options.map((option, index) => (
                          <motion.div
                            key={option}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl border-2 relative overflow-hidden ${
                              isCorrectAnswer(option)
                                ? "border-green-400 bg-green-500/20"
                                : "border-white/30 bg-white/5"
                            }`}
                          >
                            <motion.div
                              className={`absolute inset-0 ${
                                isCorrectAnswer(option)
                                  ? "bg-gradient-to-r from-green-500/40 to-emerald-500/40"
                                  : "bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${getPercentage(option)}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                            />

                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer(option) && (
                                  <span className="text-2xl">✓</span>
                                )}
                                <span className="text-lg font-semibold">
                                  {option}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-300">
                                  {votes[option] || 0} votes
                                </span>
                                <span className="text-xl font-bold">
                                  {getPercentage(option)}%
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-6 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                        <h4 className="text-xl font-bold mb-2 text-purple-200">
                          💡 Explanation
                        </h4>
                        <p className="text-gray-200 leading-relaxed">
                          {currentPoll.explanation}
                        </p>
                      </div>

                      <div className="p-4 bg-black/30 rounded-xl">
                        <p className="text-center text-lg">
                          Total Votes:{" "}
                          <span className="font-bold text-2xl text-blue-400">
                            {totalVotes}
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Host Controls */}
              {isHost && (
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex gap-3">
                    <button
                      onClick={handlePreviousPoll}
                      disabled={currentPollIndex === 0}
                      className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ← Previous
                    </button>
                    {gamePhase === "voting" && (
                      <button
                        onClick={handleClosePoll}
                        className="flex-1 px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500 font-semibold transition-all"
                      >
                        Close Poll & Show Results
                      </button>
                    )}
                    {(gamePhase === "revealing" || gamePhase === "results") && (
                      <button
                        onClick={handleNextPoll}
                        disabled={currentPollIndex === gameData.length - 1}
                        className="flex-1 px-6 py-2 bg-green-600 rounded-lg hover:bg-green-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next Poll →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
