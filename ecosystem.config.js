module.exports = {
  apps: [
    {
      name: "hms-api",
      cwd: "./api",
      script: "dist/main.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster", // Enable cluster mode for load balancing
      env: {
        NODE_ENV: "production",
        PORT: 3002, // Changed from 3000 to avoid conflict
      },
      // Safe restart settings
      autorestart: true,
      watch: false,
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      exp_backoff_restart_delay: 100, // Delay between restarts if crashing loop
    },
    {
      name: "hms-client",
      cwd: "./client",
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: 3003, // Changed from 3001 to avoid nearness to 3000
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html",
      },
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
