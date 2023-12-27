import * as slider from "@zag-js/slider";
import { normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId, For } from "solid-js";

export function Slider() {
  const [state, send] = useMachine(
    slider.machine({ id: createUniqueId(), value: [0, 20, 40] }),
  );

  const api = createMemo(() => slider.connect(state, send, normalizeProps));

  return (
    <div {...api().rootProps}>
      <div>
        <label {...api().labelProps}>Slider Label</label>
        <output {...api().valueTextProps}>{api().value.at(0)}</output>
      </div>
      <div {...api().controlProps}>
        <div {...api().trackProps}>
          <div {...api().rangeProps} />
        </div>
        <For each={api().value}>
          {(_, index) => (
            <div {...api().getThumbProps({ index: index() })}>
              <input {...api().getHiddenInputProps({ index: index() })} />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
