import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the workspace root explicitly — without this, Next.js finds the
  // stray lockfile at C:\Users\<user>\package-lock.json and treats that as
  // the monorepo root, which nests server.js deep inside the standalone
  // output instead of at its top level and breaks `node server.js` on deploy.
  outputFileTracingRoot: path.join(__dirname),

  // Baseline HTTP security hardening headers (VAPT-14). The app has no
  // security headers configured at all otherwise, leaving it open to
  // clickjacking and MIME-sniffing. The CSP's allowances are deliberately
  // scoped to what this app actually embeds/loads: ui-avatars.com for
  // profile avatars, docs.google.com for the Office document viewer iframe,
  // and the Azure Blob Storage domain for document previews.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://ui-avatars.com https://*.blob.core.windows.net",
              "frame-src https://docs.google.com https://*.blob.core.windows.net",
              "connect-src 'self' https://*.blob.core.windows.net",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
