import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import schema from './schema'
import Order from './Order'

const adapter = new SQLiteAdapter({
  schema,
  jsi: false, /* active JSI on android once tested */
  onSetUpError: error => {
    console.error('WatermelonDB setup error', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    Order,
  ],
})
