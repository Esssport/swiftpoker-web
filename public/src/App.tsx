import {
  type Component,
  createEffect,
  createSignal,
  JSX,
  JSXElement,
} from "solid-js";

//   switch (data.event) {
//     case "update-users":
//     case "send-message":
//       break;

function connectToTable() {
  // TODO: error if empty input
  const username = document.getElementById("username") as HTMLInputElement;
  const serverSocket = new WebSocket(
    `ws://localhost:8080/start_web_socket?username=${username.value}`,
  );
  serverSocket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    console.log(data);
    setAppData(data);
  };
}

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

const Main: Component = () => {
  return (
    <>
      <div class="md:w-2/3">
        <input
          class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
          id="username"
          type="text"
          value="anonymous"
        />
      </div>
      <button
        class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={connectToTable}
      >
        Connect to Table
      </button>
      <h1>
        <b>{JSON.stringify(appData())}</b>
      </h1>
    </>
  );
};

const [appData, setAppData] = createSignal({});

const App: Component = () => {
  return <Main />;
};

export default App;
