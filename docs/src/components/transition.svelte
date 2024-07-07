<script lang="ts" context="module">
	const CTX_KEY = Symbol("transition");

	const ctx = {
		get() {
			return getContext<Context>(CTX_KEY);
		},
		set(context: Context) {
			return setContext(CTX_KEY, context);
		},
	};

	class Context {
		// Observable state for child transitions
		show = $state<boolean | null>(null);
		appear: boolean;
		// number of child transitions that need to be waited before completed
		count: number;
		// method to communicate child transition completion
		completed: (() => Promise<void>) | (() => void) = () => {};

		constructor(config: { appear?: boolean; count: number; completed: () => void }) {
			this.appear = config.appear ?? false;
			this.count = config.count ?? 0;
			this.completed = config.completed ?? (() => {});
		}
	}

	// convert a string of class names into an array, for use with DOM methods
	function classes(classes: string) {
		return classes ? classes.split(" ").filter((x) => x) : [];
	}

	// to wait until css changes have been appplied we use a double rAF
	function nextFrame() {
		const raf = requestAnimationFrame; // help minification
		return new Promise((resolve) => raf(() => raf(resolve)));
	}

	export interface TransitionProps {
		/** state of element (shown or hidden), if null this we are treated as a child
		 * transition and will get the state from our parent, coordinating with it */
		show?: boolean | null;
		/** apply transition when element is first rendered (i.e. animate in) */
		applyImmediately?: boolean;
		/** whether the element should be removed from the DOM (vs hidden) */
		unmount?: boolean;
		/** classes to apply when entering (showing) */
		enter?: string;
		enterFrom?: string;
		enterTo?: string;
		/** classes to apply when leaving (hiding) */
		leave?: string;
		leaveFrom?: string;
		leaveTo?: string;
		/** children */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { getContext, setContext,  tick, type Snippet } from "svelte";
	import { watch } from "runed";

	const {
		show = null,
		applyImmediately,
		unmount,
		enter = "",
		enterFrom = "",
		enterTo = "",
		leave = "",
		leaveFrom = "",
		leaveTo = "",
		children,
	}: TransitionProps = $props();

	// convert class strings to arrays, for easier use with DOM elements
	const enterClasses = $derived(classes(enter));
	const enterFromClasses = $derived(classes(enterFrom));
	const enterToClasses = $derived(classes(enterTo));

	// if leave, leaveFrom, or leaveTo are not specified then use enter values
	// as a convenient way to avoid repeating definitions (but reverse To & From)
	const leaveClasses = $derived(classes(leave === null ? enter : leave));
	const leaveFromClasses = $derived(classes(leaveFrom === null ? enterTo : leaveFrom));
	const leaveToClasses = $derived(classes(leaveTo === null ? enterFrom : leaveTo));

	// get parent context if we're a child
	const parent = show === null ? ctx.get() : null;

	// create our own context (which will also become parent for any children)
	const context = new Context({
		appear: parent ? parent.appear : applyImmediately,
		count: 0,
		completed: () => {},
	});

	// set context for children to use
	setContext(CTX_KEY, context);

	// set initial state
	let display = $state(show && !context.appear ? "contents" : "none");
	let mounted = $state(!unmount || show === true);

	// use action that hooks into our wrapper div and manages everything
	function transition(node: HTMLElement, show: boolean | null) {
		// the child element that we will be applying classes to
		// set later once the component has mounted
		let el: HTMLElement;

		function addClasses(...classes: string[]) {
			el.classList.add(...classes);
		}

		function removeClasses(...classes: string[]) {
			el.classList.remove(...classes);
		}

		function transitionEnd(transitions: string[]) {
			// return a promise that transitions are complete (resolve immediately if no transitions)
			return transitions.length
				? new Promise<void>((resolve) =>
						el.addEventListener(
							"transitionend",
							(e) => {
								e.stopPropagation();
								resolve();
							},
							{ once: true },
						),
					)
				: Promise.resolve();
		}

		function childrenCompleted(parentCompleted: Promise<void>) {
			// return a promise that all children have completed (resolve immediately if no children)
			// sets the context completed method that children call to a promise that the parent has completed
			return context.count
				? new Promise<void>((resolve) => {
						let count = 0;
						context.completed = () => {
							if (++count === context.count) {
								resolve();
							}
							return parentCompleted;
						};
					})
				: Promise.resolve();
		}

		async function apply(show: boolean, base: string[], from: string[], to: string[]) {
			el = await ensureMountedElement();

			let resolveCompleted = () => {};
			const completed = new Promise<void>((resolve) => {
				resolveCompleted = resolve;
			});

			const children = childrenCompleted(completed);

			// set state for any child transitions
			context.show = show;

			addClasses(...base, ...from);

			const transitioned = transitionEnd(base);

			await nextFrame();

			removeClasses(...from);
			addClasses(...to);

			await Promise.all([transitioned, children]);

			if (parent) {
				await parent.completed();
			}

			removeClasses(...base, ...to);

			resolveCompleted();
		}

		async function ensureMountedElement() {
			if (unmount && !mounted) {
				mounted = true;
				await tick(); // give slot chance to render
			}
			return node.firstElementChild as HTMLElement;
		}

		async function enter() {
			// dispatch("before-enter");

			display = "contents";

			await apply(true, enterClasses, enterFromClasses, enterToClasses);

			// dispatch("after-enter");
		}

		async function leave() {
			// dispatch("before-leave");

			await apply(false, leaveClasses, leaveFromClasses, leaveToClasses);

			display = "none";

			if (unmount) {
				mounted = false;
			}

			// dispatch("after-leave");
		}

		// execute is always called, even for the initial render, so we use a flag
		// to prevent a transition running unless appear is set for animating in
		let run = context.appear;

		// temp fix for Svelte 5 issue #11448
		let showPrev: boolean | null;

		function execute(show: boolean | null) {
			// temp fix for Svelte 5 issue #11448 triggering animations when prop hasn't changed
			if (show === showPrev) {
				return;
			}

			showPrev = show;

			// run appropriate transition, set promise for completion
			executing = run ? (show ? executing.then(enter) : executing.then(leave)) : Promise.resolve();

			// play transitions on all subsequent calls ...
			run = true;
		}

		// to wait for in-progress transitions to complete
		let executing = Promise.resolve();

		// if we're a child transition, increment the count on the parent and listen for state notifications
		if (parent) {
			parent.count++;
			// child updates happen here, as show propery is updated by the parent, which triggers the transition
			watch(() => parent.show, execute);
		} else {
			// otherwise, first run through to set initial state (and possibly, 'appear' transition)
			execute(show);
		}

		return {
			update(show: boolean | null) {
				// top-level updates happen here, as show property is updated, which triggers the transition
				execute(show);
			},
			destroy() {
				// if we're a child and being removed, notify our parent and stop listening for updates
				if (parent) {
					parent.count--;
				}
			},
		};
	}
</script>

<div style:display use:transition={show}>
	{#if mounted}
		{@render children()}
	{/if}
</div>
