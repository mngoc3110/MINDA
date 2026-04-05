module.exports = {
  apps: [
    {
      name: "minda-backend",
      script: "venv/bin/uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000",
      cwd: "./backend",
      env: {
        NODE_ENV: "production",
        // Sếp điền các biến này vào file .env trong backend nhé
      },
    },
    {
      name: "minda-frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
