# Plan de implementación – Página Showcase

## 1. Objetivo

Crear una página `/showcase` que funcione como pitch visual para inversores y desarrolladores. Debe comunicar claramente el valor del proyecto Club, cómo opera la plataforma y por qué es sólida/escalable.

---

## 2. Secciones obligatorias

1. **Hero futurista**
   - Título + tagline + texto corto de valor.
   - Botones CTA: “Ver demo” / “Descargar deck”.
   - Fondo degradado oscuro con glow animado.
2. **Project Overview**
   - Explicación del problema y la solución.
   - Métricas/resaltados en tarjetas.
3. **Core Features**
   - Grid de 3x2 con tarjetas “glass”.
   - Cada tarjeta: icono, título y descripción concreta.
4. **Coverage & Integrations**
   - Lista visual de integraciones (Mercado Pago, NextAuth, Neon, etc.).
   - Etiquetas que indican estado (live / en progreso).
5. **System Logic Flow**
   - Timeline o diagrama: Alta socio → Inscripción → Cuotas → Pagos → Reportes.
   - Breve texto por paso.
6. **Tech Stack**
   - División por Frontend / Backend / Infra.
   - Mostrar logos o badges con versiones.
7. **Roadmap & Future**
   - Lista ordenada con hitos (pagos online, reportes avanzados, etc.).
   - Estado (En curso / Planeado).
8. **CTA final / Project Status**
   - Resumen del estado actual.
   - Botones de contacto/repositorio.

---

## 3. Lineamientos visuales

- Tema oscuro, elegante y minimalista.
- Alto contraste (textos claros sobre fondos #030712 / #0f172a).
- Card glassmorphism consistente con el panel admin.
- Animaciones sutiles usando `transition` o `framer-motion` (fade-in, hover glow).
- Tipografías: `Inter` (body) y `Space Grotesk` (headings) ya disponibles en `layout`.

---

## 4. UX / Layout

- Usar contenedor central `max-w-6xl` con `px-6 py-12`.
- Secciones separadas por espaciado amplio y divisores translucidos.
- Grid responsivo: 1 columna en mobile, 2 en tablet, 3 en desktop.
- Íconos: preferir `lucide-react`; si no está instalado, usar SVG inline.
- CTA siempre visible al inicio y final.

---

## 5. Stack y dependencias

- **Framework:** Next.js (App Router) – crear página en `src/app/showcase/page.tsx`.
- **Estilos:** Tailwind (ya configurado).
- **Animaciones:** CSS transitions; opcional integrar `framer-motion` (ya en proyecto) para hero/flow.
- **Contenido:** textos reales basados en README + docs.

---

## 6. Pasos técnicos

1. **Crear ruta** `app/showcase/page.tsx` con metadata específica.
2. **Hero**: sección `section` con background gradient + CTA buttons.
3. **Overview + métricas**: usar grid 2 columnas, tarjetas con borde.
4. **Features**: mapear lista estática de features (`const features = [...]`).
5. **Integraciones**: componente de chips con estado.
6. **Logic Flow**: componente `FlowStep` + layout de timeline.
7. **Tech Stack**: agrupar en objeto {frontend, backend, infra} y renderizar.
8. **Roadmap**: array de hitos con estado y fecha estimada.
9. **CTA final**: incluir enlaces reales (repo, email, demo placeholder).
10. **Responsivo**: verificar breakpoints y estados hover.

---

## 7. QA / Checklist

- [ ] Sin texto placeholder.
- [ ] Contraste AA validado (usar `text-base-muted` sólo sobre fondos claros).
- [ ] Animaciones no invasivas (<=300ms).
- [ ] Página apta para `next build` (sin dependencias nuevas rotas).
- [ ] Navegación: añadir enlace desde `/admin` o footer si se requiere visibilidad pública.
- [ ] Documentar en README sección “Showcase Page” con link a `/showcase`.

Con este plan, cualquier desarrollador puede implementar la página cumpliendo estética, contenido y requisitos técnicos descritos en `docs/ProjectShowcase.md`.

## Codemaps
