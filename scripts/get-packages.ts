import { findPackages } from "find-packages";

export async function getBuilderPackage() {
	return (
		await findPackages(process.cwd(), {
			patterns: ["packages/builders"],
		})
	)[0];
}
