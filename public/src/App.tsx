import { type Component, createSignal } from "solid-js";

// TODO: Add the ability to reconnect to a table after getting disconnected store in local storage or a cookie
function joinTable() {
  const username = document.getElementById("username") as HTMLInputElement;
  const tableID = document.getElementById("tableID") as HTMLInputElement;
  let serverSocket: WebSocket;
  serverSocket = new WebSocket(
    `ws://localhost:8080/join_table/${tableID.value}?username=${username.value}`,
  );
  serverSocket.onerror = (e) => {
    console.log("ERROR", e);
  };
  serverSocket.onclose = (e) => {
    console.log(e.reason);
  };
  serverSocket.onmessage = (m) => {
    const data = m.data;
    setAppData(data);
  };
}

function createTable() {
  const tableLimit = prompt("How many people can join this table?");
  const request = new Request(
    `http://localhost:8080/create_table?limit=${tableLimit}`,
    {
      method: "GET",
    },
  );
  fetch(request).then((response) => {
    response.json().then((data) => {
      setTableData(data);
    });
  })
    .catch((err) => console.log(err));
}

const [appData, setAppData] = createSignal({});
const [tableData, setTableData] = createSignal(new Map());

const Main: Component = () => {
  return (
    <>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
          id="username"
          type="text"
          value="anonymous"
        />
      </div>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-pink-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
          id="tableID"
          type="text"
          value="1"
        />
      </div>
      <button
        class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={createTable}
      >
        Create Table
      </button>
      <button
        class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={joinTable}
      >
        Join Table
      </button>
      <h1>
        <b>{JSON.stringify(appData())}</b>
      </h1>
      <section class="md:container md:mx-auto">
        <h1 class="font-bold text-gray-900">Tables</h1>
        {JSON.stringify(tableData())}
      </section>
    </>
  );
};

const App: Component = () => {
  return <Main />;
};

export default App;

// // on page load
// window.onload = () => {
//   const username = document.getElementById("username") as HTMLInputElement;
//   const serverSocket = new WebSocket(
//     `ws://localhost:8080/join_table/212`,
//   );
// };

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

//   switch (data.event) {
//     case "update-users":
//     case "send-message":
//       break;

// function addMessage(username, message) {
//   // displays new message
//   // document.getElementById(
//   //   "conversation",
//   // ).innerHTML += `<b> ${username} </b>: ${message} <br/>`;
// }
