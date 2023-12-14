/* @refresh reload */
import "./index.scss";
import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";
import { Lobby } from "./Lobby.tsx";
import { Table } from "./Table.tsx";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(
  () => (
    <Router>
      <Route path="/" component={Lobby} />
      <Route path="/test" component={Table} />
    </Router>
  ),
  root!,
);
