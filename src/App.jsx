import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── PALETA Y ESTILOS ────────────────────────────────────────────────────────
const C = {
  bg:       "#0f1117",
  surface:  "#181c27",
  card:     "#1e2235",
  border:   "#2a2f45",
  accent:   "#4f8ef7",
  teal:     "#2dd4a7",
  amber:    "#f5a623",
  red:      "#f05252",
  green:    "#34c47c",
  muted:    "#6b7394",
  text:     "#e8ecf5",
  textDim:  "#9aa3bf",
};

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const fmtM = (n) => `$${(n / 1_000_000).toFixed(2)}M`;

// ─── MESES CON OCUPACIÓN DEFAULT ─────────────────────────────────────────────
const MESES_DEFAULT = [
  { mes: "Ene", ocup: 55, tarifa: 160000 },
  { mes: "Feb", ocup: 60, tarifa: 165000 },
  { mes: "Mar", ocup: 65, tarifa: 170000 },
  { mes: "Abr", ocup: 70, tarifa: 185000 }, // Semana Santa
  { mes: "May", ocup: 55, tarifa: 155000 },
  { mes: "Jun", ocup: 58, tarifa: 160000 },
  { mes: "Jul", ocup: 72, tarifa: 190000 }, // Vacaciones
  { mes: "Ago", ocup: 70, tarifa: 185000 }, // Vacaciones
  { mes: "Sep", ocup: 55, tarifa: 155000 },
  { mes: "Oct", ocup: 58, tarifa: 160000 },
  { mes: "Nov", ocup: 60, tarifa: 165000 },
  { mes: "Dic", ocup: 85, tarifa: 240000 }, // Feria de Cali
];

// ─── SLIDER ──────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, format, onChange, color = C.accent }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.textDim, letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div style={{ position: "relative", height: 4, background: C.border, borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.1s" }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute", top: "50%", left: 0, width: "100%", height: 20,
            transform: "translateY(-50%)", opacity: 0, cursor: "pointer", margin: 0,
          }}
        />
      </div>
    </div>
  );
}

// ─── TARJETA MÉTRICA ─────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color = C.text, highlight }) {
  return (
    <div style={{
      background: highlight ? `${color}18` : C.card,
      border: `1px solid ${highlight ? color : C.border}`,
      borderRadius: 10, padding: "14px 16px",
      transition: "border-color 0.3s",
    }}>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── SEMÁFORO ────────────────────────────────────────────────────────────────
function Semaforo({ flujoAnual }) {
  let color, label, desc;
  if (flujoAnual >= 8_000_000) {
    color = C.green; label = "Rentable"; desc = "Excelente — supera el umbral de rentabilidad";
  } else if (flujoAnual >= 0) {
    color = C.amber; label = "Equilibrio"; desc = "Cubre costos — optimizar ocupación y tarifas";
  } else if (flujoAnual >= -5_000_000) {
    color = C.amber; label = "Déficit leve"; desc = "Pérdida manejable — revisar temporadas bajas";
  } else {
    color = C.red; label = "Déficit alto"; desc = "Requiere ajuste urgente de variables";
  }
  return (
    <div style={{
      background: C.card, border: `1px solid ${color}`, borderRadius: 12,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%", background: `${color}22`,
        border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: color }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color }}>{label}</div>
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <div style={{ fontSize: 11, color: C.muted }}>Flujo neto anual</div>
        <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{fmtM(flujoAnual)}</div>
      </div>
    </div>
  );
}

