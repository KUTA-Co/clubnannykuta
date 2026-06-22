module.exports = {
  apps: [
    {
      name: "club-nanny-frontend",
      script: "node_modules/.bin/serve",
      args: "dist -s -l 3001",
      cwd: "/var/www/club-nanny",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "club-nanny-api",
      script: "src/server.js",
      cwd: "/var/www/club-nanny/backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
