// Reusable unit-conversion registry (spec section 11). Each unit converts to
// and from an explicit base unit per category to avoid compounding rounding
// error from unit-to-unit direct conversion tables.
export interface UnitDefinition {
  id: string;
  label: string;
  category: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const linear = (factor: number): Pick<UnitDefinition, "toBase" | "fromBase"> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

export const UNIT_CATEGORIES = [
  "Length",
  "Area",
  "Volume",
  "Weight / Mass",
  "Temperature",
  "Time",
  "Speed",
  "Data",
  "Pressure",
  "Energy",
  "Power",
  "Frequency",
  "Angle",
] as const;

export const UNIT_REGISTRY: UnitDefinition[] = [
  // Length -> base: meter
  { id: "mm", label: "Millimeter", category: "Length", ...linear(0.001) },
  { id: "cm", label: "Centimeter", category: "Length", ...linear(0.01) },
  { id: "m", label: "Meter", category: "Length", ...linear(1) },
  { id: "km", label: "Kilometer", category: "Length", ...linear(1000) },
  { id: "in", label: "Inch", category: "Length", ...linear(0.0254) },
  { id: "ft", label: "Foot", category: "Length", ...linear(0.3048) },
  { id: "yd", label: "Yard", category: "Length", ...linear(0.9144) },
  { id: "mi", label: "Mile", category: "Length", ...linear(1609.344) },

  // Area -> base: square meter
  { id: "mm2", label: "Square millimeter", category: "Area", ...linear(1e-6) },
  { id: "cm2", label: "Square centimeter", category: "Area", ...linear(1e-4) },
  { id: "m2", label: "Square meter", category: "Area", ...linear(1) },
  { id: "km2", label: "Square kilometer", category: "Area", ...linear(1e6) },
  { id: "ha", label: "Hectare", category: "Area", ...linear(10000) },
  { id: "ac", label: "Acre", category: "Area", ...linear(4046.8564224) },
  { id: "ft2", label: "Square foot", category: "Area", ...linear(0.09290304) },

  // Volume -> base: liter
  { id: "ml", label: "Milliliter", category: "Volume", ...linear(0.001) },
  { id: "l", label: "Liter", category: "Volume", ...linear(1) },
  { id: "m3", label: "Cubic meter", category: "Volume", ...linear(1000) },
  { id: "gal_us", label: "US Gallon", category: "Volume", ...linear(3.785411784) },
  { id: "qt_us", label: "US Quart", category: "Volume", ...linear(0.946352946) },
  { id: "cup_us", label: "US Cup", category: "Volume", ...linear(0.2365882365) },
  { id: "floz_us", label: "US Fluid ounce", category: "Volume", ...linear(0.0295735296) },

  // Weight/Mass -> base: kilogram
  { id: "mg", label: "Milligram", category: "Weight / Mass", ...linear(1e-6) },
  { id: "g", label: "Gram", category: "Weight / Mass", ...linear(0.001) },
  { id: "kg", label: "Kilogram", category: "Weight / Mass", ...linear(1) },
  { id: "t", label: "Metric ton", category: "Weight / Mass", ...linear(1000) },
  { id: "oz", label: "Ounce", category: "Weight / Mass", ...linear(0.028349523125) },
  { id: "lb", label: "Pound", category: "Weight / Mass", ...linear(0.45359237) },

  // Temperature -> base: Celsius (non-linear, defined explicitly)
  {
    id: "c",
    label: "Celsius",
    category: "Temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  {
    id: "f",
    label: "Fahrenheit",
    category: "Temperature",
    toBase: (v) => ((v - 32) * 5) / 9,
    fromBase: (v) => (v * 9) / 5 + 32,
  },
  {
    id: "k",
    label: "Kelvin",
    category: "Temperature",
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15,
  },

  // Time -> base: second
  { id: "ms", label: "Millisecond", category: "Time", ...linear(0.001) },
  { id: "s", label: "Second", category: "Time", ...linear(1) },
  { id: "min", label: "Minute", category: "Time", ...linear(60) },
  { id: "hr", label: "Hour", category: "Time", ...linear(3600) },
  { id: "day", label: "Day", category: "Time", ...linear(86400) },
  { id: "week", label: "Week", category: "Time", ...linear(604800) },

  // Speed -> base: meters per second
  { id: "mps", label: "Meters/second", category: "Speed", ...linear(1) },
  { id: "kmph", label: "Kilometers/hour", category: "Speed", ...linear(1000 / 3600) },
  { id: "mph", label: "Miles/hour", category: "Speed", ...linear(1609.344 / 3600) },
  { id: "knot", label: "Knot", category: "Speed", ...linear(0.514444) },

  // Data -> base: byte
  { id: "bit", label: "Bit", category: "Data", ...linear(0.125) },
  { id: "byte", label: "Byte", category: "Data", ...linear(1) },
  { id: "kb", label: "Kilobyte", category: "Data", ...linear(1024) },
  { id: "mb", label: "Megabyte", category: "Data", ...linear(1024 ** 2) },
  { id: "gb", label: "Gigabyte", category: "Data", ...linear(1024 ** 3) },
  { id: "tb", label: "Terabyte", category: "Data", ...linear(1024 ** 4) },

  // Pressure -> base: pascal
  { id: "pa", label: "Pascal", category: "Pressure", ...linear(1) },
  { id: "kpa", label: "Kilopascal", category: "Pressure", ...linear(1000) },
  { id: "bar", label: "Bar", category: "Pressure", ...linear(100000) },
  { id: "atm", label: "Atmosphere", category: "Pressure", ...linear(101325) },
  { id: "psi", label: "PSI", category: "Pressure", ...linear(6894.757293168) },

  // Energy -> base: joule
  { id: "j", label: "Joule", category: "Energy", ...linear(1) },
  { id: "kj", label: "Kilojoule", category: "Energy", ...linear(1000) },
  { id: "cal", label: "Calorie", category: "Energy", ...linear(4.184) },
  { id: "kcal", label: "Kilocalorie", category: "Energy", ...linear(4184) },
  { id: "wh", label: "Watt-hour", category: "Energy", ...linear(3600) },
  { id: "kwh", label: "Kilowatt-hour", category: "Energy", ...linear(3600000) },

  // Power -> base: watt
  { id: "w", label: "Watt", category: "Power", ...linear(1) },
  { id: "kw", label: "Kilowatt", category: "Power", ...linear(1000) },
  { id: "hp", label: "Horsepower", category: "Power", ...linear(745.699872) },

  // Frequency -> base: hertz
  { id: "hz", label: "Hertz", category: "Frequency", ...linear(1) },
  { id: "khz", label: "Kilohertz", category: "Frequency", ...linear(1000) },
  { id: "mhz", label: "Megahertz", category: "Frequency", ...linear(1e6) },
  { id: "ghz", label: "Gigahertz", category: "Frequency", ...linear(1e9) },

  // Angle -> base: degree
  { id: "deg", label: "Degree", category: "Angle", ...linear(1) },
  { id: "rad", label: "Radian", category: "Angle", ...linear(180 / Math.PI) },
  { id: "grad", label: "Gradian", category: "Angle", ...linear(0.9) },
];

export function unitsByCategory(category: string): UnitDefinition[] {
  return UNIT_REGISTRY.filter((u) => u.category === category);
}

export function convertUnit(value: number, fromId: string, toId: string): number {
  const from = UNIT_REGISTRY.find((u) => u.id === fromId);
  const to = UNIT_REGISTRY.find((u) => u.id === toId);
  if (!from || !to) throw new Error("Unknown unit.");
  if (from.category !== to.category) throw new Error("Units must be in the same category.");
  return to.fromBase(from.toBase(value));
}
