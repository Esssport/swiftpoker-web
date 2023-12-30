import { Slider } from "@kobalte/core";
import { createSignal } from "solid-js";
import "./Slider.scss";
export function SliderComponent(props) {
  const [betValue, setBetValue] = createSignal<number[]>([props.minValue]);

  const setSliderValue = (value) => {
    let newValue;
    if (value[0] > betValue()[0]) {
      newValue = betValue()[0] + props.minValue;
      setBetValue([newValue]);
    } else if (value[0] < betValue()[0]) {
      newValue = betValue()[0] - props.minValue;
      setBetValue([newValue]);
    } else {
      newValue = betValue()[0];
    }
    props.setBetValue(newValue);
  };

  return (
    <Slider.Root
      class="SliderRoot"
      minValue={Number(props.minValue)}
      maxValue={Number(props.maxValue)}
      step={props.minValue}
      getValueLabel={(params) => `$${params.values[0]}`}
      value={betValue()}
      onChange={setSliderValue}
    >
      <div class="SliderLabel">
        <Slider.Label>Money</Slider.Label>
        <Slider.ValueLabel />
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
