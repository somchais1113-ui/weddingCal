import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, Box, Calculator, Check, ChevronDown, CircleHelp, Clock3,
  Download, FileDown, Grid2X2, Layers3, Maximize2, RotateCcw, Ruler, Save,
  Settings2, SlidersHorizontal, Sparkles, View, Waves,
} from 'lucide-react';
import FabricScene from './scene/FabricScene.jsx';
import { calculateComponent, ceilToPurchaseIncrement, DEFAULT_ITEMS } from './calculations/engine.js';
import { downloadText, exportCalculationCSV } from './utils/export.js';

const COLORS = [
  { name: 'ขาวนวล', color: '#f4f7ff' },
  { name: 'ฟ้าอ่อน', color: '#a8c4ed' },
  { name: 'น้ำเงิน', color: '#263b69' },
  { name: 'ชมพูหม่น', color: '#d9bfcf' },
  { name: 'เขียวเซจ', color: '#adc3ba' },
];
const BUFFER_FIELDS = [
  { key: 'seamBuffer', label: 'ตะเข็บ / การเย็บ', range: 'แนะนำ 5–10%', desc: 'ควรเผื่อทุกครั้ง' },
  { key: 'shrinkageBuffer', label: 'การหดตัว', range: 'แนะนำ 3–5%', desc: 'ใช้เมื่อต้องซักก่อนตัดเย็บ' },
  { key: 'patternMatchBuffer', label: 'การจับคู่ลาย', range: 'แนะนำ 5–15%', desc: 'ผ้าไม่มีลายให้ใส่ 0' },
  { key: 'wastageBuffer', label: 'ของเสียหน้างาน', range: 'แนะนำ 5–10%', desc: 'ลดความเสี่ยงผ้าขาด' },
];
const formatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const meters = cm => formatter.format(cm / 100);
const numberFormat = n => formatter.format(n);

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persistStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be disabled (private browsing or embedded previews).
  }
}

function NumberField({ label, value, unit = 'ซม.', step = 1, min = 0, max, help, onChange }) {
  return (
    <label className="field">
      <span className="field-top"><span>{label}</span>{help && <span className="field-hint">{help}</span>}</span>
      <span className="number-input-wrap">
        <input type="number" min={min} max={max} step={step} value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
        <span className="unit">{unit}</span>
      </span>
    </label>
  );
}

function SectionTitle({ number, title, icon: Icon }) {
  return <div className="section-title"><div className="section-symbol">{Icon ? <Icon size={15} strokeWidth={1.9} /> : number}</div><strong>{title}</strong></div>;
}

function ResultStat({ title, value, unit, subtitle, variant = '' }) {
  return <div className={`result-stat ${variant}`}>
    <div className="result-stat-label">{title}</div>
    <div className="result-stat-number">{value}<span>{unit}</span></div>
    <div className="result-stat-description">{subtitle}</div>
  </div>;
}

function SettingHelp({ children }) {
  return <div className="setting-help"><CircleHelp size={15} strokeWidth={2} /><span>{children}</span></div>;
}

