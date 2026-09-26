# Plan v2 — Refugio del Mar

Objetivo: convertir el proyecto final de la diplomatura en una pieza de portafolio que muestre **diseño con criterio, producto completo, datos y automatización con IA**. La v1 se mantiene desplegada hasta que la v2 esté lista.

## 1. Dirección de diseño: "Pinamar"

**Sensación buscada:** calidez, cuidado, tranquilidad. Un refugio que se siente como una casa cerca del mar, no como un panel de administración.

**Principios**
- Mucho aire (espacios generosos), pocas cosas por pantalla, jerarquía clara.
- Fotografía real y grande de los animales como protagonista. Las personas adoptan con los ojos.
- Formas orgánicas: bordes muy redondeados, imágenes con forma de arco, divisores en forma de ola/duna (SVG). Nada de esquinas duras.
- Movimiento suave y sutil (fade/slide de 200–400 ms, hover que "eleva" levemente). Respetar `prefers-reduced-motion`.
- Lenguaje cálido y cercano en los textos, en voseo.

**Paleta** (se conservan tus colores; solo se renombran con nombres semánticos y se agregan dos acentos)

| Token | Valor | Uso |
|---|---|---|
| `mar` | `#285360` | Texto principal, botones primarios, footer |
| `mar-oscuro` / `mar-claro` | `#1e3f4e` / `#3d7080` | Hover / variantes |
| `arena` | `#F2EBE3` | Fondo de página |
| `espuma` | `#F8F5F2` | Superficies (tarjetas, formularios) |
| `bruma` | `#B4D8D8` | Fondos suaves, bordes, chips |
| `niebla` | `#5A8595` | Texto secundario **grande** e íconos |
| `niebla-oscuro` | `#3d6a7a` | Texto secundario chico (cumple contraste AA) |
| `duna` | `#AB9172` | Detalles, líneas, ilustraciones |
| `atardecer` (nuevo) | `#B05A38` | Acento cálido para el CTA principal ("Quiero conocerlo/a") y corazón de favoritos. Usar poco. |
| `pino` (nuevo) | ≈`#4F6B57` | Estado "Disponible" / éxito |

