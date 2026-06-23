# TODO.md - Próximos Pasos

## Flujo de Trabajo
- [ ] Iterar diseño de UI con **Impeccable** antes de construir componentes visuales.
  - **Regla**: No crear módulos de UI manuales hasta que el diseño esté definido y aprobado.
  - **Nota**: Se crearon componentes iniciales (`Button`, `Input`, `OrderCard`, `OfflineBadge`, `AppTabBar`, `AuthInitializer`) y pantallas (`login`, `orders`, `my-route`) mientras se espera el diseño final aprobado por Impeccable.

---

## 1. Autenticación (Auth)
- [x] Implementar pantalla de login (`src/app/login/index.tsx`).
  - **Nota**: UI funcional con email, contraseña, feedback de error y banner offline.
- [x] Crear servicio de autenticación (`src/services/auth.ts`).
  - **Nota**: Conecta contra endpoint real (`/auth/login`, `/auth/refresh`, `/auth/logout`) en Cloud Run. No usa URLs mock.
- [x] Implementar almacenamiento seguro de JWT en `expo-secure-store`.
  - **Nota**: Guarda token, refresh token y datos del driver; soporta login offline si ya existe sesión guardada.
- [x] Crear Zustand store de autenticación (`src/stores/authStore.ts`).
  - **Nota**: Incluye `hydrate`, `login`, `logout`, `refresh`, flag `isOffline` y fallback a sesión local.
- [x] Proteger rutas: redirigir a login si no hay sesión activa.
  - **Nota**: Implementado en `src/app/(auth)/_layout.tsx` mediante `AuthInitializer` + guard de autenticación.

## 2. Geolocalización (PoC Crítica)
- [ ] **PoC temprana** de `expo-location` con permisos de background.
  - **Nota**: `expo-location` está instalado (`~56.0.18`) pero no hay uso ni configuración en el código.
- [ ] Validar tracking GPS continuo en segundo plano (Android e iOS).
- [ ] Definir estrategia de envío de ubicación al backend (batch vs realtime).

## 3. Offline-First (WatermelonDB)
- [x] Configurar esquema de base de datos local (`src/database/schema.ts`).
  - **Nota**: Tablas `orders` y `sync_logs` definidas. Versión 1.
- [~] Definir modelos: `Order`, `Delivery`, `SyncQueue`.
  - **Nota**: `Order` model creado (`src/database/Order.ts`). Faltan `Delivery` y `SyncQueue`.
- [ ] Implementar capa de sincronización (`src/features/sync/`).
  - **Nota**: Carpeta existe solo con `.gitkeep`. Los stores llaman directamente a la API sin persistir en WatermelonDB.
- [ ] Manejar cola de cambios pendientes cuando no hay conexión.
  - **Nota**: Actualmente las acciones fallan silenciosamente si no hay red; no hay cola ni reintentos.
- [ ] Resolver conflictos de sincronización bidireccional.

## 4. Gestión de Pedidos
- [x] Crear pantalla de listado de pedidos asignados/disponibles.
  - **Nota**: `src/app/(auth)/orders/index.tsx` lista pedidos disponibles; `src/app/(auth)/my-route.tsx` lista pedidos del repartidor.
- [~] Implementar acción "Tomar pedido del depósito" (registrar local + encolar sync).
  - **Nota**: Acción `pickup` implementada contra backend (`/orders/:id/pickup`), pero no persiste localmente ni encola sync.
- [~] Implementar acción "Entregar pedido a cliente" (actualizar estado + captura de comprobante).
  - **Nota**: Acción `deliver` implementada contra backend, pero sin captura de comprobante ni cámara.
- [x] Implementar acción "No entregado / Volver al depósito" (desvincular del repartidor).
  - **Nota**: Acción `returnToDepot` implementada contra backend (`/orders/:id/return`).
- [x] Crear Zustand store de pedidos (`src/stores/ordersStore.ts`).
  - **Nota**: Maneja `availableOrders`, `myOrders`, estados de carga y errores.

## 5. Cámara (Comprobantes)
- [ ] Integrar `expo-camera` para capturar comprobantes de entrega.
  - **Nota**: Dependencia instalada (`~56.0.8`) pero no se usa en ninguna pantalla.
- [ ] Guardar fotos localmente y asociarlas al pedido/delivery.
- [ ] Encolar envío de imágenes al backend cuando haya conexión.

## 6. Notificaciones Push
- [ ] Configurar `expo-notifications` para nuevas asignaciones de pedidos.
  - **Nota**: Dependencia instalada (`~56.0.18`) pero no configurada.
- [ ] Manejar notificaciones en foreground y background.

## 7. Backend & API
- [~] Definir contratos de API con el backend.
  - **Nota**: Documento `docs/ENDPONTS_MOBILE_RIDER.md` con endpoints y credenciales de prueba. Falta contrato formal/validación de respuestas.
- [x] Implementar cliente HTTP base (`src/services/apiClient.ts`).
  - **Nota**: Incluye base URL real, auth bearer, refresh automático en 401 y manejo básico de errores.
- [x] Reemplazar URLs mock por endpoints reales.
  - **Nota**: `API_BASE_URL` apunta a `https://virtualpet-backend-399557255968.us-central1.run.app`.
- [~] Definir estrategia de manejo de errores y reintentos.
  - **Nota**: Manejo básico en `apiClient` y mensajes de error en stores. No hay reintentos automáticos ni backoff.

## 8. Monitoreo y Calidad
- [ ] Integrar Sentry para trackeo de errores y crashes.
  - **Nota**: `@sentry/react-native` está instalado (`~8.14.0`) pero no se inicializa en el código.
- [ ] Definir estrategia de testing (unitario, integración, E2E).
- [ ] Configurar EAS Build para generación de binarios (.apk/.aab/.ipa).

## 9. Dependencias Pendientes
- [x] Confirmar versión objetivo de Expo SDK.
  - **Nota**: Expo SDK 56 (`expo ~56.0.12`).
- [ ] Evaluar proveedor de mapas para futura navegación/ruteo.
- [x] Revisar compatibilidad nativa de WatermelonDB con Expo SDK 56.
  - **Nota**: `@nozbe/watermelondb ^0.27.1` instalado y configurado con `SQLiteAdapter` (JSI desactivado por ahora).
