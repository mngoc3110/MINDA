module.exports = {
  apps: [
    {
      name: "minda-backend",
      script: "venv/bin/gunicorn",
      args: "-w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000",
      cwd: "./student-center/backend",
      env: {
        NODE_ENV: "production",
        // Sếp điền các biến này vào file .env trong backend nhé
      },
    },
    {
      name: "minda-frontend",
      script: "npm",
      args: "start",
      cwd: "./student-center/frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
