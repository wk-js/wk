import { statSync } from "fs";

export function isFile(path:string) {
  try {
      const stat = statSync(path);
      if (!stat.isFile())
          throw 'Not a file';
  }
  catch (e) {
      return false;
  }
  return true;
}