import { Model } from '@nozbe/watermelondb'

export default class SyncLog extends Model {
  static table = 'sync_logs'

  static associations = {}

  get lastSyncedAt(): number {
    return (this as any)._getRaw('last_synced_at')
  }
}
