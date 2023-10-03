import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import unplugin from "@beqa/unplugin-transform-react-slots";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [unplugin.vite(), react()],
});
