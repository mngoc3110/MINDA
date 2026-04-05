module.exports = {
  apps: [
    {
      name: "minda-backend",
      script: "venv/bin/uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000",
      cwd: "./student-center/backend",
      interpreter: "python3",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "minda-frontend",
      script: "npm",
      args: "run dev",
      cwd: "./student-center/frontend",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "minda-peerjs",
      script: "npx",
      args: "peerjs --port 9000",
      cwd: "./student-center/frontend",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "minda-rapt-clip",
      script: "venv_inference/bin/python",
      args: "inference_server.py",
      cwd: "./RAPT-CLIP",
      env: {
        PYTHONPATH: ".",
      },
    },
  ],
};
