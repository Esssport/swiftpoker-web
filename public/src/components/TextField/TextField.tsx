import { TextField } from "@kobalte/core";
import "./TextField.scss";
export function TextComponent(props) {
  const cappedValue = () => {
    const val = Math.min(+props.value, +props.maxValue);
    console.log("Val", val);
    props.onChange(val);
  };
  return (
    <TextField.Root
      value={props.value}
      onChange={cappedValue}
      class="text-field"
    >
      <TextField.Label class="text-field__label">
        {props.Label}
      </TextField.Label>
      <TextField.Input class="text-field__input" />
    </TextField.Root>
  );
}
