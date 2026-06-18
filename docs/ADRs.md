# ADR-07

## 1. Título

Creación de nuevo módulo destinado al chatbot

## 2. Contexto

Con el propósito de mejorar la experiencia de usuario, VirtualPet propone incorporar un chatbot en el portal, que permita facilitar el soporte al usuario sin necesidad de contar con mesa de ayuda basada en personas. Los usuarios podrán hacer consultas generales sobre la empresa y algunas operaciones en relación a sus pedidos.

La arquitectura actual de la Capa de Negocio es un Monolito Modular en NestJS (ver ADR-02) con siete módulos de negocio aislados por esquema (ver ADR-03), por lo que se debe decidir dónde reside el componente orquestador del agente.

## 3. Alternativas Consideradas

Creación de nuevo módulo en el Monolito Modular

Se crea un módulo Chatbot en la capa de negocio que expone los endpoints del chat, contiene el loop del agente (mensaje → LLM → tool → LLM → respuesta), define las tools disponibles y las ejecuta invocando por inyección de dependencias a los servicios públicos de los módulos existentes (Order, Catalog, y a una nueva capacidad de facturación). El LLM se consume como servicio externo HTTP.

Creación de un nuevo servicio separado del Monolito Modular

Se desarrolla un servicio independiente, eventualmente con stack distinto (por ejemplo, Python + FastAPI + LangChain) para aprovechar la mayor madurez del ecosistema de IA. Las tools del agente invocan al monolito vía HTTP a endpoints internos. Se despliega como una segunda unidad en Cloud Run.

Creación de un módulo en la Capa de Presentación

El agente vive como una API route dentro del frontend de la Capa de Presentación, utilizando un SDK orientado a streaming (Vercel AI SDK). Las tools llaman al backend NestJS por HTTP usando el JWT del usuario.

## 4. Decisión

Se elige desarrollar un nuevo módulo Chatbot dentro del Monolito Modular de la capa de negocio, encargado de exponer la API del chat, orquestar el agente de IA, definir las tools y ejecutarlas mediante invocación a las interfaces públicas de los módulos existentes. El proveedor de LLM y el framework del agente se definen en ADRs separados.

## 5. Justificación

La decisión se alinea con los atributos de calidad priorizados en el QAW y con los ADRs previos del proyecto:

* Seguridad: ubicar el módulo dentro del backend mantiene el principio del ADR-01 según el cual las políticas de autenticación, autorización y validación se concentran en la capa de negocio. El JWT del usuario llega al guard del controller del chatbot, el userId autenticado se inyecta al contexto del agente y desde ahí a las tools, sin propagación entre servicios. Las validaciones críticas (pertenencia del pedido al usuario, estado del pedido, formato del CUIT, ventana temporal de facturación) ocurren en los servicios de dominio invocados, no en el prompt del LLM, lo que neutraliza el riesgo de prompt injection sobre operaciones sensibles. Una elección externa (Alt B) o en presentación (Alt C) ampliaría la superficie de exposición de secretos y obligaría a replicar políticas de autorización.
* Mantenibilidad: las tools del agente se implementan como adaptadores delgados sobre las interfaces públicas existentes de otros módulos como Catalog, Order etc. No se requiere definir nuevos contratos HTTP ni propagar cambios entre repositorios. Cuando el dominio evoluciona (nueva regla de negocio en Order), la tool consume la nueva versión por inyección, sin reescribir contratos. Esto sostiene el escenario QAW de "incorporación progresiva de funcionalidades" priorizado por el cliente.
* Confiabilidad: la transaccionalidad nativa de PostgreSQL queda disponible para las operaciones del agente que requieren consistencia (registrar la solicitud de facturación + auditoría en una sola transacción). Una arquitectura distribuida (Alt B) requeriría saga o aceptar consistencia eventual, comprometiendo la integridad transaccional que el cliente exige.
* Rendimiento: las tools se ejecutan como llamadas en memoria sin overhead de red, serialización ni reautenticación. El único cuello de botella es la llamada al LLM externo, que es inherente a la solución sin importar la ubicación del módulo. Las otras alternativas  suman latencia de red por cada tool invocada.

Adicionalmente, las ventajas de un nuevo servicio aparte (escalado independiente, aislamiento de fallas) resuelven problemas que el proyecto no tiene en su fase actual y que el enunciado no exige. Adoptarlas sería over-engineering. El camino evolutivo queda abierto: el aislamiento del módulo y el desacoplamiento del proveedor LLM (ver ADR siguiente) permiten extraer el chatbot como servicio independiente si en el futuro el volumen o la complejidad lo justifican, sin reescribir lógica de dominio.

## 6. Consecuencias

Ventajas

