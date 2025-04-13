export function safeEffect(cb: () => void) {
	try {
		$effect(cb);
	} catch {
		cb();
	}
}
