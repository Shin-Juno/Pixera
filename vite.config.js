import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    base: "/Pixera/",
    plugins: [react()],
    optimizeDeps: {
        exclude: ["@jsquash/avif", "@jsquash/jpeg", "@jsquash/png", "@jsquash/webp"]
    }
});
