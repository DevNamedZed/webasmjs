import BinaryWriter from '../src/BinaryWriter';

function assertWrite(action: (w: BinaryWriter) => void, expected: number[]) {
  const binaryWriter = new BinaryWriter(8);
  action(binaryWriter);
  const result = binaryWriter.toArray();
  expect(Array.from(result)).toEqual(expected);
}

test('writeUInt8', () => {
  assertWrite(x => x.writeUInt8(0xff), [0xff]);
  assertWrite(x => x.writeUInt8(0x00), [0x00]);
  assertWrite(x => x.writeUInt8(0x7f), [0x7f]);
});

test('writeUInt16', () => {
  assertWrite(x => x.writeUInt16(0x0100), [0x00, 0x01]);
  assertWrite(x => x.writeUInt16(0x1234), [0x34, 0x12]);
});

test('writeUInt32', () => {
  assertWrite(x => x.writeUInt32(0x6d736100), [0x00, 0x61, 0x73, 0x6d]);
  assertWrite(x => x.writeUInt32(1), [0x01, 0x00, 0x00, 0x00]);
});

test('writeVarInt7', () => {
  assertWrite(x => x.writeVarInt7(24), [24]);
  assertWrite(x => x.writeVarInt7(-1), [0x7f]);
});

test('writeVarInt32', () => {
  assertWrite(x => x.writeVarInt32(0), [0]);
  assertWrite(x => x.writeVarInt32(55), [55]);
  assertWrite(x => x.writeVarInt32(100), [228, 0]);
  assertWrite(x => x.writeVarInt32(128), [128, 1]);
  assertWrite(x => x.writeVarInt32(-1), [0x7f]);
  assertWrite(x => x.writeVarInt32(-128), [0x80, 0x7f]);
});

test('writeVarUInt1', () => {
  assertWrite(x => x.writeVarUInt1(0), [0]);
  assertWrite(x => x.writeVarUInt1(1), [1]);
});

test('writeVarUInt7', () => {
  assertWrite(x => x.writeVarUInt7(0), [0]);
  assertWrite(x => x.writeVarUInt7(127), [127]);
});

test('writeVarUInt32', () => {
  assertWrite(x => x.writeVarUInt32(0), [0]);
  assertWrite(x => x.writeVarUInt32(100), [100]);
  assertWrite(x => x.writeVarUInt32(128), [0x80, 0x01]);
  assertWrite(x => x.writeVarUInt32(624485), [0xe5, 0x8e, 0x26]);
});

test('writeFloat32', () => {
  const w = new BinaryWriter(8);
  w.writeFloat32(1.0);
  const arr = w.toArray();
  expect(arr.length).toBe(4);
  const view = new DataView(arr.buffer);
  expect(view.getFloat32(0, true)).toBeCloseTo(1.0);
});

test('writeFloat64', () => {
  const w = new BinaryWriter(16);
  w.writeFloat64(3.14);
  const arr = w.toArray();
  expect(arr.length).toBe(8);
  const view = new DataView(arr.buffer);
  expect(view.getFloat64(0, true)).toBeCloseTo(3.14);
});

test('writeString', () => {
  const w = new BinaryWriter(16);
  w.writeString('abc');
  const arr = w.toArray();
  expect(Array.from(arr)).toEqual([97, 98, 99]);
});

test('writeVarInt64 - small number uses writeVarInt32', () => {
  assertWrite(x => x.writeVarInt64(42), [42]);
  assertWrite(x => x.writeVarInt64(-1), [0x7f]);
});

test('writeVarInt64 - bigint', () => {
  const w = new BinaryWriter(16);
  w.writeVarInt64(0x100000000n);
  expect(w.length).toBeGreaterThan(0);
});

test('capacity grows automatically', () => {
  const w = new BinaryWriter(4);
  for (let i = 0; i < 100; i++) {
    w.writeUInt8(i);
  }
  expect(w.length).toBe(100);
  const arr = w.toArray();
  expect(arr[0]).toBe(0);
  expect(arr[99]).toBe(99);
});

test('writeBytes from BinaryWriter', () => {
  const w1 = new BinaryWriter(4);
  w1.writeUInt8(1);
  w1.writeUInt8(2);
  const w2 = new BinaryWriter(8);
  w2.writeUInt8(0);
  w2.writeBytes(w1);
  w2.writeUInt8(3);
  expect(Array.from(w2.toArray())).toEqual([0, 1, 2, 3]);
});

test('writeBytes from Uint8Array', () => {
  const w = new BinaryWriter(8);
  w.writeBytes(new Uint8Array([10, 20, 30]));
  expect(Array.from(w.toArray())).toEqual([10, 20, 30]);
});

describe('BinaryWriter encoding', () => {
  test('writeString with UTF-8 characters', () => {
    const writer = new BinaryWriter();
    writer.writeString('café');
    const bytes = writer.toArray();
    expect(bytes.length).toBeGreaterThan(4); // UTF-8 'é' is 2 bytes
  });

  test('writeVarInt64 with negative bigint', () => {
    const writer = new BinaryWriter();
    writer.writeVarInt64(-1n);
    const bytes = writer.toArray();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('writeVarInt64 with large positive bigint', () => {
    const writer = new BinaryWriter();
    writer.writeVarInt64(0x7FFFFFFFFFFFFFFFn);
    const bytes = writer.toArray();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('writeVarUInt32 with max safe value', () => {
    const writer = new BinaryWriter();
    writer.writeVarUInt32(0xFFFFFFFF);
    const bytes = writer.toArray();
    expect(bytes.length).toBe(5); // Max 5 bytes for 32-bit varuint
  });
});
