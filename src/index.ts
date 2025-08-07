import path from "path";
import fs from "fs";
import { MethodNotFoundError, VersionNotSupportedError } from "./error";

type MethodMap = {
  [key: string]: (...args: any[]) => any;
};

type VersionedMethodMap = {
  [version: string]: MethodMap;
};

class ApiLoader {
  api_path: string;
  methods: VersionedMethodMap = {};

  constructor() {
    const api_path_arg = process.argv[1];
    if (!api_path_arg) {
      throw new Error("Script path (argv[1]) is undefined");
    }

    this.api_path = path.join(path.dirname(api_path_arg), 'api');

    if (!fs.existsSync(this.api_path)) {
      throw new Error(`API folder does not exist at path: ${this.api_path}`);
    }

    // Initialize version keys
    for (const version of fs.readdirSync(this.api_path)) {
      this.methods[version] = {};
    }

    // For each version, load methods recursively
    for (const version of Object.keys(this.methods)) {
      const version_path = path.join(this.api_path, version);
      this.load_methods_recursively(version_path, this.methods[version]!, []);
    }
  }

  private async load_methods_recursively(dir_path: string, method_map: MethodMap, path_parts: string[]) {
    for (const entry of fs.readdirSync(dir_path)) {
      const full_path = path.join(dir_path, entry);
      const stat = fs.statSync(full_path);

      if (stat.isDirectory()) {
        // Recurse into subdirectory with updated path_parts
        this.load_methods_recursively(full_path, method_map, [...path_parts, entry]);
      } else if (stat.isFile()) {
        const filename = path.parse(entry).name;

        // Combine path parts and filename with dashes
        const method_key = [...path_parts, filename].join('-');
        const mod = await import(full_path);
        const fn = mod.default || mod;
        method_map[method_key] = fn;
      }
    }
  }

  call(version: string, method: string, ...args: any[]): any {
    if (!this.methods[version]) {
      throw new VersionNotSupportedError(`Version ${version} is not supported`);
    }

    if (!this.methods[version][method]) {
      throw new MethodNotFoundError(`Method ${method} is not found in version ${version}`);
    }

    return this.methods[version][method](...args);
  }
}

export default ApiLoader;

async function main() {
  const loader = new ApiLoader();
  console.log(loader.methods);
}

// main();