* Coherencia con la arquitectura existente: la decisión respeta el Monolito Modular (ADR-02) y el aislamiento por esquema (ADR-03), sin introducir patrones nuevos no justificados.
* Tools sobre interfaces existentes: las operaciones del agente reutilizan los servicios públicos de los módulos del dominio mediante inyección de dependencias, sin necesidad de definir nuevos contratos HTTP ni de propagar autenticación entre servicios.
* Punto único de autenticación y autorización: el JWT del usuario se valida en el guard del módulo Chatbot; el userId autenticado se propaga al contexto del agente y desde allí a las tools, que aplican las validaciones de dominio sobre la fuente de verdad del backend.
* Bajo costo operativo inicial: un solo deployment en Cloud Run, un solo pipeline de CI/CD, un solo set de secretos y una sola superficie de observabilidad.
* Camino evolutivo abierto: el aislamiento del módulo y el desacoplamiento del proveedor LLM permiten extraer el chatbot como servicio independiente en el futuro sin reescribir lógica de dominio

Riesgos y mitigaciones

| Riesgo                                                                                                                                                    | Mitigación                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prompt injection: el usuario manipula al agente para invocar tools con parámetros maliciosos (por ejemplo, solicitar_facturacion sobre un pedido ajeno). | Las tools revalidan toda autorización contra el userId autenticado del JWT y contra las reglas de dominio (pertenencia del pedido, estado, ventana temporal). El LLM nunca es fuente de verdad para autorización. |
| Agotamiento de la cuota del LLM externopor tráfico anómalo o abuso, especialmente con acceso de usuarios no autenticados                                | Rate limiting por IP y por usuario; alertas sobre umbrales de consumo.                                                                                                                                              |
| Dependencia de la disponibilidad y cuota del proveedor LLM:una caída o un cambio de términos del free tier impacta directamente sobre el chatbot.       | Cliente LLM encapsulado detrás de una interfaz interna (LlmClient) que permite cambiar de proveedor sin tocar la lógica del agente; proveedor de fallback configurable.                                           |

## 7. Referencias

* ADR-01: Arquitectura en capas
* ADR-02: Monolito Modular en la capa de negocio
* ADR-03: Aislamiento de datos a nivel de esquema entre módulos
* ADR-XX (siguiente): Selección del proveedor LLM
* ADR-XX (siguiente): Selección del framework del agente de IA
* Documento de definición de arquitectura

## 8. Implementación y seguimiento

Estrategia de Ejecución

* Crear el módulo Chatbot en src/modules/chatbot/ siguiendo la estructura controller + service + repository definida para módulos sin integraciones externas reemplazables (ADR-01).
* Definir las tools como clases con contratos tipados que reciben el userId autenticado en su contexto y delegan en los servicios públicos de los módulos del dominio. Una tool nunca accede a un repositorio de otro módulo directamente (ADR-03).
* Encapsular la integración con el LLM externo detrás de una interfaz interna (LlmClient) para permitir cambiar de proveedor sin tocar la lógica del agente.

Control y revisión

* Code review orientado a límites: validar en cada PR que las tools no accedan a repositorios fuera del módulo Chatbot y que la autorización ocurra siempre en el servicio de dominio invocado, no en el módulo del agente.
* Tests: cobertura mínima de tests unitarios sobre el loop del agente con un mock del LLM; tests de integración sobre cada tool simulando la respuesta del LLM y validando que las validaciones de dominio se ejecutan; tests de seguridad específicos contra prompt injection (intentar inyectar pedidoId ajeno al usuario, intentar saltar la ventana de facturación).
* Métricas operativas: tokens consumidos por sesión y por día, latencia p95 de la respuesta del chat, tasa de tool calls fallidas por validación de dominio (indicador de intentos de manipulación), tasa de respuestas con error del proveedor LLM.
* Revisión arquitectónica: si el módulo supera un volumen de tráfico significativamente distinto al resto del monolito, reevaluar la extracción a servicio independiente y emitir un nuevo ADR que reemplace a este.

# ADR-08

## 1. Título

Uso de LLM como servicio externo en el módulo del chatbot

## 2. Contexto

El módulo Chatbot definido en ADR-10 orquesta un agente de IA que requiere de un modelo de lenguaje (LLM) para procesar las consultas del usuario, decidir qué tools invocar y generar las respuestas en lenguaje natural. La forma en que se accede a ese modelo es una decisión arquitectónica con impacto significativo sobre el costo operativo, la privacidad de los datos del usuario, la calidad de las respuestas, la latencia, la operación del sistema y la coherencia con el resto de la plataforma.

## 3. Alternativas Consideradas

Modelo consumido como servicio externo (API)
El modelo de lenguaje es ejecutado por un proveedor externo (Google Gemini, Anthropic Claude, OpenAI, Groq, entre otros) y consumido desde el módulo Chatbot a través de llamadas HTTP a su API. VirtualPet no opera infraestructura para el modelo: solo gestiona credenciales y cuotas.

* Ventajas: costo inicial cero o muy bajo (la mayoría de los proveedores ofrecen free tiers utilizables, ver ADR-12); acceso inmediato a modelos frontier de alta calidad sin operación adicional; latencia adecuada para un caso de chat conversacional; escalado automático gestionado por el proveedor; sin necesidad de infraestructura especializada (GPU); time-to-market en horas.
* Desventajas: los datos del usuario salen del dominio de VirtualPet hacia un tercero; el sistema queda sujeto a la disponibilidad, cuotas y términos del proveedor, que pueden cambiar sin previo aviso; costo variable proporcional al uso (al escalar, el costo total puede superar al de self-hosting); dependencia de conectividad externa.

