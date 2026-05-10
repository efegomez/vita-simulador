import { useState, useMemo } from "react";
import { LineChart, Line, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush, Cell } from "recharts";

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
  { mes: "Ene", ocup: 55, tarifa: 250000 },
  { mes: "Feb", ocup: 60, tarifa: 250000 },
  { mes: "Mar", ocup: 65, tarifa: 250000 },
  { mes: "Abr", ocup: 70, tarifa: 250000 },
  { mes: "May", ocup: 55, tarifa: 250000 },
  { mes: "Jun", ocup: 58, tarifa: 250000 },
  { mes: "Jul", ocup: 72, tarifa: 250000 },
  { mes: "Ago", ocup: 70, tarifa: 250000 },
  { mes: "Sep", ocup: 55, tarifa: 250000 },
  { mes: "Oct", ocup: 58, tarifa: 250000 },
  { mes: "Nov", ocup: 60, tarifa: 250000 },
  { mes: "Dic", ocup: 85, tarifa: 250000 },
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
  const noches  = Math.round((data.ocup / 100) * 30);
  const ingreso = noches * data.tarifa;
  const opacity = data.fase === "preentrega" ? 0.25 : data.fase === "soloHipoteca" ? 0.5 : 1;
  const faseTag = data.fase === "preentrega"
    ? <span style={{ fontSize: 9, color: C.muted, marginLeft: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>sin costos</span>
    : data.fase === "soloHipoteca"
    ? <span style={{ fontSize: 9, color: C.amber, marginLeft: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>hipoteca</span>
    : null;
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}`, opacity }}>
      <td style={{ padding: "8px 10px", color: C.textDim, fontSize: 12, fontWeight: 600, width: 40 }}>
        {data.mes}{faseTag}
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
      <td style={{ padding: "8px 10px", fontSize: 11, color: C.textDim, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{data.fase === "activo" ? `${noches} noches` : "—"}</td>
      <td style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, color: ingreso > 2_500_000 ? C.green : C.amber, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{data.fase === "activo" ? fmtM(ingreso) : "—"}</td>
    </tr>
  );
}

// ─── SELECTOR DE MES ─────────────────────────────────────────────────────────
function MesSelect({ value, onChange, minValue = 1, label }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 5 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
          background: C.card, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
          outline: "none", appearance: "none",
        }}
      >
        {MESES_DEFAULT.map((m, i) => (
          <option key={i} value={i + 1} disabled={i + 1 < minValue}>{m.mes} (mes {i + 1})</option>
        ))}
      </select>
    </div>
  );
}

// ─── AMORTIZACIÓN ────────────────────────────────────────────────────────────
function computeAmortizacion(saldoInicial, tasaEA, plazoMeses, abonos) {
  const r        = Math.pow(1 + tasaEA / 100, 1 / 12) - 1;
  const cuota    = saldoInicial * r * Math.pow(1+r, plazoMeses) / (Math.pow(1+r, plazoMeses) - 1);
  const abonosMap = Object.fromEntries(abonos.filter(a => a.mes > 0 && a.monto > 0).map(a => [a.mes, a.monto]));
  const schedule = [];
  let saldo = saldoInicial;
  for (let mes = 1; mes <= plazoMeses && saldo > 0.5; mes++) {
    const interes   = saldo * r;
    const principal = Math.min(cuota - interes, saldo);
    const abono     = Math.min(abonosMap[mes] || 0, Math.max(0, saldo - principal));
    saldo          -= (principal + abono);
    schedule.push({ mes, cuota: Math.round(cuota), interes: Math.round(interes), principal: Math.round(principal), abono: Math.round(abono), saldo: Math.max(0, Math.round(saldo)) });
  }
  return { schedule, cuota: Math.round(cuota), r };
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [hipoteca,      setHipoteca]      = useState(2000000);
  const [admin,         setAdmin]         = useState(380000);
  const [servicios,     setServicios]     = useState(250000);
  const [internet,      setInternet]      = useState(80000);
  const [limpieza,      setLimpieza]      = useState(280000);
  const [amenities,     setAmenities]     = useState(80000);
  const [comisionPct,   setComisionPct]   = useState(3);
  const [mantenimiento, setMantenimiento] = useState(100000);
  const [meses, setMeses]                 = useState(MESES_DEFAULT);
  const [tarifaBase,    setTarifaBase]    = useState(250000);
  const [ocupGlobal,    setOcupGlobal]    = useState(63);
  const [mesEntrega,    setMesEntrega]    = useState(3);
  const [mesArriendo,   setMesArriendo]   = useState(8);
  const [tasaEA,        setTasaEA]        = useState(7);
  const [plazoMeses,    setPlazoMeses]    = useState(180);
  const [saldoInicial,  setSaldoInicial]  = useState(214001346);
  const [abonos,        setAbonos]        = useState([]);
  const [verTodaTabla,  setVerTodaTabla]  = useState(false);
  const [horizonte,     setHorizonte]     = useState(5);
  const [brush1, setBrush1] = useState({ startIndex: 0, endIndex: 11 });
  const [brush2, setBrush2] = useState({ startIndex: 0, endIndex: 11 });
  const [tab, setTab]                     = useState("simulador");

  const calc = useMemo(() => {
    const egFijos = admin + servicios + internet + limpieza + amenities + mantenimiento;

    const mensual = meses.map((m, i) => {
      let fase, noches, ingBruto, comision, egTotal;
      if (i < mesEntrega - 1) {
        // Fase 0: antes de entrega — sin costos, sin ingresos
        fase = "preentrega";
        noches = 0; ingBruto = 0; comision = 0; egTotal = 0;
      } else if (i < mesArriendo - 1) {
        // Fase 1: entregado sin arrendar — solo hipoteca
        fase = "soloHipoteca";
        noches = 0; ingBruto = 0; comision = 0; egTotal = hipoteca;
      } else {
        // Fase 2: arriendo activo — todos los costos + ingresos
        fase = "activo";
        noches   = Math.round((m.ocup / 100) * 30);
        ingBruto = noches * m.tarifa;
        comision = ingBruto * (comisionPct / 100);
        egTotal  = hipoteca + egFijos + comision;
      }
      return { ...m, noches, ingBruto, comision, egTotal, flujo: ingBruto - egTotal, fase };
    });

    const ingAnual   = mensual.reduce((a, m) => a + m.ingBruto, 0);
    const egAnual    = mensual.reduce((a, m) => a + m.egTotal,  0);
    const flujoAnual = ingAnual - egAnual;

    const mesesActivos  = mensual.filter(m => m.fase === "activo");
    const ocupProm      = mesesActivos.length > 0
      ? Math.round(mesesActivos.reduce((a, m) => a + m.ocup, 0) / mesesActivos.length) : 0;
    const tarifaProm    = mesesActivos.length > 0
      ? Math.round(mesesActivos.reduce((a, m) => a + m.tarifa, 0) / mesesActivos.length) : 0;
    const roi           = (flujoAnual / 420_000_000) * 100;

    // Año 1: parcial (fases reales). Años 2-5: 12 meses completos activos.
    const ingMesActivo  = mesesActivos.length > 0 ? ingAnual / mesesActivos.length : 0;
    const baseIngFull   = ingMesActivo * 12;
    const baseEgFijosFull = (hipoteca + egFijos) * 12;

    const proyeccion = Array.from({ length: horizonte }, (_, i) => {
      if (i === 0) return { año: "Año 1", ing: Math.round(ingAnual), eg: Math.round(egAnual), flujo: Math.round(ingAnual - egAnual) };
      const growth   = Math.pow(1.07, i - 1); // año 2 = base sin crecimiento, año 3 = ×1.07, etc.
      const ing      = baseIngFull * growth;
      const comAnual = ing * (comisionPct / 100);
      const eg       = baseEgFijosFull * Math.pow(1.05, i - 1) + comAnual;
      return { año: `Año ${i + 1}`, ing: Math.round(ing), eg: Math.round(eg), flujo: Math.round(ing - eg) };
    });

    // Break-even: tarifa que hace flujoAnual = 0
    const mesesConHipoteca = Math.max(0, 13 - mesEntrega);
    const egAnualFijo      = hipoteca * mesesConHipoteca + egFijos * mesesActivos.length;
    const nochesAnuales    = mensual.reduce((a, m) => a + m.noches, 0);
    const tarifaMin        = nochesAnuales > 0
      ? Math.ceil(egAnualFijo / (nochesAnuales * (1 - comisionPct / 100)))
      : 0;

    // Flujo acumulado 60 meses — detecta punto de equilibrio
    let cumAcum = 0;
    let breakEvenIdx = -1;
    const acumulado60 = Array.from({ length: 60 }, (_, idx) => {
      const year = Math.floor(idx / 12);
      const mes  = idx % 12;
      const flujoMes = year === 0
        ? mensual[mes].flujo
        : Math.round(proyeccion[year].flujo / 12);
      cumAcum += flujoMes;
      if (breakEvenIdx === -1 && cumAcum >= 0) breakEvenIdx = idx;
      const label = mes === 0 ? `Año ${year + 1}` : (mes === 6 ? MESES_DEFAULT[mes].mes : "");
      return { idx, label, flujoMes, acumulado: cumAcum };
    });
    const breakEvenLabel = breakEvenIdx === -1
      ? "No alcanza en 5 años"
      : `${MESES_DEFAULT[breakEvenIdx % 12].mes} · Año ${Math.floor(breakEvenIdx / 12) + 1} (mes ${breakEvenIdx + 1})`;

    // 36 meses desde entrega: Y1 real + Y2/Y3 proyectados (para charts con scroll)
    let _acum = 0;
    const chart36 = Array.from({ length: 36 }, (_, i) => {
      const mesIdx = (mesEntrega - 1 + i) % 12;
      const year   = Math.floor((mesEntrega - 1 + i) / 12);
      const base   = mensual[mesIdx];
      let p;
      if (year === 0) {
        p = { ...base, label: base.mes };
      } else {
        const fi = Math.pow(1.07, year), fe = Math.pow(1.05, year);
        const n  = Math.round((base.ocup / 100) * 30);
        const ib = Math.round(n * base.tarifa * fi);
        const c2 = Math.round(ib * (comisionPct / 100));
        const et = Math.round((hipoteca + egFijos) * fe + c2);
        p = { ...base, noches: n, ingBruto: ib, comision: c2, egTotal: et, flujo: ib - et, fase: "activo", label: `${base.mes} A${year + 1}` };
      }
      _acum += p.flujo;
      return { ...p, flujoAcum: _acum, egNeg: -p.egTotal };
    });

    return { mensual, ingAnual, egAnual, flujoAnual, ocupProm, tarifaProm, roi, proyeccion, tarifaMin, egFijos, acumulado60, breakEvenIdx, breakEvenLabel, chart36 };
  }, [hipoteca, admin, servicios, internet, limpieza, amenities, comisionPct, mantenimiento, meses, mesEntrega, mesArriendo, horizonte]);

  const updateMes = (i, val) => setMeses((prev) => prev.map((m, j) => (j === i ? val : m)));

  const amort = useMemo(() => {
    const conAbonos    = computeAmortizacion(saldoInicial, tasaEA, plazoMeses, abonos);
    const sinAbonos    = computeAmortizacion(saldoInicial, tasaEA, plazoMeses, []);
    const totalInt     = conAbonos.schedule.reduce((a, r) => a + r.interes, 0);
    const totalIntSin  = sinAbonos.schedule.reduce((a, r) => a + r.interes, 0);
    const totalAbonos  = conAbonos.schedule.reduce((a, r) => a + r.abono, 0);
    const mesFin       = conAbonos.schedule.length;
    const mesSinAbonos = sinAbonos.schedule.length;

    // Saldo por año para chart (cada 12 meses, con y sin abonos)
    const saldoAnual = Array.from({ length: Math.ceil(sinAbonos.schedule.length / 12) }, (_, y) => {
      const idx     = Math.min((y + 1) * 12 - 1, sinAbonos.schedule.length - 1);
      const idxCon  = Math.min((y + 1) * 12 - 1, conAbonos.schedule.length - 1);
      return {
        año: `Año ${y + 1}`,
        sinAbonos: sinAbonos.schedule[idx]?.saldo ?? 0,
        conAbonos: idxCon < conAbonos.schedule.length ? conAbonos.schedule[idxCon].saldo : 0,
      };
    });

    // Int vs capital por año
    const intCapAnual = Array.from({ length: Math.ceil(conAbonos.schedule.length / 12) }, (_, y) => {
      const slice = conAbonos.schedule.slice(y * 12, (y + 1) * 12);
      return {
        año: `A${y + 1}`,
        interes:   slice.reduce((a, r) => a + r.interes, 0),
        principal: slice.reduce((a, r) => a + r.principal + r.abono, 0),
      };
    });

    return { ...conAbonos, totalIntereses: totalInt, ahorroAbonos: totalIntSin - totalInt, totalAbonos, mesFin, mesSinAbonos, saldoAnual, intCapAnual };
  }, [saldoInicial, tasaEA, plazoMeses, abonos]);

  // Resumen de fases para el panel
  const nPreentrega   = mesEntrega - 1;
  const nSoloHipoteca = Math.max(0, mesArriendo - mesEntrega);
  const nActivo       = Math.max(0, 13 - mesArriendo);

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
        {[["simulador", "Simulador"], ["mensual", "Por mes"], ["proyeccion", "Proyección 5 años"], ["deuda", "Deuda Davivienda"]].map(([key, label]) => (
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

            {/* Ingresos */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Ingresos — arriendo</div>
              <Slider label="Tarifa base por noche" value={tarifaBase} min={50000} max={500000} step={5000} format={fmt}
                onChange={(v) => { setTarifaBase(v); setMeses(prev => prev.map(m => ({ ...m, tarifa: v }))); }}
                color={C.green} />
              <Slider label="Ocupación global (%)" value={ocupGlobal} min={20} max={95} step={1} format={(v) => `${v}%`}
                onChange={(v) => { setOcupGlobal(v); setMeses(prev => prev.map(m => ({ ...m, ocup: v }))); }}
                color={C.teal} />
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.muted }}>Ajuste fino por mes → tab "Por mes"</span>
              </div>
            </div>

            {/* Egresos */}
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
                <span style={{ fontSize: 12, color: C.muted }}>Total egresos fijos/mes (activo)</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.red, fontVariantNumeric: "tabular-nums" }}>{fmt(hipoteca + calc.egFijos)}</span>
              </div>
            </div>

            {/* Fases del apartamento */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Fases del apartamento</div>
              <MesSelect label="Mes de entrega (hipoteca arranca)" value={mesEntrega} onChange={(v) => { setMesEntrega(v); if (mesArriendo < v) setMesArriendo(v); }} />
              <MesSelect label="Mes de inicio arriendo (todos los gastos + ingresos)" value={mesArriendo} onChange={setMesArriendo} minValue={mesEntrega} />

              {/* Resumen visual de fases */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                {nPreentrega > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: C.muted }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.muted, marginRight: 6 }} />
                      {MESES_DEFAULT[0].mes}–{MESES_DEFAULT[nPreentrega - 1].mes} · sin costos
                    </span>
                    <span style={{ color: C.muted }}>{nPreentrega} mes{nPreentrega > 1 ? "es" : ""}</span>
                  </div>
                )}
                {nSoloHipoteca > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: C.amber }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.amber, marginRight: 6 }} />
                      {MESES_DEFAULT[mesEntrega - 1].mes}–{MESES_DEFAULT[mesArriendo - 2].mes} · solo hipoteca
                    </span>
                    <span style={{ color: C.amber, fontVariantNumeric: "tabular-nums" }}>{fmtM(hipoteca * nSoloHipoteca)}</span>
                  </div>
                )}
                {nActivo > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: C.green }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.green, marginRight: 6 }} />
                      {MESES_DEFAULT[mesArriendo - 1].mes}–Dic · arriendo activo
                    </span>
                    <span style={{ color: C.green }}>{nActivo} mes{nActivo > 1 ? "es" : ""}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Punto de equilibrio */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Punto de equilibrio</div>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>Tarifa mínima para cubrir todos los costos del año:</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.amber, fontVariantNumeric: "tabular-nums" }}>{fmt(calc.tarifaMin)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>por noche · ocupación promedio {calc.ocupProm}% · {nActivo} meses activos</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              <MetricCard label="Ingreso bruto anual" value={fmtM(calc.ingAnual)} sub={`Prom. ${fmt(calc.tarifaProm)}/noche`} color={C.green} />
              <MetricCard label="Egresos totales anuales" value={fmtM(calc.egAnual)} sub="Todas las fases" color={C.red} />
              <MetricCard label="Flujo neto anual" value={fmtM(calc.flujoAnual)} sub={calc.flujoAnual >= 0 ? "Positivo" : "Déficit"} color={calc.flujoAnual >= 0 ? C.green : C.red} highlight={true} />
              <MetricCard label="ROI sobre precio" value={`${calc.roi.toFixed(2)}%`} sub="Anual sobre $420M" color={C.accent} />
            </div>

            {/* Gráfico flujo neto mensual */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ingresos vs Egresos por mes</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                <span style={{ marginRight: 14 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.green, marginRight: 4 }} />Ingresos</span>
                <span style={{ marginRight: 14 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.red, marginRight: 4 }} />Egresos</span>
                <span><span style={{ display: "inline-block", width: 16, height: 2, background: C.teal, marginRight: 4, verticalAlign: "middle" }} />Flujo neto</span>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={calc.chart36} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v, n) => [fmt(Math.abs(v)), n === "ingBruto" ? "Ingresos" : n === "egNeg" ? "Egresos" : "Flujo neto"]}
                    labelStyle={{ color: C.text, fontWeight: 600 }} />
                  <ReferenceLine y={0} stroke={C.border} strokeWidth={1} />
                  <Bar dataKey="ingBruto" name="ingBruto" fill={`${C.green}88`} stroke={C.green} strokeWidth={1} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="egNeg"    name="egNeg"    fill={`${C.red}88`}   stroke={C.red}   strokeWidth={1} radius={[0, 0, 3, 3]} />
                  <Line type="monotone" dataKey="flujo" stroke={C.teal} strokeWidth={2} dot={false} name="flujo" />
                  <Brush dataKey="label" height={22} startIndex={brush1.startIndex} endIndex={brush1.endIndex} onChange={setBrush1} stroke={C.border} fill={C.surface} travellerWidth={7} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico ingresos vs egresos */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ingresos vs egresos por mes</div>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={calc.chart36} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(v)]} labelStyle={{ color: C.text, fontWeight: 600 }} />
                  <Line type="monotone" dataKey="ingBruto" stroke={C.green} strokeWidth={2} dot={false} name="Ingresos" />
                  <Line type="monotone" dataKey="egTotal" stroke={C.red} strokeWidth={2} dot={false} strokeDasharray="4 2" name="Egresos" />
                  <Brush dataKey="label" height={22} startIndex={brush2.startIndex} endIndex={brush2.endIndex} onChange={setBrush2} stroke={C.border} fill={C.surface} travellerWidth={7} />
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
                <MesRow key={m.mes} data={{ ...m, fase: calc.mensual[i].fase }} onChange={(v) => updateMes(i, v)} />
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Proyección a {horizonte} años</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: C.muted }}>Horizonte:</span>
                <input type="range" min={2} max={20} step={1} value={horizonte}
                  onChange={(e) => setHorizonte(Number(e.target.value))}
                  style={{ width: 120, cursor: "pointer" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.accent, minWidth: 24 }}>{horizonte}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Ingresos +7%/año · Gastos +5%/año (estimado Colombia)</div>
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

          {/* Flujo acumulado — punto de equilibrio */}
          <div style={{ background: C.surface, border: `1px solid ${calc.breakEvenIdx >= 0 ? C.teal : C.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Flujo acumulado — punto de equilibrio</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Equilibrio</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: calc.breakEvenIdx >= 0 ? C.teal : C.red, fontVariantNumeric: "tabular-nums" }}>{calc.breakEvenLabel}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Suma acumulada de flujos mensuales · año 1 real, años 2–5 con inflación 7%/5%</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={calc.acumulado60} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [fmt(v), name === "acumulado" ? "Acumulado" : "Flujo mes"]}
                  labelFormatter={(_, payload) => {
                    if (!payload || !payload[0]) return "";
                    const d = payload[0].payload;
                    return `Mes ${d.idx + 1} · ${MESES_DEFAULT[d.idx % 12].mes} Año ${Math.floor(d.idx / 12) + 1}`;
                  }}
                  labelStyle={{ color: C.text, fontWeight: 600 }}
                />
                <ReferenceLine y={0} stroke={C.teal} strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "Equilibrio", position: "insideTopLeft", fill: C.teal, fontSize: 10 }} />
                {calc.breakEvenIdx >= 0 && (
                  <ReferenceLine x={calc.acumulado60[calc.breakEvenIdx].label} stroke={C.teal} strokeDasharray="4 2" strokeWidth={1} />
                )}
                <Line type="monotone" dataKey="acumulado" stroke={C.accent} strokeWidth={2.5} dot={false} name="acumulado" />
              </LineChart>
            </ResponsiveContainer>
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

      {/* ── TAB: DEUDA ── */}
      {tab === "deuda" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <MetricCard label="Cuota mensual" value={fmt(amort.cuota)} sub={`Tasa ${tasaEA}% EA`} color={C.red} />
            <MetricCard label="Total intereses" value={fmtM(amort.totalIntereses)} sub={`${amort.mesFin} meses`} color={C.amber} />
            <MetricCard label="Pago total en" value={`Mes ${amort.mesFin}`} sub={`Año ${Math.ceil(amort.mesFin/12)} · ${amort.mesFin < amort.mesSinAbonos ? `${amort.mesSinAbonos - amort.mesFin} meses antes` : "sin adelanto"}`} color={C.teal} highlight={amort.mesFin < amort.mesSinAbonos} />
            <MetricCard label="Ahorro en intereses" value={fmtM(amort.ahorroAbonos)} sub={amort.totalAbonos > 0 ? `Abonos: ${fmtM(amort.totalAbonos)}` : "Sin abonos aún"} color={amort.ahorroAbonos > 0 ? C.green : C.muted} highlight={amort.ahorroAbonos > 0} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14, alignItems: "start" }}>

            {/* Panel izquierdo: parámetros + abonos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Parámetros del crédito</div>
                <Slider label="Tasa efectiva anual (%)" value={tasaEA} min={5} max={20} step={0.1} format={(v) => `${v.toFixed(1)}%`} onChange={setTasaEA} color={C.amber} />
                <Slider label="Plazo del crédito" value={plazoMeses} min={60} max={360} step={12} format={(v) => `${v/12} años (${v} meses)`} onChange={setPlazoMeses} />
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.textDim }}>Saldo inicial</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums" }}>{fmtM(saldoInicial)}</span>
                  </div>
                  <input
                    type="number" value={saldoInicial} step={1000000}
                    onChange={(e) => setSaldoInicial(Math.max(0, Number(e.target.value)))}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Cuota calculada</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.red, fontVariantNumeric: "tabular-nums" }}>{fmt(amort.cuota)}</span>
                </div>
              </div>

              {/* Abonos a capital */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Abonos a capital</div>
                {abonos.length === 0 && (
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Sin abonos registrados</div>
                )}
                {abonos.map((ab, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Mes</div>
                      <input
                        type="number" value={ab.mes} min={1} max={plazoMeses}
                        onChange={(e) => setAbonos(prev => prev.map((a, j) => j === i ? { ...a, mes: Number(e.target.value) } : a))}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Monto (COP)</div>
                      <input
                        type="number" value={ab.monto} min={0} step={1000000}
                        onChange={(e) => setAbonos(prev => prev.map((a, j) => j === i ? { ...a, monto: Number(e.target.value) } : a))}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <button onClick={() => setAbonos(prev => prev.filter((_, j) => j !== i))}
                      style={{ marginTop: 14, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.red}44`, background: "transparent", color: C.red, cursor: "pointer", fontSize: 13, flexShrink: 0 }}>
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setAbonos(prev => [...prev, { mes: (prev[prev.length - 1]?.mes || 0) + 12, monto: 10000000 }])}
                  style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px dashed ${C.accent}66`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 12, marginTop: 4 }}>
                  + Agregar abono
                </button>
              </div>
            </div>

            {/* Panel derecho: charts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Saldo en el tiempo */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>Saldo de la deuda en el tiempo</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: C.teal, display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 16, height: 2, background: C.teal }} /> Con abonos</span>
                  <span style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 16, height: 2, background: C.muted, opacity: 0.5 }} /> Sin abonos</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={amort.saldoAnual} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="año" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtM(v)]} labelStyle={{ color: C.text, fontWeight: 600 }} />
                    <ReferenceLine y={0} stroke={C.border} />
                    <Line type="monotone" dataKey="sinAbonos" stroke={C.muted} strokeWidth={1.5} dot={false} strokeOpacity={0.5} name="Sin abonos" />
                    <Line type="monotone" dataKey="conAbonos" stroke={C.teal} strokeWidth={2.5} dot={false} name="Con abonos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Intereses vs capital por año */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Intereses vs capital pagado por año</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={amort.intCapAnual} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="año" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmtM(v)]} labelStyle={{ color: C.text, fontWeight: 600 }} />
                    <Bar dataKey="interes" name="Intereses" fill={`${C.red}55`} stroke={C.red} strokeWidth={1} radius={[3, 3, 0, 0]} stackId="a" />
                    <Bar dataKey="principal" name="Capital" fill={`${C.teal}55`} stroke={C.teal} strokeWidth={1} radius={[3, 3, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: C.red, display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.red }} /> Intereses</span>
                  <span style={{ fontSize: 11, color: C.teal, display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.teal }} /> Capital</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de amortización */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tabla de amortización · {amort.schedule.length} pagos</span>
              <button onClick={() => setVerTodaTabla(v => !v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 11 }}>
                {verTodaTabla ? "Ver menos" : "Ver todo"}
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Mes", "Cuota", "Interés", "Capital", "Abono", "Saldo"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", fontSize: 11, color: C.muted, fontWeight: 600, textAlign: h === "Mes" ? "left" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(verTodaTabla ? amort.schedule : amort.schedule.slice(0, 24)).map((row) => (
                    <tr key={row.mes} style={{ borderBottom: `1px solid ${C.border}`, background: row.abono > 0 ? `${C.amber}11` : "transparent" }}>
                      <td style={{ padding: "7px 12px", fontSize: 12, color: C.textDim, fontWeight: 600 }}>
                        {row.mes}
                        {row.abono > 0 && <span style={{ marginLeft: 6, fontSize: 9, color: C.amber, textTransform: "uppercase" }}>abono</span>}
                      </td>
                      <td style={{ padding: "7px 12px", fontSize: 11, color: C.text, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(row.cuota)}</td>
                      <td style={{ padding: "7px 12px", fontSize: 11, color: C.red, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(row.interes)}</td>
                      <td style={{ padding: "7px 12px", fontSize: 11, color: C.teal, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(row.principal)}</td>
                      <td style={{ padding: "7px 12px", fontSize: 11, color: C.amber, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.abono > 0 ? fmt(row.abono) : "—"}</td>
                      <td style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, color: C.text, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtM(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!verTodaTabla && amort.schedule.length > 24 && (
              <div style={{ padding: "10px 16px", fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}` }}>
                Mostrando 24 de {amort.schedule.length} pagos · <span style={{ color: C.accent, cursor: "pointer" }} onClick={() => setVerTodaTabla(true)}>Ver todos</span>
              </div>
            )}
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
