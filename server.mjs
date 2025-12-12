import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const pollStates = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handler(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join-game", () => {
      console.log(`User joined game: ${socket.id}`);
      socket.emit("connected", { userId: socket.id });
    });

    socket.on("start-poll", (data) => {
      const { pollId, options } = data;

      const votes = {};
      options.forEach((option) => {
        votes[option] = 0;
      });

      pollStates.set(pollId, {
        pollId,
        votes,
        totalVotes: 0,
        voters: new Set(),
        isActive: true,
      });

      console.log(`Poll started: ${pollId}`);
      io.emit("poll-started", { pollId, options });
    });

    socket.on("submit-vote", (data) => {
      const { pollId, option, userId } = data;
      const pollState = pollStates.get(pollId);

      if (!pollState) {
        socket.emit("error", { message: "Poll not found" });
        return;
      }

      if (!pollState.isActive) {
        socket.emit("error", { message: "Poll is closed" });
        return;
      }

      if (pollState.voters.has(userId)) {
        socket.emit("error", { message: "You have already voted" });
        return;
      }

      if (pollState.votes[option] !== undefined) {
        pollState.votes[option]++;
        pollState.totalVotes++;
        pollState.voters.add(userId);

        console.log(`Vote recorded: ${option} for poll ${pollId}`);

        io.emit("vote-update", {
          pollId,
          votes: pollState.votes,
          totalVotes: pollState.totalVotes,
        });

        socket.emit("vote-confirmed", { pollId, option });
      } else {
        socket.emit("error", { message: "Invalid option" });
      }
    });

    socket.on("close-poll", (data) => {
      const { pollId } = data;
      const pollState = pollStates.get(pollId);

      if (pollState) {
        pollState.isActive = false;
        console.log(`Poll closed: ${pollId}`);

        io.emit("poll-closed", {
          pollId,
          finalResults: pollState.votes,
          totalVotes: pollState.totalVotes,
        });
      }
    });

    socket.on("get-results", (data) => {
      const { pollId } = data;
      const pollState = pollStates.get(pollId);

      if (pollState) {
        socket.emit("vote-update", {
          pollId,
          votes: pollState.votes,
          totalVotes: pollState.totalVotes,
        });
      }
    });

    socket.on("reset-poll", (data) => {
      const { pollId } = data;
      pollStates.delete(pollId);
      console.log(`Poll reset: ${pollId}`);
      io.emit("poll-reset", { pollId });
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
