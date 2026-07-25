// kill-port.js – force‑kill any process listening on port 4000 (used for the API server)
// Works on Windows. Uses `netstat -ano` to find PID(s) and then `taskkill`.
const { exec } = require("child_process");
const PORT = 4000;
exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
  if (err) {
    // No process listening or netstat error – ignore
    console.log(`[kill-port] No active listeners on port ${PORT}.`);
    return;
  }
  const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
  const pids = new Set();
  for (const line of lines) {
    // Expected format:  TCP    0.0.0.0:4000       0.0.0.0:0       LISTENING       <PID>
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) pids.add(pid);
  }
  if (pids.size === 0) {
    console.log(`[kill-port] No PID found for port ${PORT}.`);
    return;
  }
  for (const pid of pids) {
    exec(`taskkill /F /PID ${pid}`, (kErr, kStdout, kStderr) => {
      if (kErr) {
        console.error(`[kill-port] Failed to kill PID ${pid}:`, kErr.message);
      } else {
        console.log(`[kill-port] Successfully killed PID ${pid}.`);
      }
    });
  }
});
