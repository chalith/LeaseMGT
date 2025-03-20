import * as fs from "fs";

const res = fs.readFileSync(".env", "utf8");

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

module.exports = env;
