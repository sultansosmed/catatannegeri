module.exports = {
  apps: [
    {
      name: "catatannegeri-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "catatannegeri-scheduler",
      script: "scripts/run-ingestion.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      restart_delay: 60000, // restart after 60s if finished or every interval
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

