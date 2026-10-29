import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the workspace root explicitly — without this, Next.js finds the
  // stray lockfile at C:\Users\<user>\package-lock.json and treats that as
  // the monorepo root, which nests server.js deep inside the standalone
  // output instead of at its top level and breaks `node server.js` on deploy.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
