import BinaryWriter from './BinaryWriter';
import ResizableLimits from './ResizableLimits';
import { ElementTypeDescriptor } from './types';

export default class TableType {
  private _elementType: ElementTypeDescriptor;
  private _resizableLimits: ResizableLimits;

  constructor(elementType: ElementTypeDescriptor, resizableLimits: ResizableLimits) {
    this._elementType = elementType;
    this._resizableLimits = resizableLimits;
  }

  get elementType(): ElementTypeDescriptor {
    return this._elementType;
  }

  get resizableLimits(): ResizableLimits {
    return this._resizableLimits;
  }

  write(writer: BinaryWriter): void {
    writer.writeVarUInt32(this._elementType.value);
    this._resizableLimits.write(writer);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