Self-hosting del modelo en infraestructura propia
 El modelo de lenguaje se ejecuta en infraestructura controlada por VirtualPet. Esta alternativa se desglosa en tres sub-opciones según el modo de hosting:

* Modelo open-source en GPU dedicada (Ollama, vLLM, TGI en Cloud Run con GPU, RunPod, Modal). Se despliega un modelo open-source (Llama 3.x, Mistral, Qwen) sobre una GPU gestionada en la nube.
  * Ventajas: datos del usuario nunca salen del dominio de VirtualPet (privacidad máxima); costo predecible (tarifa fija de GPU); independencia total del proveedor LLM.
  * Desventajas: costo fijo mensual elevado aun sin tráfico (una GPU L4 o T4 en GCP cuesta del orden de USD 200-500/mes solo por estar disponible); requiere operación especializada (deployment del modelo, monitoreo, actualizaciones, manejo de fallas); calidad de modelos open-source competitivos (Llama 3.3 70B) requiere GPUs de gama alta o múltiples GPUs, lo que multiplica el costo; rompe el patrón de "infraestructura simple" definido en ADR-01.
* Modelo pequeño cuantizado en CPU del backend. Modelos pequeños (Phi-3 mini, Llama 3.2 1B/3B, Qwen 2.5 1.5B) corriendo en la misma instancia de Cloud Run que el backend NestJS.
* Ventajas: sin infraestructura adicional; sin costo extra; privacidad máxima.
* Desventajas: la calidad de estos modelos es significativamente menor que la de cualquier modelo accesible vía API, con tasas de error elevadas en function calling (la operación central del agente); el consumo de RAM y CPU del modelo degrada el rendimiento del resto del backend; latencia de respuesta superior a la de las APIs externas dado que la CPU no es óptima para inferencia.

## 4. Decisión

Se adopta un LLM se consume como servicio externo provisto por un tercero a través de su API HTTP. Virtual Pet no opera infraestructura propia para la ejecución del modelo.

## 5. Justificación

La decisión se alinea con los atributos de calidad priorizados en el QAW y con las restricciones del proyecto:

* Costo: consumir el modelo como servicio externo permite operar el chatbot a costo cero o muy bajo durante la fase inicial gracias a los free tiers de los proveedores disponibles. Self-hosting en GPU implica un costo fijo mensual significativo aún sin tráfico real, lo que contradice el objetivo explícito del cliente y compromete la sostenibilidad económica de una startup en fase inicial con volumen de uso incierto.
* Rendimiento: los modelos accesibles vía API ofrecen latencias adecuadas para una experiencia conversacional fluida y se ejecutan en hardware optimizado. Self-hosting económico en CPU degrada notablemente la latencia y desplaza recursos del backend principal, afectando el resto de los escenarios QAW de rendimiento.
* Mantenibilidad: consumir el modelo como servicio externo elimina la responsabilidad operativa de mantener actualizado el modelo, monitorear su disponibilidad, gestionar fallas de hardware y escalar la capacidad de inferencia. Esto preserva el foco del equipo en la lógica de dominio del ecommerce y respeta el patrón de "infraestructura simple" definido en ADR-01.
* Confiabilidad: los proveedores de modelos como servicio ofrecen SLAs y redundancia gestionada por equipos especializados, con disponibilidad típicamente superior a la que VirtualPet podría sostener con un equipo pequeño operando una GPU propia. La dependencia de un tercero se mitiga mediante la estrategia de fallback entre proveedores definida en ADR-12.
* Calidad funcional del agente: los modelos disponibles vía API tienen capacidades de function calling significativamente superiores a las de los modelos open-source pequeños que podrían correrse en CPU. Dado que el agente depende del function calling para ejecutar las tools (solicitar_facturacion, consultar_estado_pedido), la calidad del modelo es un driver de funcionalidad, no solo de experiencia.
* Camino evolutivo abierto: el encapsulamiento del cliente LLM detrás de la interfaz LlmClient definido en ADR-10 permite migrar a self-hosting en el futuro sin reescribir la lógica del agente, en caso de que el volumen de uso, los costos variables o requisitos de privacidad lo justifiquen.

Se descartó la self-hosting por su costo fijo elevado en fase inicial y la complejidad operativa que introduce, ambos incompatibles con los principios arquitectónicos del proyecto. Se descartó modelo pequeño en CPU por la calidad insuficiente para function calling confiable.

## 6. Consecuencias

Ventajas

* Costo inicial cero o muy bajo, sostenido por los free tiers de los proveedores disponibles.
* Acceso inmediato a modelos frontier de alta calidad sin necesidad de operar infraestructura especializada.
* Coherencia con el principio arquitectónico de "infraestructura simple de bajo costo" definido en ADR-01.
* Time-to-market alineado con la fecha de entrega del proyecto.
* Operación simplificada: el equipo no debe gestionar deployment, monitoreo ni actualizaciones del modelo.
* Escalado automático gestionado por el proveedor, sin necesidad de planificación de capacidad por parte de VirtualPet.
* Camino evolutivo abierto a self-hosting o estrategias híbridas en el futuro, gracias al encapsulamiento detrás de LlmClient definido en ADR-10.

