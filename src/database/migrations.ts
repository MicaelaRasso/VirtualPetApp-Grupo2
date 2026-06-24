import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'orders',
          columns: [
            { name: 'remote_created_at', type: 'string', isOptional: true },
            { name: 'remote_updated_at', type: 'string', isOptional: true },
          ],
        }),
        createTable({
          name: 'pending_actions',
          columns: [
            { name: 'order_id', type: 'string', isIndexed: true },
            { name: 'type', type: 'string' },
            { name: 'payload', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'retries', type: 'number' },
          ],
        }),
      ],
    },
  ],
})
