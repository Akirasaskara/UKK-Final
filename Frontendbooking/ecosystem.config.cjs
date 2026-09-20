module.exports = {
  apps: [
    {
      name: 'bookingin-frontend',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/home/ubuntu/UKK-Final/Frontendbooking',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