Riesgos y Mitigación

| Riesgo                                                                                                                                    | Mitigación                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema queda sujeto a la disponibilidad, cuotas y términosdel proveedor, que pueden cambiar sin previo aviso                         | Estrategia de fallback entre proveedores definida en ADR-12; encapsulamiento del cliente LLM detrás de la interfaz LlmClient para permitir cambio de proveedor sin tocar lógica del agente; monitoreo continuo de uso contra cuotas y alertas tempranas. |
| El costo variableproporcional al uso puede superar al de self-hosting si el volumen crece significativamente.                             | Monitoreo de tokens consumidos por día y por sesión; criterio explícito de revisión arquitectónica: si el costo variable mensual supera un umbral comparable al de una GPU dedicada de gama media, reevaluar la decisión y emitir un nuevo ADR.      |
| La dependencia de conectividad externaimplica que una caída de la conexión a Internet o del proveedor LLM deja al chatbot indisponible. | Mensaje de degradación elegante al usuario cuando el LLM no responde; el resto del sistema (catálogo, pedidos, checkout) sigue funcionando normalmente ya que el chatbot es un canal de soporte, no una funcionalidad crítica del ecommerce.            |

## 7. Referencias

* ADR-01: Uso de Arquitectura en Capas en la plataforma de VirtualPet
* ADR-02: Uso de Monolito Modular en la capa de negocio
* ADR-07: Creación de nuevo módulo destinado al agente de IA
* ADR-09: Selección del proveedor del modelo de lenguaje
* ADR-10: Selección del framework del módulo del agente de IA
* Documento de definición de arquitectura

## 8. Implementación y seguimiento

Estrategia de Ejecución

* Definir la interfaz LlmClient dentro del módulo Chatbot con métodos para generación de respuestas y ejecución de tool calls, agnóstica del proveedor concreto y del modo de hosting.
* Implementar adaptadores concretos para los proveedores seleccionados en ADR-12, todos satisfaciendo la misma interfaz.
* Gestionar las credenciales de los proveedores como secretos del entorno en Cloud Run, separados por proveedor.
* Implementar el aviso al usuario sobre el uso de IA al iniciar la sesión de chat.

Control y revisión

* Métricas operativas: costo mensual acumulado por proveedor; tokens consumidos por día; latencia p95 de respuestas del LLM; tasa de errores de los proveedores.
* Criterio de revisión arquitectónica: si el costo mensual del consumo de APIs supera el costo equivalente dispuesto a pagar, se emite un nuevo ADR que reevalúa esta decisión considerando self-hosting.
* Criterio de revisión por privacidad: si el negocio incorpora requisitos regulatorios que impidan el envío de datos a terceros, se emite un nuevo ADR que reevalúa esta decisión considerando self-hosting o paid tiers con políticas de no entrenamiento.
* Auditoría periódica: revisión semestral de los términos de uso de los proveedores integrados, con foco en cláusulas sobre el uso de los datos del usuario.

# ADR-09

## 1. Título

Elección de XXXX como proveedor de LLM

## 2. Contexto

El módulo Chatbot definido en ADR-10 orquesta un agente de IA que consume un modelo de lenguaje (LLM) externo a través de una API. La elección del proveedor del LLM impacta sobre el costo operativo, la calidad de las respuestas, la latencia del chat, la capacidad de invocar tools de forma confiable (function calling) y el tratamiento de los datos del usuario.

## 3. Alternativas Consideradas

## 4. Decisión

## 5. Justificación

## 6. Consecuencias

## 7. Referencias

# 8. Implementación y seguimiento

# ADR-10

## 1. Título

Stack Tecnológico para la aplicación móvil de repartidores

## 2. Contexto

Para dar soporte a la operación logística del ecommerce, se requiere construir una aplicación móvil dedicada al personal de delivery (repartidores). Esta aplicación debe permitirles recibir asignaciones de pedidos, actualizar estados de entrega en tiempo real, utilizar la cámara (para comprobantes de entrega) y acceder a la geolocalización (GPS) para el ruteo.

Se debe seleccionar un framework de desarrollo que permita construir una aplicación estable, rápida de iterar y que funcione correctamente tanto en dispositivos Android como iOS, respetando los atributos de calidad del sistema.

## 3. Alternativas Consideradas

Aplicación Web Progresiva (PWA) con Next.js

Se desarrolla una web responsiva instalable. Ofrece la mayor velocidad de desarrollo y reutilización de código web, pero presenta limitaciones críticas en iOS respecto a notificaciones push confiables y acceso nativo profundo a hardware (ej. GPS en background de forma ininterrumpida).

