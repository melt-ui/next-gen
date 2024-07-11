import { allComponentDocs } from "../../../.contentlayer/generated";

export type NavItem = {
	title: string;
	href?: string;
	disabled?: boolean;
	external?: boolean;
	label?: string;
};

export type SidebarNavItem = NavItem & {
	items: SidebarNavItem[];
	collapsible?: boolean;
};

export type NavItemWithChildren = NavItem & {
	items: NavItemWithChildren[];
};

export type Navigation = {
	main: NavItem[];
	sidebar: SidebarNavItem[];
};

export const navigation: Navigation = {
	main: [
		{
			title: "Documentation",
			href: "/docs",
		},
		{
			title: "Releases",
			href: "https://github.com/melt-ui/melt-ui/releases",
			external: true,
		},
	],
	sidebar: [
		{
			title: "Overview",
			collapsible: true,
			items: [
				{
					title: "Introduction",
					href: "/docs",
					items: [],
				},
				{
					title: "Getting Started",
					href: "/docs/getting-started",
					items: [],
				},
			],
		},
		{
			title: "Components",
			items: allComponentDocs.map((doc) => ({
				title: doc.title,
				href: `/docs/components/${doc.slug}`,
				label: doc.title,
				items: []
			})),
			collapsible: true,
		},
	],
};
