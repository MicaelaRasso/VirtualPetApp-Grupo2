# AGENTS.md - App Móvil para Repartidores

## 1. Contexto y Objetivo

Esta es una aplicación móvil **exclusiva para repartidores** de la operación logística del ecommerce. Su objetivo es permitirles:

1. **Tomar pedidos del depósito** para entregar a los clientes, registrando la acción (comunicación con backend).
2. **Entregar pedidos a clientes**, actualizando el estado de cada uno.
3. **Al finalizar el recorrido**, marcar qué pedidos **no pudieron ser entregados** y deben volver al depósito.
4. **Desvincular** esos pedidos no entregados del repartidor, comunicando el cambio al backend.

La aplicación debe funcionar en modo **offline-first**: operar sin conexión y sincronizar cambios cuando se recupere la red.

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native + Expo (TypeScript) |
| Navegación | Expo Router |
| Estado Global | Zustand |
| Persistencia Offline | WatermelonDB |
| Almacenamiento Seguro | `expo-secure-store` |
| Geolocalización | `expo-location` (incluyendo background) |
| Cámara | `expo-camera` (comprobantes de entrega) |
| Notificaciones | `expo-notifications` |
| Autenticación | JWT (gestionado por backend) |
| CI/CD | EAS (Expo Application Services) |
| Monitoreo | Sentry for React Native |
| Diseño UI | Iterado y mejorado con **Impeccable** (IA para diseño de interfaces) |

## 3. Arquitectura de Carpetas

```
src/
├── app/                    # Expo Router: rutas y pantallas
│   ├── (auth)/             # Grupo de rutas autenticadas (tabs, stack interno)
│   └── login/              # Pantalla de inicio de sesión
├── components/             # Componentes reutilizables de UI
├── features/               # Módulos por dominio de negocio
│   ├── orders/             # Gestión de pedidos
│   ├── deliveries/         # Flujo de entregas
│   └── sync/               # Lógica de sincronización offline-first
├── services/               # Clientes HTTP, comunicación con API (URLs mock por ahora)
├── stores/                 # Zustand stores (auth, orders, sync status)
├── database/               # Configuración y modelos de WatermelonDB
├── hooks/                  # Custom hooks compartidos
├── constants/              # Configuración global y valores fijos
└── types/                  # Tipados compartidos de TypeScript
```

## 4. Módulos Críticos y Consideraciones

### Offline-First (WatermelonDB)
- Todos los pedidos asignados al repartidor se persisten localmente.
- Las acciones (tomar pedido, entregar, devolver al depósito) se registran localmente y encolan para sincronización.
- WatermelonDB gestiona la sincronización bidireccional y resolución de conflictos con el backend.

### Estado Global (Zustand)
- **Auth store**: sesión del repartidor, token JWT, estado de autenticación.
- **Orders store**: pedidos activos, estado del recorrido actual.
- **Sync store**: estado de la cola de sincronización, conectividad, errores pendientes.

### Hardware Nativo
- **GPS en segundo plano**: habilitado mediante `expo-location`. Es el componente de hardware más crítico; requiere PoC temprana.
- **Cámara**: captura de comprobantes de entrega mediante `expo-camera`.
- **Notificaciones push**: asignación de nuevos pedidos o alertas operativas.

### Seguridad
- Tokens JWT almacenados en `expo-secure-store`, aislados del almacenamiento estándar.
- Separación de dominios: esta app es exclusiva de repartidores (operaciones), sin mezclarse con el dominio de clientes finales.

## 5. Flujo de Trabajo (Trunk-Based Development)

- **Rama principal**: `main`.
- **Feature branches**: ramas cortas con Pull Requests obligatorios para mergear a `main`.
- **CI/CD**: EAS Build para generar binarios (.apk/.aab para Android, .ipa para iOS).
- **Despliegues OTA**: EAS Update para enviar correcciones críticas de lógica sin pasar por tiendas.

## 6. Idioma de Desarrollo

Todo el código fuente, nombres de variables, funciones, clases, comentarios, mensajes de commit y documentación técnica del proyecto deben estar en **inglés**. Esto incluye:
- Nombres de archivos y carpetas en `src/`.
- Identificadores en el código (variables, funciones, interfaces, tipos, enums).
- Mensajes de commit de Git.
- Comentarios y documentación inline.
- Nombres de branches (ej. `feature/order-sync`, `fix/gps-background`).

La única excepción son los documentos de arquitectura dirigidos al equipo (como este `AGENTS.md`), que pueden redactarse en español.

## 7. Estrategia de UI / Diseño

- El diseño de interfaces será iterado y refinado utilizando **Impeccable** (herramienta de IA para diseño de UI).
- **No se deben crear módulos de UI manuales** hasta que el diseño esté definido y aprobado mediante este flujo.
- La implementación visual debe respetar los lineamientos que surjan de Impeccable, priorizando claridad operativa para el repartidor en campo.

## 8. Testing y Calidad

- **Pruebas de concepto (PoC)**: priorizar una PoC temprana del módulo de geolocalización en segundo plano.
- **Monitoreo en producción**: integrar Sentry para trackear tasa de crashes y errores en dispositivos reales.

## 9. Decisiones y Dependencias Pendientes

- [ ] Contratos de API con backend (actualmente se usan URLs mock).
- [ ] Configuración nativa avanzada de WatermelonDB (plugins de Expo).
- [ ] Versión objetivo de Expo SDK (mantener actualizada).
- [ ] Proveedor de mapas para navegación/ruteo (si aplica en futuras iteraciones).

## 10. Referencias

- ADR-11: Stack Tecnológico para la Aplicación Móvil de Repartidores.
- Documentación oficial de [Expo](https://docs.expo.dev/), [Expo Router](https://docs.expo.dev/router/introduction/), [WatermelonDB](https://watermelondb.dev/docs), [Zustand](https://docs.pmnd.rs/zustand).

## 11. Contexto de Diseño (Design Context)

Resumen de las decisiones tomadas con Impeccable. Ver archivos completos en `PRODUCT.md` y `DESIGN.md`.

- **Registro:** product — la interfaz sirve a la tarea del repartidor, no es marketing.
- **Personalidad de marca:** calm, reliable, human (calma, confiable, humana).
- **Principios clave:** una tarea por pantalla; legible de un vistazo bajo sol; offline-first en la interfaz; targets grandes y alcance con una mano; lenguaje operacional, no abstracto.
- **Paleta (seed):** estrategia *restrained*, primario azul marino frío, acento ámbar cálido para estados funcionales, superficie blanca o gris frío, tinta oscura fría.
- **Tipografía:** una sola familia sans humanista cálida para todo.
- **Elevación:** plana por defecto; profundidad por tono, no sombras decorativas.
- **Movimiento:** restringido por defecto; solo cambios de estado y feedback, respetando `prefers-reduced-motion`.
- **Accesibilidad:** WCAG 2.2 AA mínimo, AAA para texto operacional al aire libre; alto contraste para luz solar; tipografía y movimiento reducidos del sistema.
