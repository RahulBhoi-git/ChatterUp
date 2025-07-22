// src/socket/socket.handler.js
import { MessageRepository } from "../features/message/message.repository.js";
import { UserRepository } from "../features/user/user.repository.js";
import { User } from "../features/user/user.schema.js";

const messageRepository = new MessageRepository();
const userRepository =new UserRepository();

export const handleSocketConnection = (io, socket) => {
  console.log("A user connected");

  socket.on("new_user", async ({ username, avatarUrl }) => {
    try {
      if (!username) return;
      await User.create({username,avatarUrl,socketId:socket.id});
      userRepository.addUser(socket.id,username,avatarUrl);

      const recentMessages = await messageRepository.getRecentMessages();
      socket.emit("chat_history", recentMessages);
      
      socket.broadcast.emit("user_joined", username);
      console.log("update_user_list", userRepository.getAllUsers())
      io.emit("update_user_list", userRepository.getAllUsers());
      console.log(`${username} has joined the chat`);
    } catch (err) {
      console.log("Error in new_user handeler",err);
    }
  });

  socket.on("send_message", async ({ username, message,avatarUrl }) => {
    await messageRepository.saveMessage(username, message,avatarUrl);

    io.emit("recieve_message", {
      username,
      message,
      avatarUrl,
      socketId: socket.id,
    });
  });

  socket.on("typing", () => {
    const user=userRepository.getUser(socket.id);
    if(user?.username){
      io.emit("user_typing", user.username);
    }
    
  });

  socket.on("stop_typing", () => {
    io.emit("user_stop_typing");
  });

  socket.on("disconnect", async() => {
    const removedUser=userRepository.removeUser(socket.id);

    if (removedUser?.username) {
      
      socket.broadcast.emit("user_left", removedUser.username);
      
      io.emit("update_user_list", userRepository.getAllUsers());
    }
    console.log("A user disconnected");
  });
};
