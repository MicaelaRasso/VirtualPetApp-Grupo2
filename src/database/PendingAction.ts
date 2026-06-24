import { Model } from '@nozbe/watermelondb'

export type PendingActionType = 'PICKUP' | 'DELIVER' | 'RETURN'

export default class PendingAction extends Model {
  static table = 'pending_actions'

  static associations = {}

  get orderId(): string {
    return (this as any)._getRaw('order_id')
  }

  get type(): PendingActionType {
    return (this as any)._getRaw('type')
  }

  get payload(): any {
    const raw = (this as any)._getRaw('payload')
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  }

  get createdAt(): number {
    return (this as any)._getRaw('created_at')
  }

  get retries(): number {
    return (this as any)._getRaw('retries')
  }
}