* Ventajas: Esta opción ofrece la máxima velocidad de desarrollo al capitalizar el dominio existente sobre el ecosistema de React y Next.js. Además, su distribución es simplificada porque no requiere pasar por los procesos de revisión y aprobación de las tiendas como App Store o Play Store, permitiendo despliegues de actualizaciones inmediatos. Finalmente, implica un menor costo de infraestructura ya que se compila y despliega como una aplicación web tradicional, sin requerir hardware específico como macOS para compilar iOS.
* Desventajas: Presenta limitaciones críticas de hardware, ya que las PWAs tienen restricciones severas para ejecutar procesos en segundo plano, lo cual imposibilita el rastreo GPS continuo necesario para el ruteo de los repartidores. Por otro lado, históricamente el soporte de notificaciones push en iOS para PWAs es inestable y depende fuertemente de la versión del sistema operativo. Por último, la experiencia de usuario puede sentirse menos fluida que una app nativa al estar atada al rendimiento del motor del navegador subyacente.

Alternativa B: Framework Multiplataforma - React Native (con Expo)

Se utiliza React Native compilando interfaces nativas a partir de código JavaScript/TypeScript. Permite compartir una única base de código para iOS y Android, ofreciendo acceso profundo a las APIs nativas mediante el ecosistema de Expo (cámara, geolocalización, notificaciones) y un rendimiento cercano al nativo.

* Ventajas: Permite mantener una base de código única para compilar tanto en iOS como en Android, lo que reduce drásticamente el esfuerzo de mantenimiento. Presenta una curva de aprendizaje plana al utilizar TypeScript y React, facilitando la transición hacia el desarrollo móvil sin necesidad de incorporar nuevos lenguajes. También destaca por las actualizaciones Over-The-Air que ofrece Expo, permitiendo enviar parches de lógica directamente a los dispositivos sin pasar por las tiendas, y garantiza un acceso profundo a hardware con módulos maduros para cámara, notificaciones push y GPS en segundo plano.
* Desventajas: Existe una fuerte dependencia del ecosistema de librerías de terceros para puentear funcionalidades nativas, y si alguna queda obsoleta puede bloquear actualizaciones del sistema operativo. Además, la comunicación entre el hilo de JavaScript y el hilo nativo puede generar un ligero cuello de botella o sobrecarga de rendimiento al momento de procesar animaciones excesivamente complejas.

Alternativa C: Framework Multiplataforma - Flutter

Se utiliza el framework de Google basado en Dart. Ofrece un excelente rendimiento al dibujar su propia UI y compilar a código máquina. Sin embargo, introduce un nuevo lenguaje (Dart) y un paradigma de diseño de UI diferente al ecosistema web.

* Ventajas: Ofrece un rendimiento superior al compilar directamente a código máquina y dibujar su propia interfaz, librándose de los cuellos de botella de los puentes de comunicación. Garantiza una absoluta consistencia visual, asegurando que la aplicación se verá exactamente igual en todas las versiones de Android e iOS sin depender de los controles propios de cada dispositivo. Además, cuenta con documentación y herramientas de desarrollo sobresalientes, destacando la velocidad de su Hot Reload.
* Desventajas: Introduce una curva de aprendizaje empinada al requerir el dominio de un lenguaje nuevo como Dart, lo que impacta negativamente en la mantenibilidad al generar silos de conocimiento y dificultar la rotación técnica entre los proyectos web y móvil. Por otra parte, el tamaño del binario suele ser considerablemente mayor desde su instalación base debido a que la aplicación debe empaquetar el motor de renderizado del framework.

Alternativa D: Desarrollo Nativo (Swift + Kotlin)

Se construyen dos aplicaciones separadas con sus lenguajes oficiales. Garantiza el máximo rendimiento y el mejor acceso al hardware, pero duplica el esfuerzo de desarrollo, mantenimiento y requiere equipos especializados para cada plataforma.

* Ventajas: Garantiza el máximo rendimiento y estabilidad sin capas intermedias, ofreciendo el mejor aprovechamiento de la batería y la memoria de los dispositivos. Proporciona además un acceso ilimitado e inmediato al sistema operativo y a cualquier API nativa nueva, lo que facilita un manejo avanzado de mapas y una optimización extrema de la ubicación en segundo plano.
* Desventajas: Implica un costo y esfuerzo operativo duplicado al requerir desarrollar, probar y mantener dos bases de código distintas, violando directamente el atributo de mantenibilidad para un sistema que exige incorporar funcionalidades de manera progresiva. Además, obliga a conformar equipos con perfiles altamente especializados tanto en iOS como en Android, encareciendo el ciclo de vida del proyecto.

## 4. Decisión

Se elige React Native (gestionado a través del ecosistema Expo) para el desarrollo de la aplicación móvil de los repartidores.

## 5. Justificación

Esta decisión se fundamenta en los atributos de calidad priorizados:

