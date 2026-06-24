import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 2,
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
        { name: 'remote_created_at', type: 'string', isOptional: true },
        { name: 'remote_updated_at', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
      ]
    }),
    tableSchema({
      name: 'pending_actions',
      columns: [
        { name: 'order_id', type: 'string', isIndexed: true }, // remote id del pedido
        { name: 'type', type: 'string' },                       // PICKUP | DELIVER | RETURN
        { name: 'payload', type: 'string', isOptional: true },  // Stringified JSON (ej: { code })
        { name: 'created_at', type: 'number' },
        { name: 'retries', type: 'number' },
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
