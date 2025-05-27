import { testWithEffect } from "$lib/utils/test.svelte";
import { expect } from "vitest";
import { FileUpload } from "../FileUpload.svelte";

testWithEffect("Clear should not trigger onSelectedChange if already empty", () => {
	let calls = 0;
	const fu = new FileUpload({
		onSelectedChange() {
			calls++;
		},
	});
	expect(calls).toBe(0);
	fu.selected = new File([""], "empty.txt", { type: "text/plain" });
	expect(calls).toBe(1);
	fu.clear();
	expect(calls).toBe(2);
	fu.clear();
	expect(calls).toBe(2);
});
