import BinaryWriter from './BinaryWriter';
import ResizableLimits from './ResizableLimits';
import MemoryType from './MemoryType';
import type ModuleBuilder from './ModuleBuilder';

export default class MemoryBuilder {
  _moduleBuilder: ModuleBuilder;
  _memoryType: MemoryType;
  _index: number;

  constructor(moduleBuilder: ModuleBuilder, resizableLimits: ResizableLimits, index: number, shared: boolean = false, memory64: boolean = false) {
    this._moduleBuilder = moduleBuilder;
    this._memoryType = new MemoryType(resizableLimits, shared, memory64);
    this._index = index;
  }

  withExport(name: string): this {
    this._moduleBuilder.exportMemory(this, name);
    return this;
  }

  get isShared(): boolean {
    return this._memoryType.shared;
  }

  get isMemory64(): boolean {
    return this._memoryType.memory64;
  }

  write(writer: BinaryWriter): void {
    this._memoryType.write(writer);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