// ─── FILA MES ────────────────────────────────────────────────────────────────
function MesRow({ data, onChange }) {
  const noches = Math.round((data.ocup / 100) * 30);
  const ingreso = noches * data.tarifa;
  const rowStyle = { borderBottom: `1px solid ${C.border}`, opacity: data.activo === false ? 0.4 : 1 };
  return (
    <tr style={rowStyle}>
      <td style={{ padding: "8px 10px", color: C.textDim, fontSize: 12, fontWeight: 600, width: 40 }}>
        {data.mes}{data.activo === false && <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>–</span>}
      </td>
      <td style={{ padding: "4px 8px", width: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, width: `${data.ocup}%`, height: "100%", background: data.ocup >= 70 ? C.green : data.ocup >= 55 ? C.amber : C.red, borderRadius: 2 }} />
            <input type="range" min={20} max={95} step={1} value={data.ocup}
              onChange={(e) => onChange({ ...data, ocup: Number(e.target.value) })}
              style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 16, transform: "translateY(-50%)", opacity: 0, cursor: "pointer", margin: 0 }} />
          </div>
          <span style={{ fontSize: 12, color: C.text, minWidth: 32, fontVariantNumeric: "tabular-nums" }}>{data.ocup}%</span>
        </div>
      </td>
      <td style={{ padding: "4px 8px", width: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, width: `${((data.tarifa - 100000) / 250000) * 100}%`, height: "100%", background: C.accent, borderRadius: 2 }} />
            <input type="range" min={100000} max={350000} step={5000} value={data.tarifa}
              onChange={(e) => onChange({ ...data, tarifa: Number(e.target.value) })}
              style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 16, transform: "translateY(-50%)", opacity: 0, cursor: "pointer", margin: 0 }} />
          </div>
          <span style={{ fontSize: 11, color: C.text, minWidth: 58, fontVariantNumeric: "tabular-nums" }}>{fmt(data.tarifa)}</span>
        </div>
      </td>
      <td style={{ padding: "8px 10px", fontSize: 11, color: C.textDim, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{noches} noches</td>
      <td style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, color: ingreso > 2_500_000 ? C.green : C.amber, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtM(ingreso)}</td>
    </tr>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [hipoteca,      setHipoteca]      = useState(1800000);
  const [admin,         setAdmin]         = useState(380000);
  const [servicios,     setServicios]     = useState(250000);
  const [internet,      setInternet]      = useState(80000);
  const [limpieza,      setLimpieza]      = useState(280000);
  const [amenities,     setAmenities]     = useState(80000);
  const [comisionPct,   setComisionPct]   = useState(3);
  const [mantenimiento, setMantenimiento] = useState(100000);
  const [meses, setMeses]                 = useState(MESES_DEFAULT);
  const [mesInicio, setMesInicio]         = useState(1);
  const [tab, setTab]                     = useState("simulador");

  const calc = useMemo(() => {
    const egFijos = admin + servicios + internet + limpieza + amenities + mantenimiento;

    const mensual = meses.map((m, i) => {
      const activo   = i >= mesInicio - 1;
      const noches   = activo ? Math.round((m.ocup / 100) * 30) : 0;
      const ingBruto = noches * m.tarifa;
      const comision = ingBruto * (comisionPct / 100);
      const egTotal  = hipoteca + egFijos + (activo ? comision : 0);
      const flujo    = ingBruto - egTotal;
      return { ...m, noches, ingBruto, comision, egTotal, flujo, activo };
    });

    const ingAnual   = mensual.reduce((a, m) => a + m.ingBruto, 0);
    const egAnual    = mensual.reduce((a, m) => a + m.egTotal,  0);
    const flujoAnual = ingAnual - egAnual;
    const ocupProm   = Math.round(meses.reduce((a, m) => a + m.ocup, 0) / 12);
    const tarifaProm = Math.round(meses.reduce((a, m) => a + m.tarifa, 0) / 12);
    const roi        = (flujoAnual / 420_000_000) * 100;

    const proyeccion = Array.from({ length: 5 }, (_, i) => {
      const ing = ingAnual * Math.pow(1.07, i);
      const eg  = egAnual  * Math.pow(1.05, i);
      return { año: `Año ${i + 1}`, ing: Math.round(ing), eg: Math.round(eg), flujo: Math.round(ing - eg) };
    });

    const egFijosMensuales = hipoteca + egFijos;
    const nochesAnuales    = mensual.reduce((a, m) => a + m.noches, 0);
    const tarifaMin        = nochesAnuales > 0
      ? Math.ceil((egFijosMensuales * 12) / (nochesAnuales * (1 - comisionPct / 100)))
      : 0;

    return { mensual, ingAnual, egAnual, flujoAnual, ocupProm, tarifaProm, roi, proyeccion, tarifaMin, egFijos };
  }, [hipoteca, admin, servicios, internet, limpieza, amenities, comisionPct, mantenimiento, meses]);

  const updateMes = (i, val) => setMeses((prev) => prev.map((m, j) => (j === i ? val : m)));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "24px 20px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Simulador Financiero · Airbnb</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: C.text }}>Apartamento 211 — Vita Habitare</h1>
            <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>CRA 24F 3 OESTE 32-34 · San Fernando, Cali · Juan Jose Restrepo &amp; Ana María Gomez Saa</p>
          </div>
          <Semaforo flujoAnual={calc.flujoAnual} />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: C.surface, padding: 4, borderRadius: 10, width: "fit-content" }}>
        {[["simulador", "Simulador"], ["mensual", "Por mes"], ["proyeccion", "Proyección 5 años"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: tab === key ? C.accent : "transparent",
            color: tab === key ? "#fff" : C.muted,
            transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* ── TAB: SIMULADOR ── */}
      {tab === "simulador" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Egresos mensuales</div>
              <Slider label="Cuota hipoteca (Davivienda)" value={hipoteca} min={1200000} max={2500000} step={10000} format={fmt} onChange={setHipoteca} color={C.red} />
              <Slider label="Administración conjunto" value={admin} min={200000} max={700000} step={10000} format={fmt} onChange={setAdmin} />
              <Slider label="Servicios públicos" value={servicios} min={100000} max={500000} step={10000} format={fmt} onChange={setServicios} />
              <Slider label="Internet + streaming" value={internet} min={50000} max={200000} step={5000} format={fmt} onChange={setInternet} />
              <Slider label="Limpieza (por rotación)" value={limpieza} min={100000} max={600000} step={10000} format={fmt} onChange={setLimpieza} />
              <Slider label="Amenities / consumibles" value={amenities} min={30000} max={200000} step={5000} format={fmt} onChange={setAmenities} />
              <Slider label="Mantenimiento / imprevistos" value={mantenimiento} min={50000} max={300000} step={10000} format={fmt} onChange={setMantenimiento} />
              <Slider label="Comisión Airbnb (%)" value={comisionPct} min={1} max={15} step={0.5} format={(v) => `${v}%`} onChange={setComisionPct} color={C.amber} />
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.muted }}>Total egresos fijos/mes</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.red, fontVariantNumeric: "tabular-nums" }}>{fmt(hipoteca + calc.egFijos)}</span>
              </div>
            </div>

            {/* Mes de inicio */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Inicio de productividad</div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>Meses previos: egresos sin ingresos</div>
              <select
                value={mesInicio}
                onChange={(e) => setMesInicio(Number(e.target.value))}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.card, color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  outline: "none", appearance: "none",
                }}
              >
                {MESES_DEFAULT.map((m, i) => (
                  <option key={i} value={i + 1}>{m.mes} (mes {i + 1})</option>
                ))}
              </select>
              {mesInicio > 1 && (
                <div style={{ marginTop: 8, fontSize: 11, color: C.amber }}>
                  {mesInicio - 1} mes{mesInicio > 2 ? "es" : ""} sin ingresos · pérdida estimada: {fmtM((hipoteca + calc.egFijos) * (mesInicio - 1))}
                </div>
              )}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Punto de equilibrio</div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>Tarifa mínima para cubrir todos los costos:</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.amber, fontVariantNumeric: "tabular-nums" }}>{fmt(calc.tarifaMin)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>por noche · con la ocupación actual promedio ({calc.ocupProm}%)</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              <MetricCard label="Ingreso bruto anual" value={fmtM(calc.ingAnual)} sub={`Prom. ${fmt(calc.tarifaProm)}/noche`} color={C.green} />
              <MetricCard label="Egresos totales anuales" value={fmtM(calc.egAnual)} sub="Fijos + variables" color={C.red} />
              <MetricCard label="Flujo neto anual" value={fmtM(calc.flujoAnual)} sub={calc.flujoAnual >= 0 ? "Positivo" : "Déficit"} color={calc.flujoAnual >= 0 ? C.green : C.red} highlight={true} />
              <MetricCard label="ROI sobre precio" value={`${calc.roi.toFixed(2)}%`} sub="Anual sobre $420M" color={C.accent} />
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Flujo neto mensual</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={calc.mensual} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmt(v), n === "flujo" ? "Flujo neto" : n]} labelStyle={{ color: C.text, fontWeight: 600 }} />
                  <ReferenceLine y={0} stroke={C.border} strokeWidth={1} />
                  <Bar dataKey="flujo" radius={[4, 4, 0, 0]} fill={C.green} label={false}
                    cells={calc.mensual.map((m, i) => (
                      <cell key={i} fill={m.flujo >= 0 ? C.green : C.red} />
                    ))}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ingresos vs egresos por mes</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={calc.mensual} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(v)]} labelStyle={{ color: C.text, fontWeight: 600 }} />
                  <Line type="monotone" dataKey="ingBruto" stroke={C.green} strokeWidth={2} dot={false} name="Ingresos" />
                  <Line type="monotone" dataKey="egTotal" stroke={C.red} strokeWidth={2} dot={false} strokeDasharray="4 2" name="Egresos" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 16, height: 2, background: C.green }} /> Ingresos</span>
                <span style={{ fontSize: 11, color: C.red, display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 16, height: 2, background: C.red, borderTop: `2px dashed ${C.red}` }} /> Egresos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: POR MES ── */}
      {tab === "mensual" && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Ajusta ocupación y tarifa por mes · Los cambios actualizan todos los cálculos
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "10px 10px", fontSize: 11, color: C.muted, fontWeight: 600, textAlign: "left" }}>Mes</th>
                <th style={{ padding: "10px 8px", fontSize: 11, color: C.muted, fontWeight: 600, textAlign: "left" }}>Ocupación %</th>
                <th style={{ padding: "10px 8px", fontSize: 11, color: C.muted, fontWeight: 600, textAlign: "left" }}>Tarifa/noche</th>
                <th style={{ padding: "10px 10px", fontSize: 11, color: C.muted, fontWeight: 600, textAlign: "right" }}>Noches</th>
                <th style={{ padding: "10px 10px", fontSize: 11, color: C.muted, fontWeight: 600, textAlign: "right" }}>Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m, i) => (
                <MesRow key={m.mes} data={m} onChange={(v) => updateMes(i, v)} />
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: C.card, borderTop: `2px solid ${C.border}` }}>
                <td colSpan={3} style={{ padding: "10px 10px", fontSize: 12, fontWeight: 600, color: C.textDim }}>Totales anuales</td>
                <td style={{ padding: "10px 10px", fontSize: 12, fontWeight: 600, color: C.text, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {calc.mensual.reduce((a, m) => a + m.noches, 0)} noches
                </td>
                <td style={{ padding: "10px 10px", fontSize: 13, fontWeight: 700, color: C.green, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {fmtM(calc.ingAnual)}
                </td>
              </tr>
            </tfoot>
          </table>
          <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <MetricCard label="Ocupación promedio" value={`${calc.ocupProm}%`} color={C.accent} />
            <MetricCard label="Tarifa promedio" value={fmt(calc.tarifaProm)} color={C.accent} />
            <MetricCard label="Ingreso bruto anual" value={fmtM(calc.ingAnual)} color={C.green} />
            <MetricCard label="Flujo neto anual" value={fmtM(calc.flujoAnual)} color={calc.flujoAnual >= 0 ? C.green : C.red} highlight />
          </div>
        </div>
      )}

      {/* ── TAB: PROYECCIÓN ── */}
      {tab === "proyeccion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Proyección a 5 años</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Asume inflación de ingresos 7% anual y gastos 5% anual (estimado Colombia)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={calc.proyeccion} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="año" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(v)]} labelStyle={{ color: C.text, fontWeight: 600 }} />
                <ReferenceLine y={0} stroke={C.border} />
                <Bar dataKey="ing" name="Ingresos" fill={`${C.green}55`} stroke={C.green} strokeWidth={1} radius={[4, 4, 0, 0]} />
                <Bar dataKey="eg"  name="Egresos"  fill={`${C.red}44`}   stroke={C.red}   strokeWidth={1} radius={[4, 4, 0, 0]} />
                <Bar dataKey="flujo" name="Flujo neto" fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              {[[C.green, "Ingresos"], [C.red, "Egresos"], [C.accent, "Flujo neto"]].map(([c, l]) => (
                <span key={l} style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Año", "Ingresos brutos", "Egresos totales", "Flujo neto", "ROI acumulado"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: 11, color: C.muted, fontWeight: 600, textAlign: h === "Año" ? "left" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calc.proyeccion.map((row, i) => {
                  const roiAcum = (row.flujo / 420_000_000) * 100;
                  return (
                    <tr key={row.año} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : `${C.card}66` }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.text }}>{row.año}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: C.green, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtM(row.ing)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: C.red,   textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtM(row.eg)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: row.flujo >= 0 ? C.green : C.red, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtM(row.flujo)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: C.accent, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{roiAcum.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 11, color: C.muted, padding: "0 4px" }}>
            * La hipoteca Davivienda se mantiene fija durante el período. Los ingresos crecen 7% anual (inflación + mejora de reputación en plataforma). Los gastos operativos crecen 5% anual.
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>
        Simulador basado en Escritura Nro. 339 · Notaría 18 de Cali · 16/02/2026 · Precio base $420.000.000 · Hipoteca Davivienda $214.001.346
      </div>
    </div>
  );
}