* Mantenibilidad: El uso de React Native capitaliza el conocimiento previo en el ecosistema de React y TypeScript. Esto permite mantener una altísima cohesión técnica, facilita la integración de nuevas features (como futuros proveedores logísticos) y evita la necesidad de mantener dos bases de código separadas (como exigiría la Alternativa D) o aprender un nuevo stack (como exigiría la Alternativa C con Dart).
* Confiabilidad: Para no "defraudar al cliente", la app del repartidor no puede fallar al actualizar un estado o perder la ubicación. React Native, a través de Expo, ofrece módulos muy maduros y estables para el manejo de hardware crítico (GPS, cámara) que una PWA (Alternativa A) no puede garantizar, especialmente bajo las restricciones de iOS.
* Usabilidad y Rendimiento: React Native traduce sus componentes a controles nativos reales del sistema operativo. Esto asegura que la experiencia del repartidor sea fluida, con tiempos de respuesta óptimos para una carga de trabajo operativa dinámica, cumpliendo con la premisa de una interfaz eficaz y atractiva.
* Seguridad: Permite el uso de almacenamiento seguro nativo (SecureStore en Expo) para manejar los tokens de sesión de los repartidores, aislando y protegiendo el acceso a los endpoints críticos del backend (separación de dominio de cliente y backoffice/operaciones).

## 6. Consecuencias

Ventajas

* Velocidad de iteración: El Hot Reload y la unificación del código en TypeScript aceleran el ciclo de desarrollo.
* Acceso a hardware nativo: Integración transparente con cámara, GPS y notificaciones push sin las limitantes de los navegadores móviles.
* Gestión simplificada: Expo abstrae la complejidad de la compilación nativa (no se requiere Mac obligatoriamente para desarrollo diario) y facilita los despliegues (Over The Air updates para correcciones críticas).

| Riesgo                                                                                                                                                       | Mitigación                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencia del ecosistema de librerías de terceros, las cuales pueden quedar desactualizadas o tener incompatibilidades en actualizaciones mayores del OS. | Limitar el uso de librerías externas a aquellas mantenidas oficialmente por Expo o la comunidad core de React Native. Establecer revisiones periódicas de dependencias. |
| Rendimiento inferior en cálculos matemáticos pesados respecto a código 100% nativo.                                                                       | La aplicación del repartidor es fundamentalmente transaccional y de consumo de APIs (I/O bound). Las operaciones pesadas de ruteo se delegarán al backend.              |

## 7. Referencias

* Documento de Requerimientos y Atributos de Calidad (QAW).
* ADR-01: Arquitectura en capas.
* Documentación oficial de React Native y Expo.

## 8. Implementación y seguimiento

Estrategia de Ejecución:

* Inicializar el repositorio de la aplicación móvil utilizando create-expo-app con la plantilla de TypeScript.
* Configurar un pipeline de CI/CD utilizando EAS (Expo Application Services) para la construcción de los binarios (.apk/.aab para Android y .ipa para iOS).

Control y revisión:

* Realizar pruebas de concepto (PoC) tempranas específicamente sobre el módulo de geolocalización en segundo plano, dado que es el componente de hardware más crítico para el negocio.
* Monitorizar la tasa de crashes mediante integraciones como Sentry for React Native una vez en producción.

# ADR-11

## 1. Título

Selección del motor de base de datos local (Offline-First) para la aplicación móvil de repartidores

## 2. Contexto

La aplicación móvil de los repartidores (React Native + Expo) operará en entornos de conectividad intermitente o nula durante las rutas de entrega. Para asegurar la continuidad operativa del negocio, la aplicación debe seguir el paradigma offline-first: las asignaciones de pedidos, las actualizaciones de estado y los comprobantes de entrega deben persistir localmente y sincronizarse con la capa de negocio (Monolito Modular en NestJS) de manera confiable una vez que se restablezca la conexión. Se debe seleccionar el motor de persistencia de datos local que soporte esta arquitectura y maneje la resolución de conflictos.

## 3. Alternativas Consideradas

Alternativa A: expo-sqlite

Es el acceso nativo al motor SQLite provisto directamente por el ecosistema de Expo, donde las consultas se escriben en lenguaje SQL tradicional.

Ventajas: Ofrece una integración excelente y nativa con el ecosistema de Expo sin requerir configuraciones especiales o salirse del flujo de trabajo administrado. Otorga un control arquitectónico total sobre las tablas, índices, transacciones y la estrategia de conflictos, utilizando una tecnología universal. Además, no agrega dependencias pesadas.

Desventajas: Exige un arduo trabajo manual de desarrollo, ya que el equipo debe construir desde cero los repositorios, la cola de operaciones pendientes y los mecanismos de sincronización. Carece de reactividad nativa y la complejidad de mantenimiento escala negativamente si el código SQL se dispersa.

Alternativa B: WatermelonDB

Una base de datos construida sobre el motor de SQLite, diseñada específicamente desde su concepción para aplicaciones React Native bajo el paradigma offline-first.

Ventajas: Resuelve estructuralmente el problema del offline-first al incluir mecanismos preparados nativamente para la sincronización y la resolución de conflictos. Presenta un rendimiento sobresaliente para manejar miles de registros sin degradar la experiencia gracias a la carga perezosa (lazy loading), e incluye reactividad automática para que la UI se actualice instantáneamente ante cualquier cambio local.

Desventajas: Posee una curva de aprendizaje inicial debido a la introducción de conceptos y decoradores propios del framework. Su integración con Expo requiere abandonar el flujo más simple y configurar Development Builds (compilaciones personalizadas).

Alternativa C: Realm

Una base de datos orientada a objetos que evita el uso de SQL clásico, reemplazándolo por el manejo directo de clases y objetos de dominio.

