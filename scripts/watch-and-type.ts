import chokidar from "chokidar";
import { execSync } from "child_process";

chokidar.watch("./packages/melt/src/lib/builders/**/*.ts").on("change", (...args) => {
	execSync("pnpm run gen:api", { stdio: "inherit" });
});
