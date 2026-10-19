import {
	copyFileSync,
	createReadStream,
	existsSync,
	mkdirSync,
	statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visit } from "unist-util-visit";
import {
	collectPostFiles,
	decodeUrlPath,
	isInCollection,
	postsDir,
	resolvePostFile,
} from "./post-files.mjs";

const MediaRoute = "/media";
const VideoTypes = {
	".mp4": "video/mp4",
	".m4v": "video/mp4",
	".webm": "video/webm",
	".mov": "video/quicktime",
	".ogv": "video/ogg",
};

function isVideo(file) {
	return path.extname(file).toLowerCase() in VideoTypes;
}

function isPublishedVideo(file) {
	return isVideo(file) && isInCollection(file);
}

function toMediaUrl(file) {
	const segments = path.relative(postsDir, file).split(path.sep);
	return `${MediaRoute}/${segments.map(encodeURIComponent).join("/")}`;
}

function fromMediaUrl(url) {
	const relative = decodeUrlPath(url.split(/[?#]/)[0]);
	const file = path.resolve(postsDir, `.${relative}`);
	return isPublishedVideo(file) && existsSync(file) ? file : null;
}

function escapeAttribute(value) {
	return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function videoHtml(src, alt) {
	const label = alt ? ` aria-label="${escapeAttribute(alt)}"` : "";
	return `<video class="w-full rounded-xl" src="${escapeAttribute(src)}"${label} controls muted loop playsinline preload="metadata"></video>`;
}

function serveVideo(req, res, next) {
	const file = fromMediaUrl(req.url ?? "");
	if (!file) return next();

	const { size } = statSync(file);
	const headers = {
		"Accept-Ranges": "bytes",
		"Content-Type": VideoTypes[path.extname(file).toLowerCase()],
	};

	const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
	if (!range || (!range[1] && !range[2])) {
		res.writeHead(200, { ...headers, "Content-Length": size });
		createReadStream(file).pipe(res);
		return;
	}

	const start = range[1]
		? Number(range[1])
		: Math.max(0, size - Number(range[2]));
	const end =
		range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
	if (start >= size || start > end) {
		res.writeHead(416, { "Content-Range": `bytes */${size}` });
		res.end();
		return;
	}

	res.writeHead(206, {
		...headers,
		"Content-Length": end - start + 1,
		"Content-Range": `bytes ${start}-${end}/${size}`,
	});
	createReadStream(file, { start, end }).pipe(res);
}

export function remarkVideoEmbed() {
	return (tree, file) => {
		const sourceFile = file.path ?? file.history?.[0];
		if (!sourceFile) return;

		visit(tree, "image", (node, index, parent) => {
			const urlPath = node.url.split(/[?#]/)[0];
			if (!parent || index === undefined || !isVideo(urlPath)) return;

			let src = node.url;
			if (!/^[a-z][a-z\d+.-]*:/i.test(node.url)) {
				const resolved = resolvePostFile(decodeUrlPath(urlPath), sourceFile);
				if (!resolved || !isPublishedVideo(resolved)) {
					console.warn(
						`[remark-video-embed] ${sourceFile}: cannot resolve "${node.url}"`,
					);
					return;
				}
				src = toMediaUrl(resolved);
			}

			parent.children[index] = {
				type: "html",
				value: videoHtml(src, node.alt),
			};
		});
	};
}

export function postVideos() {
	return {
		name: "post-videos",
		hooks: {
			"astro:config:setup": ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: "post-videos-dev-server",
								configureServer(server) {
									server.middlewares.use(MediaRoute, serveVideo);
								},
							},
						],
					},
				});
			},
			"astro:build:done": ({ dir, logger }) => {
				const outDir = fileURLToPath(dir);
				const videos = collectPostFiles(isPublishedVideo);
				for (const video of videos) {
					const destination = path.join(
						outDir,
						MediaRoute,
						path.relative(postsDir, video),
					);
					mkdirSync(path.dirname(destination), { recursive: true });
					copyFileSync(video, destination);
				}
				logger.info(`Copied ${videos.length} video(s) to ${MediaRoute}/`);
			},
		},
	};
}
