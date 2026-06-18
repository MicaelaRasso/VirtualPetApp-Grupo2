ENDPOINTS - APP MOBILE RIDER (VirtualPet)
=========================================

BASE URL (producción): https://virtualpet-backend-399557255968.us-central1.run.app
Todos los endpoints protegidos requieren header:
  Authorization: Bearer <access_token>

## AUTENTICACIÓN

POST /auth/login
  Body:
    { "email": "gian@virtualpet.com", "password": "Rider1!" }
  Response 200:
    { "access_token": "...", "refresh_token": "..." }

POST /auth/refresh
  Body:
    { "refresh_token": "..." }
  Response 200:
    { "access_token": "...", "refresh_token": "..." }

POST /auth/logout
  (requiere token)
  Response 204: sin body

## PEDIDOS DISPONIBLES

GET /orders/available?page=1&limit=20
  (requiere token — solo RIDER)
  Response 200:
    {
      "data": [
        {
          "id": "uuid",
          "status": "IN_PREPARATION" | "NOT_DELIVERED",
          "customerName": "...",
          "shippingAddress": { ... },
          "deliveryAttempts": 0,
          "total": "1500.00",
          "items": [ { "productNameSnapshot": "...", "quantity": 2, ... } ],
          ...
        }
      ],
      "pagination": {
        "total": 42,
        "page": 1,
        "limit": 20,
        "pages": 3
      }
    }

  Nota: devuelve órdenes en estado IN_PREPARATION y NOT_DELIVERED
        (las fallidas también aparecen para que otro rider las tome).

## DETALLE DE UN PEDIDO

GET /orders/:id
  (requiere token)
  Response 200:
    {
      "id": "uuid",
      "status": "...",
      "customerName": "...",
      "shippingAddress": { ... },
      "items": [ ... ],
      "shipment": {
        "id": "...",
        "riderId": "uuid-del-rider" | null,
        "riderName": "Gian Rider" | null,
        "takenAt": "2026-06-17T..." | null,
        "status": "SHIPPED" | "DELIVERED" | ...,
        "trackingNumber": "...",
        "methodName": "Envío estándar"
      },
      ...
    }

## TOMAR UN PEDIDO (PICKUP)

POST /orders/:id/pickup
  (requiere token — solo RIDER)
  Body: (vacío)
  Response 200: order actualizada con status "IN_TRANSIT"

  Efectos:

- Asigna el rider al shipment (riderId + takenAt)
- Cambia estado de la orden a IN_TRANSIT
- Si era primer intento: confirma reserva de stock

  Errores posibles:

- 400: orden no está en IN_PREPARATION ni NOT_DELIVERED
- 400: orden ya tiene rider asignado

## MARCAR COMO ENTREGADO (DELIVER)

POST /orders/:id/deliver
  (requiere token — solo RIDER)
  Body: (vacío)
  Response 200: order actualizada con status "DELIVERED"

  Errores posibles:

- 400: orden no está en IN_TRANSIT
- 403: el rider logueado no es el asignado a esta orden

## MARCAR COMO NO ENTREGADO (RETURN)

POST /orders/:id/return
  (requiere token — solo RIDER)
  Body: (vacío)
  Response 200: order actualizada

  Comportamiento según intentos:

- Si deliveryAttempts < 3 → status "NOT_DELIVERED"
  (la orden vuelve a aparecer en /orders/available)
- Si deliveryAttempts >= 3 → status "CANCELLED"
  (máximo de intentos alcanzado, se cancela automáticamente)

  Errores posibles:

- 400: orden no está en IN_TRANSIT
- 403: el rider logueado no es el asignado a esta orden

# CREDENCIALES DE PRUEBA

  gian@virtualpet.com   →  Rider1!
  mica@virtualpet.com   →  Rider2!
  santi@virtualpet.com  →  Rider3!

# FLUJO COMPLETO

1. POST /auth/login          → obtener token
2. GET  /orders/available    → ver pedidos disponibles
3. GET  /orders/:id          → ver detalle antes de tomar
4. POST /orders/:id/pickup   → tomar el pedido
5. POST /orders/:id/deliver  → entregado ✓
   o
   POST /orders/:id/return   → no entregado ✗
   (vuelve a disponible si quedan intentos)

======================================================
