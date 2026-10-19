import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const postsDir = fileURLToPath(
	new URL("../content/posts/", import.meta.url),
);

let basenameIndex = null;

export function collectPostFiles(predicate, dir = postsDir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith(".")) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) collectPostFiles(predicate, full, out);
		else if (predicate(full)) out.push(full);
	}
	return out;
}

function findByBasename(name) {
	const lookup = () => basenameIndex.get(name) ?? [];
	if (!basenameIndex || lookup().length === 0) {
		basenameIndex = new Map();
		for (const file of collectPostFiles(() => true)) {
			const key = path.basename(file);
			basenameIndex.set(key, [...(basenameIndex.get(key) ?? []), file]);
		}
	}
	const matches = lookup();
	return matches.length === 1 ? matches[0] : null;
}

export function decodeUrlPath(url) {
	try {
		return decodeURIComponent(url);
	} catch {
		return url;
	}
}

// Mirrors Obsidian's resolution order: relative to the note, vault root, then unique file name.
export function resolvePostFile(target, sourceFile) {
	const candidates = [
		path.resolve(path.dirname(sourceFile), target),
		path.resolve(postsDir, target),
	];
	return (
		candidates.find((file) => existsSync(file)) ??
		findByBasename(path.basename(target))
	);
}

export function isInCollection(file) {
	const relative = path.relative(postsDir, file);
	return (
		!relative.startsWith("..") &&
		!path.isAbsolute(relative) &&
		!relative.split(path.sep).some((segment) => segment.startsWith("_"))
	);
}
