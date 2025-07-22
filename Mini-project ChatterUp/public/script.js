const socket = io();
let username = "";
let avatarUrl = "";
const userAvatars = {};

window.onload = () => {
  const startBtn = document.getElementById("startChat");
  startBtn.addEventListener("click", async () => {
    const usernameField = document.getElementById("usernameInput");
    const avatarField = document.getElementById("avatarinput");

    username = usernameField.value.trim() || "Anonymous";

    if (avatarField.files.length > 0) {
      const formData = new FormData();
      formData.append("avatar", avatarField.files[0]);

      const res = await fetch("http://localhost:3100/api/avatar/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        avatarUrl = data.avatarUrl;
        localStorage.setItem("avatarUrl", avatarUrl); // Save locally
      }
    }

    document.getElementById("userSetup").style.display = "none";
    document.getElementById("chatContainer").style.display = "flex";

    socket.emit("new_user", { username, avatarUrl });
  });
  
  const toggle = document.getElementById("toggleTheme");

  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");

    // Optionally toggle individual components if needed
    document
      .querySelectorAll(
        ".chat-panel, .sidebar, .chat-input, .chat-box, .chat-header, .chat-message.self, .chat-message.other, #messageInput, #sendBtn"
      )
      .forEach((el) => el.classList.toggle("dark-mode"));
  });

  const sendBtn = document.getElementById("sendBtn");
  sendBtn.addEventListener("click", sendMessage);

  const messageInput = document.getElementById("messageInput");
  messageInput.addEventListener("input", () => {
    const isTyping = messageInput.value.trim() !== "";
    socket.emit(isTyping ? "typing" : "stop_typing");
  });
};

function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;

  socket.emit("send_message", { username, message, avatarUrl });
  input.value = "";
  socket.emit("stop_typing");
}

//  Receive real-time messages
socket.on("recieve_message", (data) => {
  const box = document.getElementById("chat-box");

  const message = document.createElement("div");
  message.classList.add(
    "chat-message",
    data.username === username ? "self" : "other"
  );

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");

  const img = document.createElement("img");
  img.src =
    data.avatarUrl || userAvatars[data.socketId] || "default-avatar.png";
  img.alt = "avatar";
  img.classList.add("avatar-img");
  avatar.appendChild(img);

  const content = document.createElement("div");
  content.classList.add("content");

  const name = document.createElement("strong");
  name.innerText = data.username;

  const text = document.createElement("div");
  text.innerText = data.message;

  const time = document.createElement("span");
  time.classList.add("time");
  time.innerText = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  content.appendChild(name);
  content.appendChild(text);
  content.appendChild(time);

  message.appendChild(avatar);
  message.appendChild(content);
  box.appendChild(message);
  box.scrollTop = box.scrollHeight;
});

// ✍️ Typing indicators
socket.on("user_typing", (name) => {
  document.getElementById("typingStatus").innerText = `${name} is typing...`;
});
socket.on("user_stop_typing", () => {
  document.getElementById("typingStatus").innerText = "";
});

// 👥 Update connected users list
socket.on("update_user_list", (users) => {
  const ul = document.getElementById("user-list");
  ul.innerHTML = "";

  Object.entries(users).forEach(([id, user]) => {
    const li = document.createElement("li");

    userAvatars[id] = user.avatarUrl || "default-avatar.png";

    li.innerHTML = `
      <img src="${user.avatarUrl || "default-avatar.png"}" class="avatar-img" />
      <span>${user.username}</span>
    `;
    ul.appendChild(li);

    // Store for future avatar fallback
  });

  //  Correctly update user count
  document.getElementById("user-count").innerText = Object.keys(users).length;
});

//  Notify when a user joins
socket.on("user_joined", (username) => {
  const box = document.getElementById("chat-box");
  const message = document.createElement("div");
  message.style.textAlign = "center";
  message.style.color = "#999";
  message.style.fontStyle = "italic";
  message.innerHTML = `${username} joined the chat`;
  box.appendChild(message);
  box.scrollTop = box.scrollHeight;
});

//  Notify when a user leaves
socket.on("user_left", (username) => {
  const box = document.getElementById("chat-box");
  const message = document.createElement("div");
  message.style.textAlign = "center";
  message.style.color = "#999";
  message.style.fontStyle = "italic";
  message.innerHTML = `${username} has left the chat`;
  box.appendChild(message);
  box.scrollTop = box.scrollHeight;
});

//  Load previous chat history
socket.on("chat_history", (messages) => {
  const box = document.getElementById("chat-box");

  messages.forEach((msg) => {
    const message = document.createElement("div");
    message.classList.add(
      "chat-message",
      msg.username === username ? "self" : "other"
    );

    const avatar = document.createElement("div");
    avatar.classList.add("avatar");

    const img = document.createElement("img");
    img.src = msg.avatarUrl || "default-avatar.png";
    img.alt = "avatar";
    img.classList.add("avatar-img");
    avatar.appendChild(img);

    const content = document.createElement("div");
    content.classList.add("content");

    const time = new Date(msg.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    content.innerHTML = `
      <strong>${msg.username}</strong><br/>
      ${msg.content}<br/>
      <span class="time">${time}</span>
    `;

    message.appendChild(avatar);
    message.appendChild(content);
    box.appendChild(message);
  });

  box.scrollTop = box.scrollHeight;
});
