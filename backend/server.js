const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const { chats } = require("./data/data.js");
const userRoutes = require("./routes/userRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");
const path = require("path");
const http = require("http");

dotenv.config();

const app = express();
connectDB();

app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://web-chat-app-7-dq9h.onrender.com/", // Adjust to your frontend URL
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    //console.log(User joined room: ${room});
  });

  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
    //console.log(User typing in room: ${room});
  });

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
   // console.log(User stopped typing in room: ${room});
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
     // console.log(Message sent to user: ${user._id});
    });
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
  });

  socket.off("setup", (userData) => {
    //console.log(User ${userData._id} disconnected);
    socket.leave(userData._id);
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
