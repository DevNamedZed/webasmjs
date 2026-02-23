import ImmediateEncoder from '../src/ImmediateEncoder';
import BinaryWriter from '../src/BinaryWriter';
import { BlockType, ValueType } from '../src/index';

test('ImmediateEncoder - block signature void', () => {
  const writer = new BinaryWriter();
  ImmediateEncoder.encodeBlockSignature(writer, BlockType.Void);
  const bytes = writer.toArray();
  // BlockType.Void has value 0x40, writeVarInt7 masks with 0x7f -> 0x40
  expect(bytes.length).toBe(1);
  expect(bytes[0]).toBe(0x40);
});

test('ImmediateEncoder - block signature i32', () => {
  const writer = new BinaryWriter();
  ImmediateEncoder.encodeBlockSignature(writer, BlockType.Int32);
  const bytes = writer.toArray();
  // BlockType.Int32 has value 0x7f, writeVarInt7 masks with 0x7f -> 0x7f
  expect(bytes.length).toBe(1);
  expect(bytes[0]).toBe(0x7f);
});

test('ImmediateEncoder - float32 encoding', () => {
  const writer = new BinaryWriter();
  ImmediateEncoder.encodeFloat32(writer, 1.0);
  const bytes = writer.toArray();
  // IEEE 754 float32 for 1.0 is 0x3f800000, little-endian: 00 00 80 3f
  expect(bytes.length).toBe(4);
  expect(bytes[0]).toBe(0x00);
  expect(bytes[1]).toBe(0x00);
  expect(bytes[2]).toBe(0x80);
  expect(bytes[3]).toBe(0x3f);
});

test('ImmediateEncoder - float64 encoding', () => {
  const writer = new BinaryWriter();
  ImmediateEncoder.encodeFloat64(writer, 1.0);
  const bytes = writer.toArray();
  // IEEE 754 float64 for 1.0 is 0x3FF0000000000000, little-endian: 00 00 00 00 00 00 F0 3F
  expect(bytes.length).toBe(8);
  expect(bytes[0]).toBe(0x00);
  expect(bytes[1]).toBe(0x00);
  expect(bytes[2]).toBe(0x00);
  expect(bytes[3]).toBe(0x00);
  expect(bytes[4]).toBe(0x00);
  expect(bytes[5]).toBe(0x00);
  expect(bytes[6]).toBe(0xf0);
  expect(bytes[7]).toBe(0x3f);
});

test('ImmediateEncoder - float32 special values', () => {
  // Zero
  const writerZero = new BinaryWriter();
  ImmediateEncoder.encodeFloat32(writerZero, 0);
  const zeroBytes = writerZero.toArray();
  expect(zeroBytes.length).toBe(4);
  // +0.0 is all zeroes
  expect(zeroBytes[0]).toBe(0x00);
  expect(zeroBytes[1]).toBe(0x00);
  expect(zeroBytes[2]).toBe(0x00);
  expect(zeroBytes[3]).toBe(0x00);

  // Positive Infinity
  const writerInf = new BinaryWriter();
  ImmediateEncoder.encodeFloat32(writerInf, Infinity);
  const infBytes = writerInf.toArray();
  expect(infBytes.length).toBe(4);
  // +Infinity float32: 0x7F800000, little-endian: 00 00 80 7F
  expect(infBytes[0]).toBe(0x00);
  expect(infBytes[1]).toBe(0x00);
  expect(infBytes[2]).toBe(0x80);
  expect(infBytes[3]).toBe(0x7f);

  // Negative Infinity
  const writerNegInf = new BinaryWriter();
  ImmediateEncoder.encodeFloat32(writerNegInf, -Infinity);
  const negInfBytes = writerNegInf.toArray();
  expect(negInfBytes.length).toBe(4);
  // -Infinity float32: 0xFF800000, little-endian: 00 00 80 FF
  expect(negInfBytes[0]).toBe(0x00);
  expect(negInfBytes[1]).toBe(0x00);
  expect(negInfBytes[2]).toBe(0x80);
  expect(negInfBytes[3]).toBe(0xff);

  // NaN
  const writerNaN = new BinaryWriter();
  ImmediateEncoder.encodeFloat32(writerNaN, NaN);
  const nanBytes = writerNaN.toArray();
  expect(nanBytes.length).toBe(4);
  // Canonical NaN float32: 0x7FC00000, little-endian: 00 00 C0 7F
  expect(nanBytes[0]).toBe(0x00);
  expect(nanBytes[1]).toBe(0x00);
  expect(nanBytes[2]).toBe(0xc0);
  expect(nanBytes[3]).toBe(0x7f);
});

test('ImmediateEncoder - memory immediate', () => {
  const writer = new BinaryWriter();
  ImmediateEncoder.encodeMemoryImmediate(writer, 2, 16);
  const bytes = writer.toArray();
  // alignment=2 as varUInt32: single byte 0x02
  // offset=16 as varUInt32: single byte 0x10
  expect(bytes.length).toBe(2);
  expect(bytes[0]).toBe(0x02);
  expect(bytes[1]).toBe(0x10);
});
