// Original symbolic navigation artwork. Not a radiograph, positioning scene or anatomical reference.
// Keep geometry independent of locale; mirrored navigation must never mirror anatomy.
export function ExamGraphic({ kind }: { kind: string }) {
  let drawing;
  if (kind === "chest" || kind === "chest-side") {
    drawing = kind === "chest-side" ? <>
      <path d="M117 24c-18 12-34 37-34 67 0 27 10 45 29 52 29-17 44-45 39-75-3-22-15-35-34-44Z" fill="var(--art-soft)" />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${112 + i} ${40 + i * 14}q-5 23-28 25m29-25q23 13 29 0`} />)}<path d="M117 25q25 50-5 118" strokeWidth="8" />
    </> : <>
      <path d="M116 24v115m8-115v115" strokeWidth="6" />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M116 ${38 + i * 15}q-24 10-42-5-15 22 2 29l32 9m16-${33 - i * 0}q24 10 42-5 15 22-2 29l-32 9`} />)}
      <path d="M116 22 80 31m44-9 36 9M92 137l24-9m32 9-24-9" />
    </>;
  } else if (kind === "hand") {
    drawing = <><path d="M103 146v-26c-12-8-22-22-31-35q-7-14 1-17c6-2 15 18 20 19L87 42q0-12 7-12 8 0 9 13l4 30-2-48q0-13 8-13t9 13l2 47 4-49q1-12 9-11 8 1 6 15l-2 47 9-33q3-12 10-9 7 3 3 16l-11 48q-2 17-14 27v22Z" fill="var(--art-soft)" />
      <path d="m106 120 2-28m14 28-1-31m15 30 5-30m-34-9-5-32m20 29-1-44m18 46 2-45m-43 63L83 78m17 43 13 12 19-1 12-12M113 137v14m16-14v14" /><circle cx="113" cy="124" r="4" /><circle cx="130" cy="124" r="4" /></>;
  } else if (kind === "elbow") {
    drawing = <><path d="M89 20v68q0 27 27 28l61 5M108 20v60q-2 13 12 16l60 5" strokeWidth="12" stroke="var(--art-soft)" /><path d="M89 20v68q0 27 27 28l61 5M108 20v60q-2 13 12 16l60 5M120 111l56 1" /><circle cx="105" cy="94" r="12" /></>;
  } else if (kind === "shoulder") {
    drawing = <><path d="m83 38 79-8-12 72-28-4-20-43M74 51q-18 12-8 34l21 64m2-89q17 11 13 28l10 55" fill="var(--art-soft)" /><path d="m83 38 79-8-12 72-28-4-20-43M59 41l52-17 58 4M74 51q-18 12-8 34l21 64m2-89q17 11 13 28l10 55" /><circle cx="81" cy="68" r="19" /></>;
  } else if (kind === "pelvis") {
    drawing = <><path d="M112 38Q84 10 60 30q-17 32 12 56l26 22 15 22h14l15-22 26-22q29-24 12-56-24-20-52 8l-8 29Z" fill="var(--art-soft)" /><path d="M112 38Q84 10 60 30q-17 32 12 56l26 22 15 22h14l15-22 26-22q29-24 12-56-24-20-52 8l-8 29ZM98 108l-15 41m59-41 15 41M120 68v58" /><ellipse cx="96" cy="94" rx="12" ry="16" /><ellipse cx="144" cy="94" rx="12" ry="16" /></>;
  } else if (kind === "foot") {
    drawing = <><path d="m102 22 5 47-38 37q-15 12-4 25 8 10 27 1l74-34q18-9 10-23-5-10-18-7l-31 4-4-50" fill="var(--art-soft)" /><path d="m102 22 5 47-38 37q-15 12-4 25 8 10 27 1l74-34m-43-76 4 50 31-4m-48 15 43-5m-48 15 48-5m-42 16 48-7m-39 18 43-9" /><circle cx="114" cy="79" r="10" /></>;
  } else if (kind === "knee" || kind === "ankle") {
    drawing = <><path d="M99 16v42q-14 14 0 28l7 62m32-132v42q14 14 0 28l-4 62" stroke="var(--art-soft)" strokeWidth="15" /><path d="M99 16v42q-14 14 0 28l7 62m32-132v42q14 14 0 28l-4 62M99 73h39M151 83l-3 65" />{kind === "knee" ? <ellipse cx="119" cy="61" rx="10" ry="13" /> : <path d="m103 140-20 10h76" />}</>;
  } else {
    drawing = <><path d="M74 32h92v96H74zM120 49v62M89 80h62" /><circle cx="120" cy="80" r="45" stroke="var(--art-soft)" strokeWidth="12" /></>;
  }
  return <svg className="exam-graphic" viewBox="0 0 240 168" aria-hidden="true" focusable="false"><circle cx="104" cy="91" r="66" fill="var(--art-soft)" opacity=".5" /><circle cx="187" cy="34" r="23" fill="var(--art-soft)" opacity=".7" /><g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">{drawing}</g></svg>;
}
