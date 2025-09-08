


# Objetivo

Construir en 3 horas un mini-dashboard con React + Next.js que:
	•	Consume una API de divisas (exchangerate.host),
	•	Aplica ≥ 3 transformaciones de datos,
	•	Muestra ≥ 4 visualizaciones,
	•	Incluye filtros (rango de fechas + dimensión “divisa”),
	•	Entrega evidencia de ejecución real (trazas y webhook local).

---

##  Stack
	•	Frontend: Next.js 13 (App Router) + React + TailwindCSS + TypeScript
	•	Visualizaciones: Recharts
	•	Backend ligero: API Routes de Next.js (Node 18)
	•	Logs / Evidencia: archivos JSONL en server/logs

---

## Fuente de datos

Se usa la API pública exchangerate.host.
Ejemplo de endpoint real:

```sh
GET https://api.exchangerate.host/timeseries?start_date=2025-08-01&end_date=2025-08-31&symbols=MXN,EUR,JPY
```

En caso de fallo o límite, existe un fixture local servido en:

```sh
/api/mock
```

---

## Transformaciones implementadas

En src/app/lib/transform.ts:
1. Agregación temporal: series diarias y medias móviles de 7 días.
2. % cambio: cálculo del rendimiento acumulado de cada divisa.
3. Normalización índice 100: todas las series empiezan en 100 para comparación.
4. Clasificación días: ↑, ↓ o = respecto al día anterior.
5. Top-N: selección de las divisas con mayor variación absoluta.

---

## Visualizaciones
- Línea: tendencia de la divisa seleccionada + media móvil 7 días.
- Barras: Top-N % cambio (clic → cambia símbolo).
- Área apilada: índice base 100 multiserie.
- Donut/Pie: distribución de días alcistas / bajistas / planos.
- Tabla drill-down: detalle diario de la divisa seleccionada.

---

## Interactividad
Filtros:
- Rango de fechas (date pickers).
- Selección de divisas (MXN, EUR, JPY, etc).
- Botón Aplicar refresca la data.
- Tooltips en todas las gráficas.
- Drill-down en barras: clic cambia divisa activa.

---

## Variables de entorno

Crea un archivo .env.local:

```sh
WEBHOOK_URL=http://localhost:3000/api/webhook
```

---

## Evidencia de ejecución
- Cada request al proxy /api/timeseries genera una entrada en
server/logs/http_trace.jsonl.
- El dashboard también envía payloads al webhook configurado en
server/logs/webhook.jsonl.

Ver en vivo:

- http://localhost:3000/api/trace
- http://localhost:3000/api/webhook/logs


⸻

▶️ Cómo correr el proyecto

```sh
npm install
npm run dev
```

Abrir: http://localhost:3000


### Decisiones de diseño
- Se priorizó flujo end-to-end en 2 horas: datos → transformaciones → visualización → evidencia.
- Next.js App Router elegido para simplificar backend + frontend en un solo proyecto.
- Fixture local para fallback rápido sin depender de red.
- JSONL como formato de logs (apéndice simple, legible y trazable).

⸻

### Declaración de uso de IA

Se utilizó IA como asistente en:
- Herramienta de busqueda para concer APIS de prueba, de ahí se obtuvo la que se usa en este proyecto
- Ejemplos de código para transformaciones.



