const fs = require("fs");

function initEnv() {
  const res = fs.existsSync(".env.development.local") ? fs.readFileSync(".env.development.local", "utf8") : fs.readFileSync(".env", "utf8");

  let env = {};

  res.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    const val = line.replace(`${key}=`, "");
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      env[key] = val.slice(1, -1);
    } else {
      env[key] = parseInt(val);
      if (isNaN(env[key])) {
        env[key] = val;
      }
    }
  });

  process.env = { ...env, ...process.env };
}

module.exports = initEnv;
