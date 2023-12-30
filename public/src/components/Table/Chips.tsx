import { For } from "solid-js";

export const Chips = (props: { orientation?: string; chips: number }) => {
  const chipsDevisibles = [
    1000000,
    100000,
    10000,
    5000,
    2000,
    1000,
    500,
    200,
    100,
    50,
    20,
    10,
    5,
    2,
    1,
  ];

  // console.log("Chips", chips);
  const orientation = props.orientation || "vertical"; // vertical for bets or horizontal for pot

  const chipsToRender = (chips: number): number[] => {
    const chipsArray = [];
    let chipsRemaining = chips;
    for (let i = 0; i < chipsDevisibles.length; i++) {
      if (chipsRemaining >= chipsDevisibles[i]) {
        const quotient = Math.floor(chipsRemaining / chipsDevisibles[i]);
        chipsRemaining = chipsRemaining % chipsDevisibles[i];
        for (let j = 0; j < quotient; j++) {
          chipsArray.push(chipsDevisibles[i]);
        }
      }
    }
    return chipsArray;
  };
  // console.log("chipsToRender(props.chips)", chipsToRender(props.chips));
  return (
    <div class={`chips ${orientation}`}>
      <For each={chipsToRender(props.chips)}>
        {(chip) => (
          <img
            src={`/src/assets/chips/${chip}.png`}
            class={`chip-image ${orientation}`}
          />
        )}
      </For>
    </div>
  );
};
