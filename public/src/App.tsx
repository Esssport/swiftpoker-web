import type { Component } from "solid-js";

// const myUsername = prompt("Please enter your name") || "Anonymous";
const myUsername = "Esssport";
const socket = new WebSocket(
  `ws://localhost:8080/start_web_socket?username=${myUsername}`,
);

socket.onmessage = (m) => {
  const data = JSON.parse(m.data);

  let userListHtml = "";
  switch (data.event) {
    case "update-users":
      // refresh displayed user list
      for (const username of data.usernames) {
        userListHtml += `<div> ${username} </div>`;
      }
      // document.getElementById("users").innerHTML = userListHtml;
      // break;

    case "send-message":
      // display new chat message
      addMessage(data.username, data.message);
      break;
  }
};

function addMessage(username, message) {
  // displays new message
  // document.getElementById(
  //   "conversation",
  // ).innerHTML += `<b> ${username} </b>: ${message} <br/>`;
}

// on page load
window.onload = () => {
  // when the client hits the ENTER key
  // document.getElementById("data").addEventListener("keypress", (e) => {
  //   if (e.key === "Enter") {
  //     const inputElement = document.getElementById("data");
  //     const message = (inputElement as HTMLInputElement).value;
  //     (inputElement as HTMLInputElement).value = "";
  //     socket.send(
  //       JSON.stringify({
  //         event: "send-message",
  //         message,
  //       }),
  //     );
  //   }
  // });
};

const App: Component = () => {
  return <h1>App.tsx content goes here</h1>;
};

export default App;
