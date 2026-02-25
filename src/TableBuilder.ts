import BinaryWriter from './BinaryWriter';
import ResizableLimits from './ResizableLimits';
import TableType from './TableType';
import { ElementTypeDescriptor } from './types';
import type InitExpressionEmitter from './InitExpressionEmitter';
import type ModuleBuilder from './ModuleBuilder';
import type FunctionBuilder from './FunctionBuilder';
import type ImportBuilder from './ImportBuilder';

export default class TableBuilder {
  _moduleBuilder: ModuleBuilder;
  _tableType: TableType;
  _index: number;

  constructor(
    moduleBuilder: ModuleBuilder,
    elementType: ElementTypeDescriptor,
    resizableLimits: ResizableLimits,
    index: number
  ) {
    this._moduleBuilder = moduleBuilder;
    this._tableType = new TableType(elementType, resizableLimits);
    this._index = index;
  }

  get elementType(): ElementTypeDescriptor {
    return this._tableType.elementType;
  }

  get resizableLimits(): ResizableLimits {
    return this._tableType.resizableLimits;
  }

  withExport(name: string): this {
    this._moduleBuilder.exportTable(this, name);
    return this;
  }

  defineElementSegment(
    elements: (FunctionBuilder | ImportBuilder)[],
    offset?: number | ((asm: InitExpressionEmitter) => void)
  ): void {
    this._moduleBuilder.defineElementSegment(this, elements, offset);
  }

  /** @deprecated Use defineElementSegment instead */
  defineTableSegment(
    elements: (FunctionBuilder | ImportBuilder)[],
    offset?: number | ((asm: InitExpressionEmitter) => void)
  ): void {
    this.defineElementSegment(elements, offset);
  }

  write(writer: BinaryWriter): void {
    this._tableType.write(writer);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