Ventajas: Proporciona una API sumamente agradable que elimina la necesidad de escribir adaptadores o consultas SQL crudas. Cuenta con reactividad incorporada y destaca por un rendimiento excepcional en operaciones con lecturas muy frecuentes.

Desventajas: El ecosistema ha sufrido cambios corporativos recientes que generaron cierta incertidumbre. Genera un fuerte acoplamiento a su formato propietario de almacenamiento perdiendo la portabilidad de SQLite, y también demanda configuraciones avanzadas de compilación.

## 4. Decisión

Se elige WatermelonDB como el motor de base de datos local y capa de sincronización principal para la aplicación móvil de los repartidores.

## 5. Justificación

La decisión se fundamenta en los siguientes atributos de calidad priorizados:

* Confiabilidad: El modelo de negocio exige que los repartidores no pierdan información crítica bajo ninguna circunstancia (para "no defraudar a los usuarios"). Al ser una base de datos puramente local-first, WatermelonDB gestiona nativamente la cola de cambios locales y posee una función estructural de synchronize() que garantiza la integridad de las transacciones al recuperar la conexión, mitigando el riesgo de estados de entrega perdidos o duplicados.
* Mantenibilidad: Evita el enorme costo operativo de tener que diseñar, programar y mantener un motor de sincronización de datos propio (como ocurriría con la Alternativa A). Además, el framework se acopla a la perfección con la fuerte adopción de TypeScript que ya se maneja en el desarrollo, permitiendo definir modelos (Models) y relaciones estrictamente tipadas que elevan la cohesión del código.
* Rendimiento y Usabilidad: La interfaz de la aplicación de delivery debe ser fluida independientemente de la cantidad de pedidos históricos almacenados en el teléfono. WatermelonDB delega todo el procesamiento pesado a un hilo secundario y solo carga en memoria los datos que la vista necesita en el momento, garantizando una alta velocidad de respuesta.

## 6. Consecuencias

Ventajas

* Sincronización robusta out-of-the-box: El paradigma de sincronización (push/pull) ya viene resuelto arquitectónicamente; el equipo solo debe enlazarlo con los endpoints del backend NestJS.
* Reactividad automática: Los componentes desarrollados en React Native se suscribirán a las colecciones de la base de datos y se repintarán automáticamente cuando el estado de un pedido cambie en background, mejorando la experiencia del repartidor.
* Escalabilidad local asegurada: La aplicación podrá manejar picos de trabajo intenso (miles de registros) sin bloqueos en el hilo principal de JavaScript.

Riesgos y mitigaciones

* Riesgo: Necesidad de salir del flujo de trabajo administrado de Expo (Expo Go) al requerir librerías nativas complejas.
  * Mitigación: Implementar de inmediato Expo Development Builds (EAS Build) en el pipeline de CI/CD para generar clientes de desarrollo personalizados, estandarizando el entorno para todo el equipo.
* Riesgo: Curva de aprendizaje para dominar los patrones de decoradores (@field, @relation) y la sintaxis de las consultas de WatermelonDB.
* Mitigación: Establecer plantillas base (boilerplates) para la creación de nuevos modelos y asegurar revisiones de código estrictas en los primeros sprints de implementación.

## 7. Referencias

* ADR-10: Selección del Stack Tecnológico (React Native).
* Documento de Arquitectura: Monolito Modular y atributos de calidad.
* Documentación oficial de WatermelonDB (Sincronización).

## 8. Implementación y seguimiento

* Estrategia de Ejecución:
  * Configurar el entorno inicial reemplazando Expo Go por Expo Development Builds, instalando el plugin correspondiente para vincular las dependencias nativas de iOS y Android.
  * Definir el esquema central de persistencia local (schema.js) priorizando las entidades núcleo de la logística: orders, deliveries, y sync_logs.
  * Implementar el adaptador de red en React Native que consumirá los servicios públicos del Monolito Modular durante la ejecución de la función synchronize().
* Control y revisión:
* Auditar el tamaño del binario final tras la incorporación de WatermelonDB para asegurar que se mantenga en límites aceptables.
* Crear escenarios de pruebas simulando Airplane Mode repetidamente durante la transición de estados de un envío para validar la resolución de conflictos entre el dispositivo y el backend.

# ADR-12

## 1. Título

Selección de librería para el manejo de Estado Global de la aplicación móvil

## 2. Contexto

La aplicación móvil de los repartidores utilizará una arquitectura offline-first (ver ADR-12). Esto implica que el sistema no solo debe persistir datos en la base local, sino que necesita coordinar en memoria y en tiempo real diversas dimensiones operativas: el estado de autenticación del usuario, la cola de sincronización de eventos pendientes, notificaciones de conflictos y la interacción temporal con la interfaz. Se requiere seleccionar una herramienta de manejo de estado global que permita orquestar esta complejidad sin penalizar el rendimiento del dispositivo ni ralentizar la velocidad de desarrollo.

## 3. Alternativas Consideradas

Alternativa A: Zustand

Es una librería de estado global minimalista donde el estado se define mediante almacenes (stores) simples e independientes.

