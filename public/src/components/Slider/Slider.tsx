import { Slider } from "@kobalte/core";
import "./Slider.scss";
export function SliderComponent() {
  return (
    <Slider.Root
      class="SliderRoot"
      minValue={100}
      maxValue={2000}
      // defaultValue={[20, 500]}
      step={20}
      getValueLabel={(params) => `$${params.values[0]}`}
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
