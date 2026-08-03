---
name: bluetooth-manager
description: Bluetooth management. Device pairing, connection management, data transfer.
---

# Bluetooth Manager

## When to Apply
Use this skill when implementing Bluetooth connectivity, device pairing, or BLE data transfer features.

## Core Concepts
- **Web Bluetooth API**: Browser-based BLE access
- **Device pairing**: Discovery, bonding, PIN/passkey handling
- **GATT profiles**: Service/characteristic-based data model
- **Connection management**: Auto-reconnect, connection pooling
- **Data transfer**: Read/write/notify on GATT characteristics

## Implementation
```typescript
// Scan and connect to BLE device
async function connectBluetooth(serviceUUID: string) {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [serviceUUID] }],
    optionalServices: [serviceUUID],
  })
  const server = await device.gatt.connect()
  return server
}

// Read characteristic value
async function readCharacteristic(
  server: BluetoothRemoteGATTServer,
  serviceUUID: string,
  charUUID: string
): Promise<DataView> {
  const service = await server.getPrimaryService(serviceUUID)
  const characteristic = await service.getCharacteristic(charUUID)
  return characteristic.readValue()
}

// Subscribe to notifications
async function subscribeToNotifications(
  server: BluetoothRemoteGATTServer,
  serviceUUID: string,
  charUUID: string,
  onData: (data: DataView) => void
) {
  const service = await server.getPrimaryService(serviceUUID)
  const characteristic = await service.getCharacteristic(charUUID)
  await characteristic.startNotifications()
  characteristic.addEventListener("characteristicvaluechanged", (event) => {
    onData((event.target as BluetoothRemoteGATTCharacteristic).value!)
  })
}

// Connection state management
function monitorConnection(device: BluetoothDevice, onDisconnect: () => void) {
  device.addEventListener("gattserverdisconnected", onDisconnect)
}
```

## Best Practices
- Handle disconnections gracefully with automatic reconnect
- Implement connection timeouts for unresponsive devices
- Use appropriate MTU size for large data transfers
- Validate received data against expected format
- Provide clear pairing instructions for users
- Cache known devices for faster reconnection
- Request minimal permissions — only required services/characteristics