Ventajas: Presenta muy poco boilerplate, eliminando la necesidad de escribir reducers, actions y providers complejos, lo que resulta en una curva de aprendizaje baja. Ofrece un rendimiento sobresaliente ya que los componentes solo se re-renderizan cuando cambia la porción específica del estado a la que están suscritos. Destaca por su flexibilidad para separar lógicamente dominios (un store para autenticación, otro para sincronización) y su compatibilidad impecable con el tipado estricto.

Desventajas: Al no imponer una arquitectura o patrón de diseño estricto desde la propia librería, el código puede desordenarse si varios desarrolladores intervienen en el proyecto sin convenciones previas acordadas. Posee un ecosistema de complementos de terceros menor frente a soluciones más antiguas.

Alternativa B: Redux Toolkit (RTK)

Es el estándar moderno y oficial para implementar Redux, diseñado para reducir el exceso de configuración histórica de esta arquitectura.

Ventajas: Provee una estructura sumamente definida y rígida (slices, store, selectors), lo que garantiza una excelente escalabilidad a largo plazo. Cuenta con herramientas de depuración (DevTools) de primer nivel para auditar los cambios de estado y middlewares muy poderosos para interceptar eventos globales.

Desventajas: A pesar de sus simplificaciones, sigue siendo una herramienta muy verbosa que exige escribir significativamente más código. La cantidad de conceptos arquitectónicos que introduce genera una mayor fricción inicial, sintiéndose como over-engineering para la gestión de estados acotados.

Alternativa C: React Context

Es la API nativa incorporada en React para inyectar y compartir datos a través del árbol de componentes sin necesidad de instalar paquetes externos.

Ventajas: No añade peso adicional al paquete de la aplicación. Su implementación es inmediata y resulta la solución perfecta para propagar variables de configuración globales o preferencias estáticas (como el tema visual o el idioma).

Desventajas: No fue concebida para gestionar estados dinámicos complejos ni mutaciones de alta frecuencia. Su uso para administrar la cola de sincronización logística generaría problemas graves de rendimiento por re-renderizados en cascada, además de carecer de herramientas de depuración o middlewares integrados.

## 4. Decisión

Se elige Zustand para la gestión del estado global en la aplicación móvil de los repartidores.

## 5. Justificación

Esta decisión se alinea de manera directa con los atributos de calidad críticos definidos para el proyecto:

* Rendimiento y Usabilidad: La gestión de la logística y la sincronización background provocan actualizaciones constantes en la memoria de la aplicación. Zustand asegura que solo el componente visual que depende de un dato específico (ej. un contador de "entregas pendientes") se vuelva a renderizar, garantizando que la interfaz del repartidor se mantenga fluida y rápida en todo momento.
* Mantenibilidad: El minimalismo de la herramienta reduce drásticamente las líneas de código (boilerplate). La integración nativa de Zustand con el entorno de trabajo actual facilita la creación de interfaces robustas y tipadas, manteniendo la cohesión sin abrumar la estructura de archivos. Se pueden crear stores pequeños y altamente cohesivos (ej. useSyncStore separado de useAuthStore).
* Confiabilidad: Permite coordinar eficientemente los eventos transitorios generados por el motor de WatermelonDB (ver ADR-12) y notificar al usuario sobre fallos de conectividad o resolución de conflictos de manera ágil y predecible.

## 6. Consecuencias

Ventajas

* Desarrollo más ágil debido a la eliminación de archivos de configuración intermedios.
* Separación de responsabilidades limpia y modular al instanciar múltiples stores independientes según la necesidad del dominio.
* Fácil integración de middlewares oficiales para persistencia de estados ligeros (ej. guardar el token de sesión de forma segura sin requerir toda la maquinaria de la base de datos local).

Riesgos y mitigaciones

* Riesgo: Inconsistencia arquitectónica. La extrema flexibilidad de la herramienta puede llevar a que la lógica de negocio se filtre accidentalmente dentro de la gestión de la vista si no hay reglas claras.
  * Mitigación: Definir en las guías del proyecto una estructura estricta donde cada store se abstraiga en su propio archivo dentro de un directorio dedicado (/src/store/). Restringir mediante code reviews la creación de estados globales innecesarios que podrían resolverse con estado local (useState).

## 7. Referencias

* ADR-10: Selección del Stack Tecnológico (React Native).
* ADR-12: Selección del Motor de Base de Datos Local (WatermelonDB).
* Documento de Arquitectura y Atributos de Calidad.
* Documentación oficial de Zustand.

## 8. Implementación y seguimiento

* Estrategia de Ejecución:
  * Instalar la dependencia zustand en el proyecto móvil.
  * Diseñar y tipar los dos stores fundamentales para la primera fase: useAuthStore (para manejar el JWT y los datos estáticos del repartidor) y useSyncStore (para exponer banderas booleanas de "isSyncing", "hasPendingChanges" y mensajes de error a la UI).
* Control y revisión:
* Validar en la etapa de testing manual que la actualización de la cola de sincronización (modificación en useSyncStore) no provoque el re-renderizado de componentes estructurales como la navegación o mapas.

**
