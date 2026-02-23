import ModuleBuilder from './ModuleBuilder';
import { ModuleBuilderOptions } from './types';

export interface CompiledPackage {
  [moduleName: string]: WebAssembly.Module;
}

export interface InstantiatedPackage {
  [moduleName: string]: WebAssembly.Instance;
}

interface ModuleEntry {
  name: string;
  moduleBuilder: ModuleBuilder;
  dependencies: string[];
}

export default class PackageBuilder {
  _modules: ModuleEntry[] = [];

  defineModule(
    name: string,
    options?: ModuleBuilderOptions
  ): ModuleBuilder {
    if (this._modules.find((m) => m.name === name)) {
      throw new Error(`A module with the name "${name}" already exists.`);
    }

    const moduleBuilder = new ModuleBuilder(name, options);
    this._modules.push({ name, moduleBuilder, dependencies: [] });
    return moduleBuilder;
  }

  addDependency(moduleName: string, dependsOn: string): void {
    const entry = this._modules.find((m) => m.name === moduleName);
    if (!entry) {
      throw new Error(`Module "${moduleName}" not found.`);
    }
    if (!this._modules.find((m) => m.name === dependsOn)) {
      throw new Error(`Dependency module "${dependsOn}" not found.`);
    }
    if (!entry.dependencies.includes(dependsOn)) {
      entry.dependencies.push(dependsOn);
    }
  }

  getModule(name: string): ModuleBuilder | undefined {
    return this._modules.find((m) => m.name === name)?.moduleBuilder;
  }

  private topologicalSort(): ModuleEntry[] {
    const visited = new Set<string>();
    const sorted: ModuleEntry[] = [];
    const visiting = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving module "${name}".`);
      }

      visiting.add(name);
      const entry = this._modules.find((m) => m.name === name)!;

      for (const dep of entry.dependencies) {
        visit(dep);
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(entry);
    };

    for (const entry of this._modules) {
      visit(entry.name);
    }

    return sorted;
  }

  async compile(): Promise<CompiledPackage> {
    const sorted = this.topologicalSort();
    const result: CompiledPackage = {};

    for (const entry of sorted) {
      const bytes = entry.moduleBuilder.toBytes();
      result[entry.name] = await WebAssembly.compile(bytes.buffer as ArrayBuffer);
    }

    return result;
  }

  async instantiate(
    imports: { [moduleName: string]: WebAssembly.Imports } = {}
  ): Promise<InstantiatedPackage> {
    const sorted = this.topologicalSort();
    const result: InstantiatedPackage = {};

    for (const entry of sorted) {
      const bytes = entry.moduleBuilder.toBytes();
      const moduleImports: WebAssembly.Imports = {};

      // Merge user-provided imports
      if (imports[entry.name]) {
        Object.assign(moduleImports, imports[entry.name]);
      }

      // Wire up exports from dependency modules as imports
      for (const depName of entry.dependencies) {
        const depInstance = result[depName];
        if (depInstance) {
          moduleImports[depName] = depInstance.exports as WebAssembly.ModuleImports;
        }
      }

      const instantiated = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer, moduleImports);
      const instance = instantiated.instance;
      result[entry.name] = instance;
    }

    return result;
  }
}
