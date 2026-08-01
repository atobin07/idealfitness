export type MsgFont = "default" | "serif" | "mono" | "script" | "bold";

export const FONT_OPTIONS: { value: MsgFont; label: string; className: string }[] = [
  { value: "default", label: "Aa", className: "" },
  { value: "serif", label: "Aa", className: "font-serif" },
  { value: "mono", label: "Aa", className: "font-mono tracking-tight" },
  { value: "script", label: "Aa", className: "italic [font-family:'Segoe_Script','Snell_Roundhand','Bradley_Hand',cursive]" },
  { value: "bold", label: "Aa", className: "font-bold" },
];

export function fontClass(font: string | null | undefined): string {
  return FONT_OPTIONS.find((f) => f.value === font)?.className ?? "";
}
