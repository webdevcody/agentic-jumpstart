"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import {
  ButtonGroup,
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "~/components/ui/button-group";
import { Minus, Plus, Save, Loader2 } from "lucide-react";

interface NumberInputWithControlsProps {
  /** Current display value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Label shown before the input */
  label?: string;
  /** Prefix shown inside the input (e.g., "$") */
  prefix?: string;
  /** Suffix shown inside the input (e.g., "%") */
  suffix?: string;
  /** Step for +/- buttons */
  step?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether save is pending */
  isPending?: boolean;
  /** Whether there are unsaved changes */
  hasChanges?: boolean;
  /** Width class for the input group */
  inputWidth?: string;
}

export function NumberInputWithControls({
  value,
  onChange,
  onSave,
  label,
  prefix,
  suffix,
  step = 1,
  min = 0,
  max,
  disabled = false,
  isPending = false,
  hasChanges = false,
  inputWidth = "w-32",
}: NumberInputWithControlsProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      let numVal = val === "" ? 0 : parseInt(val, 10);
      if (max !== undefined && numVal > max) numVal = max;
      if (numVal < min) numVal = min;
      onChange(numVal.toString());
    }
  };

  const handleDecrement = () => {
    const current = parseInt(value) || 0;
    onChange(Math.max(min, current - step).toString());
  };

  const handleIncrement = () => {
    const current = parseInt(value) || 0;
    const newVal = current + step;
    onChange(max !== undefined ? Math.min(max, newVal).toString() : newVal.toString());
  };

  return (
    <ButtonGroup>
      <InputGroup className={`${inputWidth} h-10`}>
        {label && (
          <InputGroupAddon align="inline-start" className="text-xs text-muted-foreground">
            {label}
          </InputGroupAddon>
        )}
        {prefix && <InputGroupAddon align="inline-start">{prefix}</InputGroupAddon>}
        <InputGroupInput
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleInputChange}
          disabled={disabled || isPending}
          className="text-center text-sm h-10"
        />
        {suffix && <InputGroupAddon align="inline-end">{suffix}</InputGroupAddon>}
      </InputGroup>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={onSave}
        disabled={!hasChanges || isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={handleDecrement}
        disabled={disabled || isPending}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={handleIncrement}
        disabled={disabled || isPending}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </ButtonGroup>
  );
}
