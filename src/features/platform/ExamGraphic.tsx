// Original schematic navigation artwork: each projection has its own silhouette/crop.
// Not diagnostic images, not positioning scenes; geometry never mirrors with locale.
export function ExamGraphic({ kind }: { kind: string }) {
  let drawing;
  if (kind === "chest-pa" || kind === "chest-ap") {
    drawing = <>
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M116 ${36 + i * 15}q-24 10-42-5-15 22 2 29l32 9m16-33q24 10 42-5 15 22-2 29l-32 9`} />)}
      {kind === "chest-pa" ? <><path d="M116 22v118m8-118v118" strokeWidth="5" /><path d="m86 38-17 11 7 43 23-25m55-29 17 11-7 43-23-25" fill="var(--art-soft)" />{[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M114 ${32 + i * 14}h12`} />)}</> : <><path d="M120 39v66" strokeWidth="10" /><path d="m120 36-26-12-29 8m55 4 26-12 29 8m-55 75-9 16m9-16 9 16" /><path d="m87 142 25-13h16l25 13" /></>}
    </>;
  } else if (kind === "chest-lateral") {
    drawing = <><path d="M117 24c-18 12-34 37-34 67 0 27 10 45 29 52 29-17 44-45 39-75-3-22-15-35-34-44Z" fill="var(--art-soft)" />{[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${112 + i} ${40 + i * 14}q-5 23-28 25m29-25q23 13 29 0`} />)}<path d="M117 25q25 50-5 118" strokeWidth="7" /></>;
  } else if (kind === "wrist-pa") {
    drawing = <><path d="M100 151V111l-5-15V69m37 82v-40l10-15V69" fill="var(--art-soft)" strokeWidth="5" /><path d="M97 68 86 24m20 38-3-44m16 43 4-44m9 46 11-43m-1 49 16-35M105 113h22m-12 0v38" />{[0, 1, 2].map((i) => <g key={i}><rect x={95 + i * 15} y="73" width="11" height="12" rx="3" fill="var(--art-soft)" /><rect x={99 + i * 14} y="90" width="10" height="12" rx="3" /></g>)}</>;
  } else if (kind === "wrist-lateral") {
    drawing = <><path d="M108 151V111l-7-12 2-18 5-16 7-43m12 129v-40l10-13-3-17-8-17 5-42" fill="var(--art-soft)" strokeWidth="5" /><path d="M117 148v-35m-5-50 10-40m-12 45 17 1" />{[0, 1, 2].map((i) => <ellipse key={i} cx={117 + (i % 2) * 5} cy={78 + i * 10} rx="12" ry="6" fill="var(--art-soft)" />)}</>;
  } else if (kind === "hand-pa") {
    drawing = <><path d="M103 146v-26c-12-8-22-22-31-35q-7-14 1-17c6-2 15 18 20 19L87 42q0-12 7-12 8 0 9 13l4 30-2-48q0-13 8-13t9 13l2 47 4-49q1-12 9-11 8 1 6 15l-2 47 9-33q3-12 10-9 7 3 3 16l-11 48q-2 17-14 27v22Z" fill="var(--art-soft)" /><path d="m106 120 2-28m14 28-1-31m15 30 5-30m-34-9-5-32m20 29-1-44m18 46 2-45m-43 63L83 78m17 43 13 12 19-1 12-12M113 137v14m16-14v14" /><circle cx="113" cy="124" r="4" /><circle cx="130" cy="124" r="4" /></>;
  } else if (kind === "hand-lateral") {
    drawing = <><path d="M105 149v-27q-9-20-7-41l3-57q1-12 9-12 8 0 8 13l-1 51 9-14q7-10 13-5 5 5-2 14l-12 24q3 17-4 27v27Z" fill="var(--art-soft)" /><path d="M108 24v55l-3 31m10-84-1 53 2 30m-15-72h16m-17 15h17m-18 16h18m-15 53h20m-12 8v19m8-65 14-20" /></>;
  } else if (kind === "elbow-ap") {
    drawing = <><path d="M106 15v41q-17 7-12 23l9 11m30-75v41q17 7 12 23l-9 11M105 91l3 61m26-61-3 61" fill="var(--art-soft)" /><path d="M96 80h48m-25 10v62m17-65 13 10-2 55" /><circle cx="104" cy="73" r="9" /><circle cx="135" cy="73" r="9" /></>;
  } else if (kind === "elbow-lateral") {
    drawing = <><path d="M89 20v68q0 27 27 28l61 5M108 20v60q-2 13 12 16l60 5" strokeWidth="12" stroke="var(--art-soft)" /><path d="M89 20v68q0 27 27 28l61 5M108 20v60q-2 13 12 16l60 5M120 111l56 1" /><circle cx="105" cy="94" r="12" /></>;
  } else if (kind === "shoulder-grashey") {
    drawing = <><path d="m87 43 74-12-10 73-29-7-17-37M73 54q-18 12-8 34l21 61m3-86q17 11 13 28l10 53" fill="var(--art-soft)" /><path d="m87 43 74-12-10 73-29-7-17-37M59 42l52-18 58 4M73 54q-18 12-8 34l21 61m3-86q17 11 13 28l10 53" /><circle cx="81" cy="71" r="19" /><path d="m107 53 5 35" /></>;
  } else if (kind === "pelvis-ap") {
    drawing = <><path d="M112 38Q84 10 60 30q-17 32 12 56l26 22 15 22h14l15-22 26-22q29-24 12-56-24-20-52 8l-8 29Z" fill="var(--art-soft)" /><path d="M112 38Q84 10 60 30q-17 32 12 56l26 22 15 22h14l15-22 26-22q29-24 12-56-24-20-52 8l-8 29ZM98 108l-15 41m59-41 15 41M120 68v58" /><ellipse cx="96" cy="94" rx="12" ry="16" /><ellipse cx="144" cy="94" rx="12" ry="16" /></>;
  } else if (kind === "foot-ap" || kind === "foot-oblique") {
    drawing = <g transform={kind === "foot-oblique" ? "translate(25 -8) rotate(20 120 84) translate(24 0) scale(.8 1)" : undefined}>
      <path d="M96 146q-13-7-8-26l8-28-13-47q-5-19 7-23 13-3 15 16l4 16q-2-24 9-25 9-1 10 20l1 12q0-22 10-18 9 3 7 25 6-17 14-9 6 6 0 27 11-11 16-1 4 8-9 23l-25 25q-5 22-23 25Z" fill="var(--art-soft)" />
      <path d="m99 48 14 49m7-40 2 44m15-34-6 36m19-25-12 29m19-15-14 19m-29-7 22 6m-20 8 17 3m-24 10 18 3" />
      <path d="M97 133q-10 13 1 17l22 1q11-8 5-16Z" fill="var(--art-soft)" />
      <ellipse cx="94" cy="36" rx="7" ry="10" /><ellipse cx="119" cy="43" rx="5" ry="7" /><ellipse cx="139" cy="56" rx="5" ry="6" /><ellipse cx="156" cy="71" rx="4" ry="5" /><ellipse cx="168" cy="88" rx="4" ry="5" />
    </g>;
  } else if (kind === "knee-ap") {
    drawing = <><path d="M101 14v41q-17 10-12 25 3 12 15 10h30q13 2 16-10 5-15-12-25V14M105 99l3 54m26-54-3 54" fill="var(--art-soft)" /><path d="M93 95h53M119 58v24m22 21 12 4-3 46" /><path d="M98 81q9 7 17-1m8 0q8 8 18 0" /></>;
  } else if (kind === "knee-lateral") {
    drawing = <><path d="M120 15v43q23 9 16 33l-11 14-8 47m-17-137v44q-18 9-13 31l18 14-9 48" fill="var(--art-soft)" /><circle cx="111" cy="79" r="19" /><ellipse cx="147" cy="70" rx="7" ry="13" /><path d="m102 109 20 3m-21 0-4 40m30-43 10 5-7 38" /></>;
  } else if (kind === "ankle-ap") {
    drawing = <><path d="M101 14v66l8 15h24l7-15V14m15 0-1 70-10 19M107 114l-11 32m38-32 12 32" fill="var(--art-soft)" /><path d="M108 98h24q9 10-1 17h-23q-10-7 0-17Zm-5 24h32m-32 10h32m-25 12h20" /></>;
  } else if (kind === "ankle-lateral") {
    drawing = <><path d="M109 15v64l-15 21-18 19q-12 17 7 24 11 3 21-2l65-21q15-6 8-17-5-7-18-6l-27-6V15" fill="var(--art-soft)" /><path d="M108 94q12-14 23 3l-12 17-19-4Zm-15 24q-21 13-8 19l26-4m17-16 41-8m-35 15 38-8" /></>;
  } else if (kind === "head") {
    drawing = <><path d="M99 140v-20q-27-10-27-48 0-43 43-46 40-4 44 39l13 24-14 3v21q-1 13-27 9v18" fill="var(--art-soft)" /><path d="M84 53q33-27 59 0m-54 8q8-17 21-3 12-18 23-1m-22 2v29m39-12h5m-13 29h13" /></>;
  } else if (kind === "spine") {
    drawing = <><path d="M123 19q-28 32 0 66 27 32-1 64" strokeWidth="5" />{[0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i} transform={`translate(${i < 3 ? -8 : i < 5 ? 8 : 0} 0)`}><rect x="107" y={24 + i * 17} width="26" height="11" rx="4" fill="var(--art-soft)" /><path d={`M100 ${29 + i * 17}h-8m48 0h8`} /></g>)}</>;
  } else {
    drawing = <><path d="M74 32h92v96H74zM120 49v62M89 80h62" /><circle cx="120" cy="80" r="45" stroke="var(--art-soft)" strokeWidth="12" /></>;
  }
  return <svg className="exam-graphic" data-graphic={kind} viewBox="0 0 240 168" aria-hidden="true" focusable="false"><circle cx="104" cy="91" r="66" fill="var(--art-soft)" opacity=".5" /><circle cx="187" cy="34" r="23" fill="var(--art-soft)" opacity=".7" /><g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">{drawing}</g></svg>;
}