Nota de contraste: `niebla` (#5A8595) sobre `arena` da ~3.3:1, no alcanza para texto chico. Por eso existe `niebla-oscuro`. Validar todos los pares con un chequeo AA (4.5:1 texto normal, 3:1 texto grande) antes de cerrar la Fase 1; ajustar `atardecer` y `pino` si hace falta.

**Tipografía:** títulos con **Fraunces** (serif suave, cálida, con carácter) + cuerpo con **Nunito** (ya en uso). Escala tipográfica definida en tokens.

**Íconos:** reemplazar los emojis por `lucide-react` (consistente y accesible). Los emojis pueden quedar solo en contenido editorial puntual.

**Componentes base a rediseñar:** Button (primario/secundario/fantasma, estados de carga), Card, Badge, Input/Select/Textarea, EmptyState, Skeleton (nuevo), Toast (nuevo), Modal, Layout.

**Layout:** header claro y translúcido sobre arena (no la barra oscura), logo simple en SVG (huella + ola), menú móvil tipo drawer; footer en `mar` con divisor de ola, datos de contacto y redes.

**Home nueva (storytelling):**
1. Hero con foto grande, titular emocional y 2 CTAs ("Conocé a los candidatos" / "Cómo adoptar").
2. Contador vivo de impacto (adoptados / disponibles), con datos reales de la API.
3. Candidatos destacados (3–4 tarjetas).
4. "Cómo funciona adoptar" en 4 pasos.
5. Historias de adopción (testimonios con foto).
6. Cómo ayudar (voluntariado / donaciones) + CTA final.

Otras páginas: catálogo, detalle, Historias, Cómo adoptar + FAQ, Contacto/Voluntariado, 404 con personalidad.

## 2. Funcionalidades

**Producto (público)**
- **Catálogo público sin login.** Se inicia sesión solo para solicitar una visita. Cambia por completo la experiencia de un adoptante.
- Filtros mejorados: especie, sexo, tamaño, rango de edad, orden. Estado de filtros en la URL. Paginación en servidor. Skeletons de carga.
- **Detalle rico:** galería de fotos, rasgos (tamaño, castrado, vacunado, se lleva bien con niños/otros animales), historia, botón compartir, CTA "Solicitar visita".
- **Historias de adopción:** página pública con animales adoptados y su testimonio (final feliz).
- **Cómo adoptar + FAQ**, y formulario de voluntariado/contacto.

**Producto (usuario)**
- "Mis solicitudes" con línea de tiempo de estados (En revisión → Aceptada → Visita realizada).
- Favoritos (guardados localmente o en la cuenta; decidir en Fase 2 según esfuerzo).

**Admin**
- **Panel con datos:** adopciones por mes, distribución por especie, embudo solicitudes → visitas → adopciones, tiempo promedio hasta adoptar. (Recharts.) Este panel refleja tu perfil de análisis de datos: mostralo bien en el portafolio.
- Registrar adopciones de verdad usando el modelo `Adopcion` (fecha real, adoptante), en vez de derivar del flag.
- Gestión de solicitudes con filtros por estado y vista de calendario simple.

**Calidad y profesionalismo**
- Correcciones de la v1: permiso admin en `adoptar`, helper único de errores en `api.js`, limpieza del código muerto que sirve el frontend desde Django.
- Tests de backend (permisos y flujos críticos con `pytest` o `manage.py test`) y unos pocos de frontend (Vitest).
- GitHub Actions: lint + build + tests en cada push.
- SEO básico (title/description/Open Graph por página), imágenes optimizadas (`webp`, `loading="lazy"`, tamaños), Lighthouse ≥ 90 en Performance/Accesibilidad/Best Practices.
- Subida de fotos a Cloudinary (plan gratuito) con modelo `CandidatoFoto`; en desarrollo, almacenamiento local.
- README de caso de estudio: problema, decisiones, capturas, GIF, arquitectura, qué aprendiste.

## 3. Automatización con n8n + IA

Principio: **lo que se muestra tiene que funcionar de punta a punta y ser simple de explicar en una entrevista.** Dos workflows obligatorios, uno opcional.

**W1 — Nueva solicitud de visita (con IA)**
1. Django, al crear una `SolicitudVisita` (`transaction.on_commit`), hace `POST` a un webhook de n8n con firma HMAC en un header (secreto compartido por variable de entorno). Si n8n no responde, la app sigue funcionando (timeout corto, error logueado).
2. n8n valida la firma.
3. Nodo de IA (Claude): lee el motivo y los datos de la solicitud y devuelve JSON con `resumen` (2 líneas), `señales` (por ejemplo: vive en departamento, tiene niños, experiencia previa, dudas) y `respuesta_sugerida` (borrador cordial). La IA **no decide** ni rechaza: solo asiste.
4. n8n avisa al equipo (Telegram o email) con el resumen y un link directo al panel admin.
5. n8n hace `PATCH` a Django (con token de servicio) para guardar `ai_resumen` y `ai_respuesta_sugerida` en la solicitud, que el admin ve en su panel.
6. n8n envía a la persona un email de confirmación ("Recibimos tu solicitud de conocer a X").

**W2 — Recordatorio de visita**
- Trigger programado (diario): consulta a Django las visitas de las próximas 24 h y manda email/WhatsApp-template de recordatorio al visitante y aviso al admin.

**W3 (opcional, si sobra tiempo) — Descripción con IA**
- Botón en "Nuevo candidato": el admin carga rasgos en viñetas y n8n + IA devuelven una descripción cálida para editar antes de guardar.

**Entregables de automatización**
- Carpeta `automation/n8n/` con los workflows exportados (JSON **sin credenciales**), `docker-compose.yml` para correr n8n en local y un README con capturas del canvas de cada workflow.
- Endpoints nuevos y protegidos en Django: `PATCH /api/visitas/solicitudes/{id}/ai/` (solo token de servicio) y `GET /api/visitas/proximas/` (solo token de servicio).
- Variables de entorno documentadas en `.env.example`: `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `SERVICE_API_TOKEN`.
- Para el portafolio: correr n8n en local o en n8n Cloud, grabar un video corto (30–60 s) del flujo completo y linkearlo en el README. No hace falta tenerlo hosteado 24/7.

## 4. Fases

Cada fase termina con: build + lint + tests OK, resumen corto de lo cambiado y por qué, y **pausa para revisión**.

**Fase 0 — Base sana (medio día)**
Baseline en git y rama `v2`. Corregir permiso de `adoptar` (con test). Refactor de errores en `api.js` y bug de `update`. Separar `frontend/` y `backend/`. Eliminar código muerto de servir frontend desde Django. Renombrar paquete (`patablanca` → `refugio-del-mar`). `.env.example`. Ajustar Dockerfiles y rutas.

**Fase 1 — Sistema de diseño + Home**
Tokens, tipografía, íconos, componentes base, Layout nuevo, logo, Home completa con datos reales, optimización de la portada.

**Fase 2 — Catálogo y detalle**
Catálogo público, filtros/paginación, detalle rico, galería (`CandidatoFoto`), nuevos campos (tamaño, castrado, vacunado, convivencia), migraciones y datos semilla (`seed_demo`) con 12–15 animales creíbles.

**Fase 3 — Flujo de adopción y panel admin**
Solicitudes con línea de tiempo, `Adopcion` real, panel de métricas con gráficos, páginas Historias, Cómo adoptar + FAQ, Contacto/Voluntariado.

**Fase 4 — Automatizaciones n8n**
W1 y W2 (W3 opcional), endpoints de servicio, firma HMAC, documentación y video.

**Fase 5 — Pulido y publicación**
SEO, accesibilidad (recorrido con teclado y lector), Lighthouse, tests, GitHub Actions, README caso de estudio, capturas/GIF, deploy v2 (Netlify + Render con base nueva) y actualización de `CLAUDE.md`.

## 5. Decisiones ya tomadas (para no reabrirlas)

- Se mantiene el stack (React + Vite + Tailwind 4 + Django/DRF + Postgres). No migrar a TypeScript ni a Next.js: el foco es diseño y producto, no reescritura.
- Recharts para gráficos, `lucide-react` para íconos, Cloudinary para fotos, n8n para automatización, Claude como modelo de IA en n8n.
- Datos siempre ficticios (nombres, fotos, testimonios). No usar datos reales de personas.
- Cero funciones de IA que decidan por el admin: la IA resume y sugiere, el humano aprueba.
