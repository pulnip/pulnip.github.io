import { readFileSync } from "node:fs";
import path from "node:path";
import { slug as githubSlug } from "github-slugger";
import { visit } from "unist-util-visit";
import {
	decodeUrlPath,
	isInCollection,
	postsDir,
	resolvePostFile,
} from "./post-files.mjs";

function frontmatterSlug(file) {
	const frontmatter = readFileSync(file, "utf-8").match(
		/^---\r?\n([\s\S]*?)\r?\n---/,
	);
	const slugLine = frontmatter?.[1].match(/^slug:\s*["']?(.+?)["']?\s*$/m);
	return slugLine?.[1];
}

// Same rule Astro uses for content collection slugs.
function toSlug(file) {
	const overridden = frontmatterSlug(file);
	if (overridden) return overridden;

	const relative = path.relative(postsDir, file).replace(/\.md$/, "");
	return relative
		.split(path.sep)
		.map((segment) => githubSlug(segment))
		.join("/")
		.replace(/\/index$/, "");
}

export function remarkMarkdownLinks() {
	return (tree, file) => {
		const sourceFile = file.path ?? file.history?.[0];
		if (!sourceFile) return;

		visit(tree, ["link", "definition"], (node) => {
			const match = node.url.match(/^([^#?]+\.md)(#.*)?$/);
			if (!match || /^[a-z][a-z\d+.-]*:/i.test(node.url)) return;

			const [, rawTarget, hash = ""] = match;
			const resolved = resolvePostFile(decodeUrlPath(rawTarget), sourceFile);
			if (!resolved || !isInCollection(resolved)) {
				console.warn(
					`[remark-markdown-links] ${sourceFile}: cannot resolve "${node.url}"`,
				);
				return;
			}

			const anchor = hash ? `#${githubSlug(decodeUrlPath(hash.slice(1)))}` : "";
			node.url = `/posts/${toSlug(resolved)}/${anchor}`;
		});
	};
}
