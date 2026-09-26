Leé completos `CLAUDE.md` y `docs/PLAN_V2.md` antes de tocar cualquier archivo. Es la v2 de mi proyecto "Refugio del Mar", que voy a mostrar en mi portafolio profesional. Quiero un diseño que transmita Pinamar (calidez, cuidado, tranquilidad), mejores funcionalidades y una automatización con n8n + IA, según el plan.

Alcance de ESTA sesión: solo Fase 0 y Fase 1. No avances a la Fase 2.

Antes de escribir código, entrá en modo plan: revisá el código real, confirmá o corregí lo que dice CLAUDE.md, y mostrame un plan de pasos corto para que lo apruebe.

FASE 0 — Base sana
1. Si la carpeta no es un repo git: `git init`, agregá un `.gitignore` adecuado (node_modules, dist, .env, __pycache__, db, venv) y hacé un commit "v1 baseline". Después creá la rama `v2` y trabajá ahí.
2. Corregí el permiso de `PATCH /api/candidatos/{id}/adoptar/` para que solo lo use un admin (reusá `IsAdmin` de `auth_app/permissions.py`) y agregá un test que verifique 403 para usuario común y 200 para admin.
3. En `services/api.js`: creá un helper único para parsear errores de respuesta y usalo en todos los servicios (hoy está copiado en cada método). Corregí `candidatosService.update` (URL con barra final).
4. Separá el proyecto en `frontend/` (todo el código React y su config) y `backend/` (lo que hoy está en `src/api/`). Usá `git mv` para conservar el historial, actualizá Dockerfiles, nginx, README y rutas. Eliminá de `refugio_api/urls.py` las vistas que sirven el frontend desde Django (`serve_frontend`, `serve_frontend_file`) y su ruta comodín, y comprobá que la API sigue funcionando.
5. Renombrá el paquete a `refugio-del-mar` y agregá `.env.example` en frontend y backend.
6. Verificá: `npm run build`, `npm run lint`, `python manage.py check` y `python manage.py test`. Commit por cada paso lógico.

FASE 1 — Sistema de diseño y Home
Seguí la sección "Dirección de diseño: Pinamar" de `docs/PLAN_V2.md`.
1. Tokens en el `@theme` de `index.css`: conservá mis colores actuales, renombralos con los nombres semánticos del plan (mar, arena, espuma, bruma, niebla, duna) y agregá `atardecer` y `pino`. Actualizá todos los usos de los nombres viejos (forest, sun, snowmelt, rim, glacial, deep, sand). Chequeá el contraste AA de los pares de color que uses y ajustá `atardecer`/`pino` si no cumplen.
2. Tipografía: Fraunces para títulos y Nunito para el cuerpo. Instalá `lucide-react` y reemplazá los emojis usados como íconos.
3. Rediseñá los componentes base: Button, Card, Badge, Input, EmptyState, y sumá Skeleton. Bordes muy redondeados, sombras suaves, foco visible, estados de carga y deshabilitado.
4. Rediseñá `Layout`: header claro y translúcido sobre arena (no la barra oscura), logo SVG simple (huella + ola), menú móvil tipo drawer accesible, y footer en `mar` con divisor de ola y datos de contacto.
5. Reescribí `HomePage` con las 6 secciones del plan (hero, contador de impacto con datos reales de `/api/adopciones/resumen`, candidatos destacados, cómo funciona adoptar, historias de adopción con contenido ficticio de ejemplo, cómo ayudar + CTA). Como el catálogo todavía exige login en esta fase, los candidatos destacados y el contador deben degradar con elegancia si el usuario no está autenticado (por ejemplo, con contenido de ejemplo estático); en la Fase 2 se vuelven públicos.
6. Optimizá la portada: convertí `portada.png` (3.3 MB) a `webp` responsivo y usala con `loading` y `alt` correctos.
7. Respetá `prefers-reduced-motion` y que todo se vea bien desde 360 px de ancho.
8. Verificá con `npm run build` y `npm run lint`. Levantá el frontend y revisá visualmente Home, Login, Candidatos y Detalle en escritorio y móvil; corregí lo que se vea roto por el cambio de tokens.

Reglas de trabajo
- Textos de la interfaz en español rioplatense (voseo). Datos siempre ficticios.
- No hardcodees colores en los componentes: usá los tokens.
- No agregues dependencias más allá de `lucide-react` sin decírmelo antes.
- Soy junior/intermedia y quiero aprender: al terminar cada fase escribime un resumen de máximo 10 líneas con qué cambió, por qué tomaste cada decisión importante y qué concepto conviene que repase. Después frená y esperá mi revisión.
- Si encontrás algo que contradice CLAUDE.md o el plan, avisame en vez de improvisar.
