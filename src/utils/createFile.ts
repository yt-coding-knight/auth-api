import fs from "fs/promises";
import path from "path";

export async function createFile(data: {}[]) {
  await fs.writeFile(
    path.join(__dirname, "..", "data", "users.json"),
    JSON.stringify(data)
  );
}
