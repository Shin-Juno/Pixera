import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        base: command === "build" ? "/Pixera/" : "/",
        plugins: [react()],
        optimizeDeps: {
            exclude: ["@jsquash/avif", "@jsquash/jpeg", "@jsquash/png", "@jsquash/webp"]
        }
    });
});
