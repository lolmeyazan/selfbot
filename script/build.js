import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, mkdir, readdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server deps to bundle to reduce openat(2) syscalls
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

// Recursively copy directory
async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function buildAll() {
  const isCloudflare = process.argv.includes("--cf");
  
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  if (!isCloudflare) {
    // Only build server for non-Cloudflare builds
    console.log("building server...");
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const allDeps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
    const externals = allDeps.filter((dep) => !allowlist.includes(dep));

    await esbuild({
      entryPoints: ["server/index.ts"],
      platform: "node",
      bundle: true,
      format: "cjs",
      outfile: "dist/index.cjs",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      minify: true,
      external: externals,
      logLevel: "info",
    });
} else {
    const outputDir = "dist/public";
    
    console.log("preparing Cloudflare Pages functions...");
    
    try {
      // Copy functions to PROJECT ROOT (not dist/public/functions)
      await copyDir("functions", path.join(__dirname, "functions"));
      console.log(`functions copied to ${__dirname}/functions`);
    } catch (err) {
      console.log("No functions directory found, skipping...");
    }
    
    // Create _routes.json at PROJECT ROOT (not in dist/public)
    const routesJson = {
      version: 1,
      include: ["/api/*"],
      exclude: []
    };
    
    await writeFile(
      path.join(__dirname, "_routes.json"),
      JSON.stringify(routesJson, null, 2)
    );
    console.log("_routes.json created at " + __dirname);
  }
}
buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
```__
