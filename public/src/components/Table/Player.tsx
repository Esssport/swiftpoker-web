import { For } from "solid-js";
import { Player as PlayerType } from "../../../../utils/tableBlueprint.ts";
import { Chips } from "./Chips.tsx";
import { Accessor } from "solid-js";

export const Player = (
  { player, hands, table, activeUser }: {
    hands: Accessor<any>;
    table: Accessor<any>;
    activeUser: Accessor<string>;
    player: PlayerType;
  },
) => {
  const playerHands = hands()?.get(String(player.username));
  const playerBets = player.bets[table()?.gameState.stage];
  return (
    <div
      classList={{
        "player": true,
        active: activeUser() === player.username,
      }}
    >
      {true
        ? (
          <div class="player-image-section">
            {player.role
              ? (
                <img
                  src={`/src/assets/chips/${player.role}.png`}
                  class="button-image"
                />
              )
              : null}

            {player.isDealer && (
              <>
                <img src="/src/assets/chips/dealer.png" class="button-image" />
              </>
            )}
            {player.folded && <div>FOLDED</div>}
            <div class="player-name">{player.username}</div>
            <div classList={{ "player-hand": true, "folded": player.folded }}>
              {playerHands
                ? (
                  <For each={playerHands}>
                    {(card) => (
                      <img
                        class="hand-image"
                        src={`/src/assets/cards/${card[0]}.png`}
                      >
                        {`${card[1].name} of ${card[1].suit}`}
                      </img>
                    )}
                  </For>
                )
                : (
                  <>
                    <img
                      class="hand-image"
                      src={`/src/assets/cards/hand.png`}
                    >
                      hidden cards
                    </img>
                    <img
                      class="hand-image"
                      src={`/src/assets/cards/hand.png`}
                    >
                      hidden cards
                    </img>
                  </>
                )}
            </div>
            <div class="player-chips">
              {/* <img src="/src/assets/chips/chip.png" class="chip-image" /> */}
              {/* <Chips chips={player.chips} /> */}
              {player.chips}
            </div>
            <div class="player-bet">
              {playerBets && playerBets > 0
                ? <Chips chips={playerBets} />
                : null}
            </div>
          </div>
        )
        : (
          <div class="player-image-section">
            <div class="player__name"></div>
            <div class="player__hand"></div>
            <div class="player__chips"></div>
          </div>
        )}
    </div>
  );
};