export default function App() {
  const [type, setType] = useState('backdrop');
  const [drafts, setDrafts] = useState(() => readStored('wfc_drafts_v1', DEFAULT_ITEMS));
  const [fabricColor, setFabricColor] = useState(() => readStored('wfc_color_v1', COLORS[0].color));
  const [view, setView] = useState('perspective');
  const [resetSignal, setResetSignal] = useState(0);
  const [rounding, setRounding] = useState(0.5);
  const [history, setHistory] = useState(() => readStored('wfc_history_v1', []));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [projectName, setProjectName] = useState(() => readStored('wfc_project_v1', 'Wedding Fabric Project'));
  const item = drafts[type] ?? DEFAULT_ITEMS[type];

  useEffect(() => { persistStored('wfc_drafts_v1', drafts); }, [drafts]);
  useEffect(() => { persistStored('wfc_color_v1', fabricColor); }, [fabricColor]);
  useEffect(() => { persistStored('wfc_history_v1', history); }, [history]);
  useEffect(() => { persistStored('wfc_project_v1', projectName); }, [projectName]);
  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(''), 3200);
    return () => clearTimeout(timeout);
  }, [notice]);

  const estimation = useMemo(() => {
    try { return { data: calculateComponent(item), error: null }; }
    catch (error) { return { data: null, error: error.message }; }
  }, [item]);
  const calculation = estimation.data;
  const result = calculation?.result;
  const roundedMeters = result ? ceilToPurchaseIncrement(result.recommendedLength, rounding) : 0;

  function updateInput(key, value, nested = false) {
    setDrafts(previous => {
      const source = previous[type] ?? DEFAULT_ITEMS[type];
      return {
        ...previous,
        [type]: {
          ...source,
          inputs: nested
            ? { ...source.inputs, dimensions: { ...source.inputs.dimensions, [key]: value } }
            : { ...source.inputs, [key]: value },
        },
      };
    });
  }
  function updateBuffer(key, value) {
    setDrafts(previous => {
      const source = previous[type] ?? DEFAULT_ITEMS[type];
      return { ...previous, [type]: { ...source, buffers: { ...source.buffers, [key]: value } } };
    });
  }
  function restoreDefaults() {
    setDrafts(prev => ({ ...prev, [type]: structuredClone(DEFAULT_ITEMS[type]) }));
    setNotice('คืนค่าตัวอย่างเริ่มต้นแล้ว');
  }
  function saveHistory() {
    if (!calculation) return;
    setHistory(previous => [{ ...calculation, savedAt: new Date().toISOString(), projectName, fabricColor, purchaseMeters: roundedMeters }, ...previous].slice(0, 15));
    setNotice('บันทึกผลคำนวณไว้ในเบราว์เซอร์แล้ว');
  }
  function exportJSON() {
    if (!calculation) return;
    downloadText(`fabric-estimate-${type}.json`, JSON.stringify({ ...calculation, projectName, color: fabricColor, roundedPurchaseMeters: roundedMeters }, null, 2), 'application/json');
    setNotice('เตรียมไฟล์ JSON เรียบร้อย');
  }
  function loadHistory(entry) {
    if (!entry?.type || !entry?.inputs || !entry?.buffers) return;
    setDrafts(prev => ({ ...prev, [entry.type]: { id: entry.id, type: entry.type, inputs: entry.inputs, buffers: entry.buffers } }));
    setType(entry.type);
    setFabricColor(entry.fabricColor || COLORS[0].color);
    setNotice('โหลดข้อมูลจากประวัติแล้ว');
  }
  function switchType(next) {
    setType(next);
    setView('perspective');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-icon"><Layers3 size={23} strokeWidth={1.8} /></div>
          <div className="brand-copy"><span>WEDDING FABRIC</span><span>STUDIO <i>·</i> CALCULATOR</span></div></div>
        <div className="header-right"><span className="phase-chip"><span className="live-dot" /> PHASE 01</span><span className="topbar-description">คำนวณแม่นยำ · ออกแบบได้มั่นใจ</span></div>
      </header>

      <div className="content-shell">
        <div className="hero-heading">
          <div><div className="eyebrow"><span className="tiny-line" /> FABRIC PLANNING WORKSPACE <span className="hero-number">/ 01</span></div>
            <h1>วางแผนผ้า <span>ก่อนลงมือจริง</span></h1>
            <p>คำนวณปริมาณผ้าที่ต้องใช้ พร้อมจำลองรูปทรง 3 มิติในสเกลจริง</p>
          </div>
          <div className="project-block"><span className="project-label">ชื่อโปรเจกต์</span><input aria-label="ชื่อโปรเจกต์" value={projectName} onChange={event => setProjectName(event.target.value)} maxLength={90} /><span className="project-caption"><Check size={13} /> บันทึกอัตโนมัติในเบราว์เซอร์</span></div>
        </div>

        <main className="workspace">
          <aside className="controls-card">
            <div className="card-top"><span className="card-overline">01 / CONFIGURATION</span><button className="subtle-icon-button" onClick={restoreDefaults} title="คืนค่าเริ่มต้น"><RotateCcw size={16} /> <span>รีเซ็ต</span></button></div>
            <h2>ตั้งค่าผ้าที่ต้องการ</h2>
            <p className="muted intro-copy">เลือกประเภทงาน แล้วระบุขนาดพื้นที่จริง</p>

            <SectionTitle number="01" title="ประเภทงาน" icon={Layers3} />
            <div className="type-selector" role="group" aria-label="เลือกประเภทงาน">
              <button className={type === 'backdrop' ? 'type-button selected' : 'type-button'} onClick={() => switchType('backdrop')}><Grid2X2 size={19} /><strong>ฉากหลัง</strong><small>Backdrop Drape</small></button>
              <button className={type === 'ceilingDrape' ? 'type-button selected' : 'type-button'} onClick={() => switchType('ceilingDrape')}><Waves size={20} /><strong>ผ้าเพดาน</strong><small>Ceiling Drape</small></button>
            </div>

            <SectionTitle number="02" title="ขนาดพื้นที่" icon={Ruler} />
            <div className="field-grid">
              {type === 'backdrop' ? <>
                <NumberField label="ความกว้างฉาก" value={item.inputs.dimensions.backdropWidth} onChange={v => updateInput('backdropWidth', v, true)} />
                <NumberField label="ความสูงฉาก" value={item.inputs.dimensions.backdropHeight} onChange={v => updateInput('backdropHeight', v, true)} />
              </> : <>
                <NumberField label="ระยะระหว่างจุดแขวน" value={item.inputs.dimensions.spanDistance} onChange={v => updateInput('spanDistance', v, true)} />
                <NumberField label="ระยะหย่อนต่ำสุด" value={item.inputs.dimensions.sagDepth} onChange={v => updateInput('sagDepth', v, true)} min={0} />
                <NumberField label="จำนวนช่วงผ้าหย่อน" value={item.inputs.dimensions.numberOfSwags} unit="ช่วง" step={1} min={1} max={80} onChange={v => updateInput('numberOfSwags', v, true)} />
              </>}
            </div>
            <div className="divider-line" />
            <SectionTitle number="03" title="คุณสมบัติผ้า" icon={SlidersHorizontal} />
            <div className="field-grid">
              <NumberField label="หน้าผ้า" value={item.inputs.fabricWidth} onChange={v => updateInput('fabricWidth', v)} />
              {type === 'backdrop' && <NumberField label="ความฟูของจีบ" value={item.inputs.fullnessRatio} unit="เท่า" step={0.1} min={0.1} max={10} onChange={v => updateInput('fullnessRatio', v)} />}
            </div>
            <div className="fabric-presets"><span>หน้าผ้ายอดนิยม</span>{[150, 280].map(val => <button key={val} className={item.inputs.fabricWidth === val ? 'mini-chip active' : 'mini-chip'} onClick={() => updateInput('fabricWidth', val)}>{val} ซม.</button>)}</div>
            {type === 'ceilingDrape' && <>
              <label className="field method-field"><span className="field-top">วิธีคำนวณความยาวผ้าหย่อน</span>
                <span className="select-wrap"><select value={item.inputs.calculationMode ?? 'brief'} onChange={e => updateInput('calculationMode', e.target.value)}><option value="brief">สูตรประมาณค่าตามบรีฟ</option><option value="exact">ความยาว Catenary จริง</option></select><ChevronDown size={16} /></span>
              </label>
              <SettingHelp>1 ช่วง = ผ้าหนึ่งแถบเต็มหน้าผ้า ภาพ 3D แสดงโค้งจริง ส่วนสูตรประมาณค่าอาจให้ความยาวต่างจากโค้งจริง</SettingHelp>
            </>}
            <div className="divider-line" />
            <SectionTitle number="04" title="ส่วนเผื่อสำหรับสั่งซื้อ" icon={Settings2} />
            <div className="buffer-list">
              {BUFFER_FIELDS.map(field => <div className="buffer-row" key={field.key}>
                <div className="buffer-copy"><strong>{field.label}</strong><span>{field.range}</span></div>
                <label className="buffer-input"><input aria-label={field.label} type="number" min="0" max="100" step="1" value={item.buffers[field.key]} onChange={e => updateBuffer(field.key, e.target.value === '' ? 0 : Number(e.target.value))} /><span>%</span></label>
              </div>)}
            </div>
            <div className="buffer-total"><span>ส่วนเผื่อรวม</span><strong>{numberFormat(Object.values(item.buffers).reduce((sum, n) => sum + Number(n || 0), 0))}%</strong></div>
            <SettingHelp>ระบบบวกค่าเผื่อตะเข็บเพียงครั้งเดียวจากปริมาณทางทฤษฎี ไม่คิดซ้ำในสูตรพื้นฐาน</SettingHelp>
          </aside>

          <div className="main-column">
            <section className="preview-card">
              <div className="preview-header"><div><div className="card-overline">02 / REAL-TIME VISUALIZATION</div><h2>ภาพจำลองผ้า <span>3D Preview</span></h2></div><div className="preview-availability"><span className="live-dot" /> LIVE</div></div>
              <div className="viewport">
                {calculation ? <FabricScene params={calculation.sceneParams} color={fabricColor} view={view} resetSignal={resetSignal} />
                  : <div className="validation-panel"><CircleHelp size={25} /><strong>ตรวจสอบข้อมูลอีกครั้ง</strong><span>ค่าความกว้าง ความสูง จำนวนผืน และส่วนเผื่อต้องถูกต้องก่อนคำนวณ</span><small>{estimation.error}</small></div>}
                <div className="viewport-top-left"><span className="viewport-tag"><span className="live-dot" /> PARAMETRIC MODEL</span><span className="viewport-annotation">{type === 'backdrop' ? 'VERTICAL PLEATED DRAPE' : 'CATENARY CEILING DRAPE'}</span></div>
                <div className="view-controls">
                  {[['perspective', View, 'มุมมอง 3D'], ['front', Grid2X2, 'ด้านหน้า'], ['top', Layers3, 'ด้านบน']].map(([v, Icon, text]) => <button key={v} title={text} aria-label={text} className={view === v ? 'active' : ''} onClick={() => setView(v)}><Icon size={17} /></button>)}
                  <span className="view-divider" /><button aria-label="รีเซ็ตกล้อง" title="รีเซ็ตมุมมอง" onClick={() => { setView('perspective'); setResetSignal(x => x + 1); }}><RotateCcw size={17} /></button>
                </div>
                <div className="viewport-bottom-caption"><Maximize2 size={13} /><span>ลากเพื่อหมุน · เลื่อนเพื่อซูม · คลิกขวาเพื่อเลื่อนภาพ</span></div>
              </div>
              <div className="preview-footer"><div className="fabric-color-section"><span>สีผ้าสำหรับแสดงผล</span><div className="fabric-swatches">{COLORS.map(c => <button aria-label={c.name} title={c.name} key={c.color} style={{ '--swatch': c.color }} className={fabricColor === c.color ? 'swatch selected' : 'swatch'} onClick={() => setFabricColor(c.color)}>{fabricColor === c.color && <Check size={13} />}</button>)}</div></div>
                <div className="preview-scale"><span className="scale-line" /><span>สเกลอิงขนาดจริง · หน่วยเมตร</span></div>
              </div>
            </section>

            <section className="results-card">
              <div className="results-top"><div><div className="card-overline">03 / FABRIC ESTIMATE</div><h2>สรุปปริมาณผ้า</h2></div><div className="calculated-chip"><Calculator size={14} /> คำนวณอัตโนมัติ</div></div>
              {result ? <>
                <div className="results-grid">
                  <ResultStat title="ปริมาณทางทฤษฎี" value={meters(result.theoreticalLength)} unit="ม." subtitle="ยังไม่รวมส่วนเผื่อ" />
                  <ResultStat title="ปริมาณแนะนำ" value={meters(result.recommendedLength)} unit="ม." subtitle={`รวมส่วนเผื่อ ${numberFormat(result.totalBufferPercent)}%`} variant="recommended" />
                  <ResultStat title={type === 'backdrop' ? 'จำนวนผ้าที่ใช้' : 'จำนวนช่วงผ้าหย่อน'} value={numberFormat(result.panelCount)} unit={type === 'backdrop' ? 'ผืน' : 'ช่วง'} subtitle={type === 'backdrop' ? `ความฟูจริง ${numberFormat(result.effectiveFullness)} เท่า` : `ความยาว/ช่วง ${meters(result.swagLength)} ม.`} />
                </div>
                <div className="purchase-section"><div className="purchase-icon"><ArrowDownToLine size={22} /></div><div className="purchase-copy"><span>ปริมาณผ้าที่ควรสั่งซื้อ (ปัดขึ้น)</span><div><strong>{numberFormat(roundedMeters)}</strong> <span>เมตร</span></div></div><label className="rounding-selector"><span>ปัดขึ้นครั้งละ</span><span className="select-wrap"><select aria-label="หน่วยปัดขึ้น" value={rounding} onChange={e => setRounding(Number(e.target.value))}><option value="0.5">0.5 เมตร</option><option value="1">1 เมตร</option><option value="0.1">0.1 เมตร</option></select><ChevronDown size={13}/></span></label></div>
                {type === 'ceilingDrape' && <div className="ceiling-note"><CircleHelp size={17} /><span>ความยาวเส้นโค้ง 3D จริงต่อช่วง <strong>{meters(result.exactPerSwag)} ม.</strong> · สูตรประมาณค่าตามบรีฟ <strong>{meters(result.estimatedPerSwag)} ม.</strong> (ต่างกัน {numberFormat(Math.abs(result.geometryDifferencePercent))}%) {result.calculationMode === 'brief' && <em>ควรตรวจแบบและจุดแขวนก่อนสั่งจริง</em>}</span></div>}
                <div className="results-actions"><button className="primary-action" onClick={saveHistory}><Save size={16} /> บันทึกการคำนวณ <ArrowRight size={16} /></button><button className="secondary-action" onClick={() => exportCalculationCSV(calculation, roundedMeters)}><FileDown size={16} /> ส่งออก CSV</button><button className="secondary-action tertiary" onClick={exportJSON}><Download size={16} /> JSON</button></div>
              </> : <div className="results-empty">กรอกค่าที่ถูกต้องเพื่อแสดงผลลัพธ์</div>}
            </section>

            <section className="history-card"><div className="history-header"><div><Clock3 size={18} /><strong>ประวัติการคำนวณ</strong><span>{history.length} รายการ</span></div><button className="history-toggle" onClick={() => setHistoryOpen(v => !v)}>{historyOpen ? 'ซ่อนรายการ' : 'ดูรายการ'}<ChevronDown className={historyOpen ? 'rotate' : ''} size={15} /></button></div>
              {historyOpen && (history.length > 0 ? <div className="history-list">{history.map((entry, index) => <div className="history-item" key={`${entry.savedAt}-${index}`}><div><strong>{entry.projectName || 'งานผ้า'} · {entry.type === 'backdrop' ? 'ฉากหลัง' : 'ผ้าเพดาน'}</strong><small>{new Date(entry.savedAt).toLocaleString('th-TH')} · {meters(entry.result?.recommendedLength ?? 0)} ม.</small></div><button onClick={() => loadHistory(entry)}>เรียกใช้ <ArrowRight size={14} /></button></div>)}</div> : <p className="no-history">ยังไม่มีประวัติ กด “บันทึกการคำนวณ” เพื่อเริ่มเก็บรายการ</p>)}
            </section>
          </div>
        </main>
        <footer className="site-footer"><span>WEDDING FABRIC STUDIO</span><span>Phase 1 · Backdrop & Ceiling Drape · ควรยืนยันหน้าผ้า จุดต่อ และความยาวเผื่อติดตั้งกับช่างก่อนสั่งจริง</span></footer>
      </div>
      {notice && <div className="toast" role="status"><Check size={16} /> {notice}</div>}
    </div>
  );
}
