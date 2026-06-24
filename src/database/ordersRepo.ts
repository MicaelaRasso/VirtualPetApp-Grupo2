import { Q } from '@nozbe/watermelondb'

import { database } from './index'
import OrderModel from './Order'
import PendingActionModel, { PendingActionType } from './PendingAction'
import type { Order, OrderStatus } from '@/types/orders'

const ordersCollection = () => database.get<OrderModel>('orders')
const pendingCollection = () => database.get<PendingActionModel>('pending_actions')

// Estados que se muestran en "Mis pedidos": en camino, entregados o devueltos.
// CANCELLED queda fuera: cuando backoffice cancela, el pedido deja de ser del rider.
const MINE_STATUSES: OrderStatus[] = ['IN_TRANSIT', 'DELIVERED', 'NOT_DELIVERED']

// ---------- Mapeo modelo (WatermelonDB) <-> dominio (Order) ----------

function recordToOrder(rec: OrderModel): Order {
  const shipmentId = rec.shipmentId
  return {
    id: rec.remoteId,
    status: rec.status as OrderStatus,
    customerName: rec.customerName,
    shippingAddress: rec.shippingAddress,
    deliveryAttempts: rec.deliveryAttempts,
    total: rec.total,
    items: rec.items,
    createdAt: rec.remoteCreatedAt,
    updatedAt: rec.remoteUpdatedAt,
    shipment: shipmentId
      ? {
          id: shipmentId,
          riderId: rec.riderId ?? null,
          riderName: null,
          takenAt: rec.takenAt ? new Date(rec.takenAt).toISOString() : null,
          status: '',
          trackingNumber: rec.trackingNumber ?? '',
          methodName: rec.methodName ?? '',
        }
      : undefined,
  }
}

function writeOrderRaw(rec: OrderModel, o: Order, isSynced: boolean): void {
  const set = (col: string, val: any) => (rec as any)._setRaw(col, val ?? null)
  set('remote_id', o.id)
  set('status', o.status)
  set('customer_name', o.customerName)
  set('shipping_address', JSON.stringify(o.shippingAddress ?? {}))
  set('delivery_attempts', o.deliveryAttempts ?? 0)
  set('total', o.total)
  set('items', JSON.stringify(o.items ?? []))
  set('shipment_id', o.shipment?.id ?? null)
  // En IN_PREPARATION la orden vuelve al pool y no tiene rider asignado.
  // Hay que limpiar el rider_id viejo: las respuestas de lista/return no traen
  // `shipment`, así que sin esto conservaríamos el rider del intento anterior
  // y la orden re-preparada nunca reaparecería en "disponibles".
  const nextRiderId =
    o.status === 'IN_PREPARATION'
      ? null
      : o.shipment?.riderId ?? (rec as any)._getRaw('rider_id') ?? null
  set('rider_id', nextRiderId)
  set('taken_at', o.shipment?.takenAt ? new Date(o.shipment.takenAt).getTime() : null)
  set('tracking_number', o.shipment?.trackingNumber ?? null)
  set('method_name', o.shipment?.methodName ?? null)
  set('remote_created_at', o.createdAt ?? null)
  set('remote_updated_at', o.updatedAt ?? null)
  set('is_synced', isSynced)
}

async function findByRemoteId(remoteId: string): Promise<OrderModel | null> {
  const found = await ordersCollection().query(Q.where('remote_id', remoteId)).fetch()
  return found[0] ?? null
}

// ---------- Upsert desde la API ----------

/**
 * Guarda/actualiza pedidos provenientes del backend.
 * No pisa registros con cambios locales sin sincronizar (is_synced = false).
 */
export async function upsertOrders(orders: Order[]): Promise<void> {
  if (orders.length === 0) return
  await database.write(async () => {
    for (const o of orders) {
      const existing = await findByRemoteId(o.id)
      if (existing) {
        if (!existing.isSynced) continue // hay un cambio local pendiente: no pisar
        await existing.update((rec) => writeOrderRaw(rec, o, true))
      } else {
        await ordersCollection().create((rec) => writeOrderRaw(rec, o, true))
      }
    }
  })
}

// ---------- Lecturas ----------

export async function getAvailableOrders(): Promise<Order[]> {
  const recs = await ordersCollection()
    .query(Q.where('status', Q.oneOf(['IN_PREPARATION', 'NOT_DELIVERED'])), Q.where('rider_id', null))
    .fetch()
  return recs.map(recordToOrder)
}

export async function getMyOrders(riderId: string): Promise<Order[]> {
  const recs = await ordersCollection()
    .query(Q.where('rider_id', riderId), Q.where('status', Q.oneOf(MINE_STATUSES)))
    .fetch()
  return recs.map(recordToOrder)
}

// ---------- Acción optimista + cola ----------

/**
 * Aplica el efecto de una acción localmente (optimista) y la encola para sincronizar.
 * Marca el pedido como is_synced = false.
 */
export async function applyLocalAction(
  orderId: string,
  type: PendingActionType,
  payload: Record<string, any> | null,
  riderId: string | null
): Promise<void> {
  await database.write(async () => {
    const rec = await findByRemoteId(orderId)
    if (rec) {
      await rec.update((r) => {
        const set = (col: string, val: any) => (r as any)._setRaw(col, val)
        if (type === 'PICKUP') {
          set('status', 'IN_TRANSIT')
          if (riderId) set('rider_id', riderId)
          set('taken_at', Date.now())
        } else if (type === 'DELIVER') {
          set('status', 'DELIVERED')
        } else if (type === 'RETURN') {
          const attempts = (rec.deliveryAttempts ?? 0) + 1
          set('delivery_attempts', attempts)
          set('status', attempts >= 3 ? 'CANCELLED' : 'NOT_DELIVERED')
        }
        set('remote_updated_at', new Date().toISOString())
        set('is_synced', false)
      })
    }
    await pendingCollection().create((p) => {
      const set = (col: string, val: any) => (p as any)._setRaw(col, val)
      set('order_id', orderId)
      set('type', type)
      set('payload', payload ? JSON.stringify(payload) : null)
      set('created_at', Date.now())
      set('retries', 0)
    })
  })
}

/** Marca un pedido como sincronizado y refresca sus datos con la respuesta del backend. */
export async function markSynced(orderId: string, fresh: Order): Promise<void> {
  await database.write(async () => {
    const rec = await findByRemoteId(orderId)
    if (rec) {
      await rec.update((r) => writeOrderRaw(r, fresh, true))
    }
    const pendings = await pendingCollection().query(Q.where('order_id', orderId)).fetch()
    for (const p of pendings) {
      await p.destroyPermanently()
    }
  })
}

export async function getPendingActions(): Promise<PendingActionModel[]> {
  return pendingCollection().query(Q.sortBy('created_at', Q.asc)).fetch()
}

export async function removePendingAction(id: string): Promise<void> {
  await database.write(async () => {
    const rec = await pendingCollection().find(id).catch(() => null)
    if (rec) await rec.destroyPermanently()
  })
}

export async function bumpRetries(id: string): Promise<void> {
  await database.write(async () => {
    const rec = await pendingCollection().find(id).catch(() => null)
    if (rec) {
      await rec.update((r) => (r as any)._setRaw('retries', (rec.retries ?? 0) + 1))
    }
  })
}

export async function countPending(): Promise<number> {
  return pendingCollection().query().fetchCount()
}
