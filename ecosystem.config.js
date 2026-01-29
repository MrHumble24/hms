module.exports = {
  apps: [
    {
      name: "hms-api",
      cwd: "./api",
      script: "dist/src/main.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        CORS_ORIGIN: "https://hms.centrify.uz,https://www.hms.centrify.uz",
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      exp_backoff_restart_delay: 100,
    },
    {
      name: "hms-client",
      cwd: "./client",
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: 3003,
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
