import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { Table as TableType } from "../../../../data_types.ts";
import "./Table.scss";
import { on } from "events";
import { clear } from "console";

const [table, setTable] = createSignal<TableType>();
let interval = null;
const getTableData = (tableID) => {
  const request = new Request(
    `http://localhost:8080/tables/${tableID}`,
    {
      method: "GET",
    },
  );
  fetchTableData(request);
  interval = setInterval(() => {
    fetchTableData(request);
  }, 5000);
};

const fetchTableData = async (request) => {
  fetch(request).then((response) => {
    if (response.status !== 200) {
      console.log("Table not found");
      clearInterval(interval);
      return;
    }
    response.json().then((data) => {
      console.log("message", data);
      setTable(data);
    }).catch((err) => console.log(err));
  })
    .catch((err) => console.log(err));
};

//TODO: get table info
//TODO: add a For element and loop over all the players and pass them to <Player /> component
export const Table: Component = () => {
  const params = useParams();
  const tableID = params.tableID;

  onMount(() => {
    getTableData(tableID);
  });

  onCleanup(() => {
    clearInterval(interval);
  });
  return (
    <section class="table">
      <Player />

      <Player />
      <Player />
      <Player />
      <Player />
      <Player />

      <div>Table ID: {table()?.id}</div>
    </section>
  );
};

const Player = () => {
  return (
    <div class="player">
      {true
        ? (
          <button class="player-image-section">
            sit here
          </button>
        )
        : (
          <div>
            <div class="player__name"></div>
            <div class="player__hand"></div>
            <div class="player__chips"></div>
          </div>
        )}
    </div>
  );
};
