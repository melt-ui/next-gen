import { testWithEffect } from "$lib/utils/test.svelte";
import { render } from "vitest-browser-svelte";
import { expect } from "vitest";

import ToastTest from "./ToastTest.svelte";

testWithEffect("Toaster should be callable from context module", async () => {
	expect(() => render(ToastTest)).not.toThrow();
});
