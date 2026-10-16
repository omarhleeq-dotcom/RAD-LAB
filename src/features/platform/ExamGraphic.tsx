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
  } else if (kind === "upper-limb") {
    drawing = <>
      <path d="M91 22q-15 1-17 17l8 42 27 39 5 22q2 9 9 8l3-2 7 5q6 3 8-3l-7-11 8 5q7 2 7-4l-15-14-13-13-21-38-4-35q9-10 1-16Z" fill="var(--art-soft)" />
      <circle cx="88" cy="36" r="8" /><path d="m88 45 6 32 24 36m-17-35 25 34m-7 8 10 17m-5-18 11 14" />
      <path d="M68 26q3-12 19-13l14 7m-13 58 13 1" opacity=".65" />
    </>;
  } else if (kind === "lower-limb") {
    drawing = <>
      <path d="M109 16q-17 0-17 19l6 41-3 19 5 43-9 11q-5 7 5 7h40q12-1 5-8l-20-14 2-42 8-18 6-38q2-19-15-20Z" fill="var(--art-soft)" />
      <path d="m113 31-3 39m-1 18 2 44m8-43-2 42m-6 9 14 8" />
      <ellipse cx="111" cy="78" rx="9" ry="10" /><path d="m101 23 10-5 15 5m-21 125h27" />
    </>;
  } else if (kind === "foot-ap") {
    drawing = <>
      <path d="M94 60q-9 7-7 21 2 11 12 25l1 15q-11 24 0 32 12 9 26 0 10-6 9-24l5-21q4-12 18-24 9-9 6-18-3-8-18-10-24-5-41-2Z" fill="var(--art-soft)" />
      <ellipse cx="92" cy="33" rx="12" ry="16" fill="var(--art-soft)" />
      <ellipse cx="118" cy="28" rx="8" ry="11" fill="var(--art-soft)" />
      <ellipse cx="139" cy="34" rx="7" ry="10" fill="var(--art-soft)" />
      <ellipse cx="156" cy="44" rx="6" ry="9" fill="var(--art-soft)" />
      <ellipse cx="170" cy="58" rx="5" ry="8" fill="var(--art-soft)" transform="rotate(25 170 58)" />
      <path d="m98 70 17 35m1-37 5 36m16-34-10 36m25-29-19 31m-25 8 24 3m-23 10 21 2" strokeWidth="3" />
      <path d="M108 139q-7 10 3 13 10 2 14-10" strokeWidth="3" />
    </>;
  } else if (kind === "foot-oblique") {
    drawing = <>
      <path d="M113 56q-14 2-17 15l2 24-4 23q-14 23-5 33 10 11 23 1 9-7 13-24l10-21 25-25q10-10 4-18-5-8-22-9Z" fill="var(--art-soft)" />
      <ellipse cx="112" cy="31" rx="11" ry="15" fill="var(--art-soft)" transform="rotate(18 112 31)" />
      <ellipse cx="136" cy="32" rx="7" ry="10" fill="var(--art-soft)" transform="rotate(23 136 32)" />
      <ellipse cx="153" cy="40" rx="6" ry="9" fill="var(--art-soft)" transform="rotate(28 153 40)" />
      <ellipse cx="166" cy="51" rx="5" ry="8" fill="var(--art-soft)" transform="rotate(35 166 51)" />
      <ellipse cx="176" cy="64" rx="4" ry="7" fill="var(--art-soft)" transform="rotate(40 176 64)" />
      <path d="m111 68 1 37m16-37-8 39m20-35-14 38m26-31-20 35m-24-2 21 6m-24 5 19 7" strokeWidth="3" />
      <path d="M100 137q-10 10-2 14 8 3 13-8" strokeWidth="3" />
    </>;
  } else if (kind === "knee-ap") {
    drawing = <>
      <path d="M103 13v39q0 8-10 15-9 7-7 20 2 12 14 12 12 0 19-8 7 8 19 8 12 0 14-12 2-13-7-20-10-7-10-15V13" fill="var(--art-soft)" />
      <path d="M91 107q28-6 56 0l-8 14-7 34h-23l-6-34Z" fill="var(--art-soft)" />
      <path d="m153 114 9-3 4 9-10 35h-8l6-33Z" fill="var(--art-soft)" />
      <path d="M99 80q3 13 15 3m11 0q12 10 15-3m-21-14v16m-10 31h22" strokeWidth="3" />
    </>;
  } else if (kind === "knee-lateral") {
    drawing = <>
      <path d="M97 13v44q-13 8-13 24 0 20 20 23 18 4 29-12 8-13-1-24l-13-12V13" fill="var(--art-soft)" />
      <path d="m106 111 27-10 9 13 27 32-17 12-29-33Z" fill="var(--art-soft)" />
      <path d="m109 118 5 14 27 26m-40-91q-14 8-8 23 7 12 21 6" />
      <path d="M142 63q13 1 11 13l-7 17q-10-1-11-10Z" fill="var(--art-soft)" /><path d="m117 113 14-5" strokeWidth="3" />
    </>;
  } else if (kind === "ankle-ap") {
    drawing = <>
      <path d="M94 13v66l-5 14 8 11 8-12h29l2-12V13" fill="var(--art-soft)" />
      <path d="M146 13v62l-5 25 8 9 7-20V13" fill="var(--art-soft)" />
      <path d="M106 100q13-5 25 0l7 15-10 10h-19l-10-10Z" fill="var(--art-soft)" />
      <path d="m105 131-10 18 13 7h25l10-12-9-14m-24 1 2 17m15-17-2 17M101 83h26" />
    </>;
  } else if (kind === "ankle-lateral") {
    drawing = <>
      <path d="M99 13v62l-8 15q9 9 21 5l12-8V13" fill="var(--art-soft)" />
      <path d="M112 17v56l-6 17" opacity=".6" />
      <path d="M99 101q17-10 31-1l8 12-17 10-23-5Z" fill="var(--art-soft)" />
      <path d="m95 116-13 2q-15 2-15 16 0 14 17 14l38-2 16-10-17-13" fill="var(--art-soft)" />
      <path d="m137 118 23 3 21 15q7 7-3 10l-44-6m14-10 22 8m-83-5h21" />
    </>;
  } else if (kind === "head") {
    drawing = <><path d="M99 140v-20q-27-10-27-48 0-43 43-46 40-4 44 39l13 24-14 3v21q-1 13-27 9v18" fill="var(--art-soft)" /><path d="M84 53q33-27 59 0m-54 8q8-17 21-3 12-18 23-1m-22 2v29m39-12h5m-13 29h13" /></>;
  } else if (kind === "spine") {
    drawing = <><path d="M123 19q-28 32 0 66 27 32-1 64" strokeWidth="5" />{[0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i} transform={`translate(${i < 3 ? -8 : i < 5 ? 8 : 0} 0)`}><rect x="107" y={24 + i * 17} width="26" height="11" rx="4" fill="var(--art-soft)" /><path d={`M100 ${29 + i * 17}h-8m48 0h8`} /></g>)}</>;
  } else {
    drawing = <><path d="M74 32h92v96H74zM120 49v62M89 80h62" /><circle cx="120" cy="80" r="45" stroke="var(--art-soft)" strokeWidth="12" /></>;
  }
  return <svg className="exam-graphic" data-graphic={kind} viewBox="0 0 240 168" aria-hidden="true" focusable="false"><circle cx="104" cy="91" r="66" fill="var(--art-soft)" opacity=".5" /><circle cx="187" cy="34" r="23" fill="var(--art-soft)" opacity=".7" /><g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">{drawing}</g></svg>;
}
