module.exports = {
  apps: [{
    name: 'blog-creator',
    script: './app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3030
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Deployment configuration
    deploy: {
      production: {
        user: 'YOUR_VPS_USER',
        host: 'YOUR_VPS_IP',
        ref: 'origin/main',
        repo: 'git@github.com:JoshuaMGoth/Blog-Creator.git',
        path: '/var/www/Blog-Creator',
        'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production && pm2 save'
      }
    }
  }]
};
