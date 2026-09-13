import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14252C",
        muted: "#6E7E85",
        line: "#E3EBEE",
        canvas: "#F5F8F9",
        teal: {
          50: "#EDF8FA",
          100: "#D7EEF3",
          200: "#B9DDE6",
          300: "#88C3D1",
          400: "#4EA6BA",
          500: "#1683A5",
          600: "#08748F",
          700: "#075A74",
          800: "#064E68",
          900: "#063F55"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(20, 64, 78, 0.07)",
      }
    }
  },
  plugins: [],
};
export default config;
