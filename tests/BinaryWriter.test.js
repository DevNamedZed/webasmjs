import BinaryWriter from '../src/BinaryWriter'

function assertWrite(action, expected) {
  const binaryWriter = new BinaryWriter(8);
  action(binaryWriter)

  const result = binaryWriter.toArray();
  expect(Array.from(result)).toEqual(expected);
}

test('BinaryWriter - writeUInt32', () => {
  assertWrite(x => x.writeUInt32(0x6d736100), [ 0x00, 0x61, 0x73, 0x6d ])
});

test('BinaryWriter - writeVarInt7', () => {
  assertWrite(x => x.writeVarInt7(24), [ 24 ])
});

test('BinaryWriter - writeVarInt32', () => {
  assertWrite(x => x.writeVarInt32(55), [ 55 ])
  assertWrite(x => x.writeVarInt32(100), [ 228, 0 ])
  assertWrite(x => x.writeVarInt32(101), [ 229, 0 ])
  assertWrite(x => x.writeVarInt32(128), [ 128, 1 ])
  assertWrite(x => x.writeVarInt32(130), [ 130, 1 ])
});

test('BinaryWriter - writeVarUInt32', () => {
  assertWrite(x => x.writeVarUInt32(100), [ 100 ])
});
