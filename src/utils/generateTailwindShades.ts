import chroma from "chroma-js";

export function generateTailwindShades(baseColor: string) {
	// These are roughly how Tailwind's default shades are spaced
	const scale = chroma.scale(["#fff", baseColor, "#000"]).mode("lrgb");

	const colors = {
		50: scale(0.05).hex(),
		100: scale(0.1).hex(),
		200: scale(0.2).hex(),
		300: scale(0.3).hex(),
		400: scale(0.4).hex(),
		500: scale(0.5).hex(), // base
		600: scale(0.6).hex(),
		700: scale(0.7).hex(),
		800: scale(0.8).hex(),
		900: scale(0.9).hex(),
		950: scale(0.95).hex(),
	};

	for (const [key, value] of Object.entries(colors)) {
		document.documentElement.style.setProperty("--main-" + key, value);
	}
}
