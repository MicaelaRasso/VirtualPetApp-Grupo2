# TODO.md - Próximos Pasos

## Flujo de Trabajo
- [ ] Iterar diseño de UI con **Impeccable** antes de construir componentes visuales.
  - **Regla**: No crear módulos de UI manuales hasta que el diseño esté definido y aprobado.

---

## 1. Autenticación (Auth)
- [ ] Implementar pantalla de login (`src/app/login/index.tsx`).
- [ ] Crear servicio de autenticación (`src/services/auth.ts`) con URLs mock.
- [ ] Implementar almacenamiento seguro de JWT en `expo-secure-store`.
- [ ] Crear Zustand store de autenticación (`src/stores/authStore.ts`).
- [ ] Proteger rutas: redirigir a login si no hay sesión activa.

## 2. Geolocalización (PoC Crítica)
- [ ] **PoC temprana** de `expo-location` con permisos de background.
- [ ] Validar tracking GPS continuo en segundo plano (Android e iOS).
- [ ] Definir estrategia de envío de ubicación al backend (batch vs realtime).

## 3. Offline-First (WatermelonDB)
- [ ] Configurar esquema de base de datos local (`src/database/schema.ts`).
- [ ] Definir modelos: `Order`, `Delivery`, `SyncQueue`.
- [ ] Implementar capa de sincronización (`src/features/sync/`).
- [ ] Manejar cola de cambios pendientes cuando no hay conexión.
- [ ] Resolver conflictos de sincronización bidireccional.

## 4. Gestión de Pedidos
- [ ] Crear pantalla de listado de pedidos asignados.
- [ ] Implementar acción "Tomar pedido del depósito" (registrar local + encolar sync).
- [ ] Implementar acción "Entregar pedido a cliente" (actualizar estado + captura de comprobante).
- [ ] Implementar acción "No entregado / Volver al depósito" (desvincular del repartidor).
- [ ] Crear Zustand store de pedidos (`src/stores/ordersStore.ts`).

## 5. Cámara (Comprobantes)
- [ ] Integrar `expo-camera` para capturar comprobantes de entrega.
- [ ] Guardar fotos localmente y asociarlas al pedido/delivery.
- [ ] Encolar envío de imágenes al backend cuando haya conexión.

## 6. Notificaciones Push
- [ ] Configurar `expo-notifications` para nuevas asignaciones de pedidos.
- [ ] Manejar notificaciones en foreground y background.

## 7. Backend & API
- [ ] Definir contratos de API con el backend.
- [ ] Implementar cliente HTTP base (`src/services/apiClient.ts`).
- [ ] Reemplazar URLs mock por endpoints reales.
- [ ] Definir estrategia de manejo de errores y reintentos.

## 8. Monitoreo y Calidad
- [ ] Integrar Sentry para trackeo de errores y crashes.
- [ ] Definir estrategia de testing (unitario, integración, E2E).
- [ ] Configurar EAS Build para generación de binarios (.apk/.aab/.ipa).

## 9. Dependencias Pendientes
- [ ] Confirmar versión objetivo de Expo SDK.
- [ ] Evaluar proveedor de mapas para futura navegación/ruteo.
- [ ] Revisar compatibilidad nativa de WatermelonDB con Expo SDK 56.
