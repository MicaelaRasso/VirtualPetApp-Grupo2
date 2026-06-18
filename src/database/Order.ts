import { Model } from '@nozbe/watermelondb'

export default class Order extends Model {
  static table = 'orders'

  static associations = {}

  get remoteId(): string {
    return (this as any)._getRaw('remote_id')
  }

  get status(): string {
    return (this as any)._getRaw('status')
  }

  get customerName(): string {
    return (this as any)._getRaw('customer_name')
  }

  get shippingAddress(): any {
    const raw = (this as any)._getRaw('shipping_address')
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return {} }
  }

  get deliveryAttempts(): number {
    return (this as any)._getRaw('delivery_attempts')
  }

  get total(): string {
    return (this as any)._getRaw('total')
  }

  get items(): any {
    const raw = (this as any)._getRaw('items')
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return [] }
  }

  get shipmentId(): string | undefined {
    return (this as any)._getRaw('shipment_id')
  }

  get riderId(): string | undefined {
    return (this as any)._getRaw('rider_id')
  }

  get takenAt(): number | undefined {
    return (this as any)._getRaw('taken_at')
  }

  get trackingNumber(): string | undefined {
    return (this as any)._getRaw('tracking_number')
  }

  get methodName(): string | undefined {
    return (this as any)._getRaw('method_name')
  }

  get isSynced(): boolean {
    return Boolean((this as any)._getRaw('is_synced'))
  }
}
