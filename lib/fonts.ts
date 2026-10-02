import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

/**
 * Matches the design canvas: Bricolage Grotesque carries titles only,
 * Instrument Sans carries everything else.
 */
export const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-family",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const fontBody = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
