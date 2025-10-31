module.exports = {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dv: { primary: "#4f46e5", gray: "#64748b" }
      },
      boxShadow: { dv: "0 1px 2px rgba(0,0,0,0.06)" }
    }
  },
  plugins: []
};
