import { type Component, createEffect, createSignal, onMount } from "solid-js";
// TODO: Add the ability to reconnect to a table after getting disconnected store in local storage or a cookie
function joinTable() {
  const usernameElement = document.getElementById(
    "username",
  ) as HTMLInputElement;
  const tableID = document.getElementById("tableID") as HTMLInputElement;

  const username = usernameElement.value;
  //TODO: Add Try catch block
  const serverSocket = new WebSocket(
    `ws://localhost:8080/tables/join/${tableID.value}?username=${username}`,
  );
  serverSocket.onerror = (e) => {
    console.log("ERROR", e);
  };
  serverSocket.onclose = (e) => {
    console.log(username, e.reason);
  };
  serverSocket.onopen = (ws) => {
    serverSocket.send(JSON.stringify("Hello from the client!"));
  };
  getTableData();
  serverSocket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    if (!!data?.prompt) {
      setPrompts(data.prompt);
    }
    console.log("data", data);
    switch (data.event) {
      case "table-updated":
        setTableData(data.payload.table);
        setTablesData(data.payload.tables);
        break;
      case "table-joined":
        const buyInRange = data.buyInRange;
        //Prompt user to buy in within the range of the table
        const amount = Number(prompt(
          `Buy in between ${buyInRange.min} and ${buyInRange.max}`,
        ));
        const finalAmount = amount <= buyInRange.max && amount >= buyInRange.min
          ? amount
          : buyInRange.min;
        serverSocket.send(
          JSON.stringify({ event: "buy-in", payload: finalAmount }),
        );
        break;
      case "bet":
        // if (!data.payload.yourTurn) {
        //   break;
        // }
        const payload = data.payload;
        const betAmount = Number(prompt(
          `bet between ${payload.blinds.big} and ${payload.chips}`,
        ));
        const finalBetAmount = !!betAmount ? betAmount : payload.blinds.big;
        serverSocket.send(
          //TODO: include userID in payload potentially
          JSON.stringify({ event: "bet", payload: finalBetAmount, username }),
        );
        setHandData(data.payload.hand);
        setFlop(data.payload.flop);
        break;
    }
  };
}

function getTablesData() {
  fetch("http://localhost:8080/tables").then((response) => {
    console.log("response", response);
    response.json().then((data) => {
      setTablesData(data);
    });
  });
}

function getTableData(tableID = 1) {
  fetch(`http://localhost:8080/tables/${tableID}`)
    .then((response) => {
      response.json().then((data) => {
        setTableData(data);
      });
    })
    .catch((err) => console.log(err));
}

function createTable() {
  const tableLimit = prompt("How many people can join this table?") || 10;
  const request = new Request(
    `http://localhost:8080/tables/create?limit=${tableLimit}`,
    {
      method: "GET",
    },
  );
  fetch(request).then((response) => {
    console.log("message", response);
    response.json().then((data) => {
      setTablesData(data);
    });
  })
    .catch((err) => console.log(err));
}

const [tableData, setTableData] = createSignal({});
const [tablesData, setTablesData] = createSignal([]);
const [prompts, setPrompts] = createSignal([]);
const [handData, setHandData] = createSignal([]);
const [flop, setFlop] = createSignal([]);

createEffect(() => {
  getTableData();
  getTablesData();
});

const Main: Component = () => {
  return (
    <>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-gray-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="username"
          type="text"
          value="anonymous"
        />
      </div>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-green-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="tableID"
          type="text"
          value="1"
        />
      </div>
      <button
        class="bg-blue hover:bg-gray-100 text-gray-200 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={createTable}
      >
        Create Table
      </button>
      <button
        class="bg-blue hover:bg-gray-100 text-gray-200 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={joinTable}
      >
        Join Table
      </button>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Current Hand
        </h1>
        <p>{JSON.stringify(handData())}</p>
      </section>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Community cards
        </h1>
        <p>{JSON.stringify(flop())}</p>
      </section>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Current Table
        </h1>
        <p>{JSON.stringify(tableData())}</p>
      </section>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">Tables</h1>
        {JSON.stringify(tablesData())}
      </section>
      <section class="md:container md:mx-auto">
        <h1 class="font-bold text-blue-300">Prompts</h1>
        {JSON.stringify(prompts())}
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
// }
