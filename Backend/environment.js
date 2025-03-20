const fs = require("fs");

function initEnv() {
  let suffix = "";
  if (process.env.NODE_ENV === "development") {
    suffix = ".development.local";
  } else if (process.env.NODE_ENV === "production") {
    suffix = ".production.local";
  } else if (process.env.NODE_ENV === "test") {
    suffix = ".test.local";
  } else {
    suffix = ".development.local";
  }
  const res = fs.existsSync(`.env${suffix}`) ? fs.readFileSync(`.env${suffix}`, "utf8") : fs.readFileSync(".env", "utf8");
  let env = {};

  res.split("\n").forEach((line) => {
    if (line.startsWith("#")) return;
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
