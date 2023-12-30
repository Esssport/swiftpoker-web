import { Slider } from "@kobalte/core";
import { createEffect, createSignal } from "solid-js";
import "./Slider.scss";
export function SliderComponent(props) {
  const [betValue, setBetValue] = createSignal<number[]>([props.minValue]);

  createEffect(() => {
    setBetValue([props.minValue]);
  });

  const setSliderValue = (value) => {
    let newValue;
    if (value[0] > betValue()[0]) {
      newValue = betValue()[0] + props.bigBlind;
    } else if (value[0] < betValue()[0]) {
      newValue = betValue()[0] - props.bigBlind;
    } else {
      newValue = value[0];
    }
    setBetValue([newValue]);
    props.setBetValue(newValue);
  };

  return (
    <Slider.Root
      class="SliderRoot"
      minValue={Number(props.minValue)}
      maxValue={Number(props.maxValue)}
      step={props.bigBlind}
      // getValueLabel={(params) => `$${params.values[0]}`}
      value={betValue()}
      onChange={setSliderValue}
    >
      <div class="SliderLabel">
        <Slider.Label>Bet Amount</Slider.Label>
        <Slider.ValueLabel hidden={true} />
      </div>
      <Slider.Track class="SliderTrack">
        <Slider.Fill class="SliderRange" />
        <Slider.Thumb class="SliderThumb">
          <Slider.Input />
        </Slider.Thumb>
        <Slider.Thumb class="SliderThumb SliderThumb">
          <Slider.Input />
        </Slider.Thumb>
      </Slider.Track>
    </Slider.Root>
  );
}
