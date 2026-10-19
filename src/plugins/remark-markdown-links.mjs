import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slug as githubSlug } from "github-slugger";
import { visit } from "unist-util-visit";

const postsDir = fileURLToPath(new URL("../content/posts/", import.meta.url));

let basenameIndex = null;

function collectMarkdownFiles(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith(".")) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) collectMarkdownFiles(full, out);
		else if (entry.name.endsWith(".md")) out.push(full);
	}
	return out;
}

function findByBasename(name) {
	const lookup = () => basenameIndex.get(name) ?? [];
	if (!basenameIndex || lookup().length === 0) {
		basenameIndex = new Map();
		for (const file of collectMarkdownFiles(postsDir)) {
			const key = path.basename(file);
			basenameIndex.set(key, [...(basenameIndex.get(key) ?? []), file]);
		}
	}
	const matches = lookup();
	return matches.length === 1 ? matches[0] : null;
}

// Mirrors Obsidian's resolution order: relative to the note, vault root, then unique file name.
function resolveTarget(target, sourceFile) {
	const candidates = [
		path.resolve(path.dirname(sourceFile), target),
		path.resolve(postsDir, target),
	];
	return (
		candidates.find((file) => existsSync(file)) ??
		findByBasename(path.basename(target))
	);
}

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

function isInCollection(file) {
	const relative = path.relative(postsDir, file);
	return (
		!relative.startsWith("..") &&
		!relative.split(path.sep).some((segment) => segment.startsWith("_"))
	);
}

export function remarkMarkdownLinks() {
	return (tree, file) => {
		const sourceFile = file.path ?? file.history?.[0];
		if (!sourceFile) return;

		visit(tree, ["link", "definition"], (node) => {
			const match = node.url.match(/^([^#?]+\.md)(#.*)?$/);
			if (!match || /^[a-z][a-z\d+.-]*:/i.test(node.url)) return;

			const [, rawTarget, hash = ""] = match;
			let target;
			try {
				target = decodeURIComponent(rawTarget);
			} catch {
				target = rawTarget;
			}

			const resolved = resolveTarget(target, sourceFile);
			if (!resolved || !isInCollection(resolved)) {
				console.warn(
					`[remark-markdown-links] ${sourceFile}: cannot resolve "${node.url}"`,
				);
				return;
			}

			const anchor = hash
				? `#${githubSlug(decodeURIComponent(hash.slice(1)))}`
				: "";
			node.url = `/posts/${toSlug(resolved)}/${anchor}`;
		});
	};
}
