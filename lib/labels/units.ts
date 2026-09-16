// Canonical internal unit is points (spec section 30). 1in = 72pt = 25.4mm.
export type LengthUnit = "pt" | "mm" | "cm" | "in";

export function toPoints(value: number, unit: LengthUnit): number {
  switch (unit) {
    case "mm":
      return (value / 25.4) * 72;
    case "cm":
      return (value / 2.54) * 72;
    case "in":
      return value * 72;
    default:
      return value;
  }
}
