import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'remote_id', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' },
        { name: 'customer_name', type: 'string' },
        { name: 'shipping_address', type: 'string' }, // Stringified JSON
        { name: 'delivery_attempts', type: 'number' },
        { name: 'total', type: 'string' },
        { name: 'items', type: 'string' }, // Stringified JSON
        { name: 'shipment_id', type: 'string', isOptional: true },
        { name: 'rider_id', type: 'string', isOptional: true },
        { name: 'taken_at', type: 'number', isOptional: true }, // Timestamp
        { name: 'tracking_number', type: 'string', isOptional: true },
        { name: 'method_name', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
      ]
    }),
    tableSchema({
      name: 'sync_logs',
      columns: [
        { name: 'last_synced_at', type: 'number' },
      ]
    }),
  ]
})
