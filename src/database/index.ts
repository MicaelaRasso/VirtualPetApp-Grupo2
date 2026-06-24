import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import migrations from './migrations'
import Order from './Order'
import PendingAction from './PendingAction'
import SyncLog from './SyncLog'

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: false, /* active JSI on android once tested */
  onSetUpError: error => {
    console.error('WatermelonDB setup error', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    Order,
    PendingAction,
    SyncLog,
  ],
})
