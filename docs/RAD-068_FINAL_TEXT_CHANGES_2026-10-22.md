# RAD-068 الجزء الأخير — كل نص تغيّر (قديم ← جديد)

النصوص كما تُعرض للمستخدم (بعد إزالة الرموز الداخلية ). الأدلة إنجليزية فقط (لا نظير عربي). المواضع: الفحص | القاعدة. عدد الأزواج الفريدة: 74 من 229 موضعًا معروضًا.

## 1. collimation-clipping — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: Required anatomy (apices, both lungs, costophrenic angles) is validated; the demo region size in cm is provisional.
- جديد: Required anatomy: apices, both lungs and costophrenic angles.

## 2. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: Principle validated; the 5 cm margin limit is provisional/configurable.
- جديد: Margin limit: 5 cm.

## 3. side-marker — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: Placement interaction only; deliberately unscored (weight 0): the repository references keep marker behaviour unscored until a validated scoring rule and orientation mapping exist, and the sources read in full (Chung 2020; Fuller 2016) are a single-site paediatric audit and a two-page editorial: they support that a marker is expected and that a wrong-side or missing marker is a recognised labelling error, but give no scoring rule, weight or viewer-side convention, and did not measure placement inside the field. Laterality uses an EDUCATIONAL display convention shared with the renderer (PA display: patient left = viewer right, never mirrored by UI language / RTL). A wrong-side marker is still a critical finding (pass-mark gate). TODO(medical-review): confirm the convention and decide whether marker side / presence should be scored.
- جديد: Placement interaction only; deliberately unscored (weight 0): the repository references keep marker behaviour unscored until a scoring rule and orientation mapping exist, and the sources read in full (Chung 2020; Fuller 2016) are a single-site paediatric audit and a two-page editorial: they support that a marker is expected and that a wrong-side or missing marker is a recognised labelling error, but give no scoring rule, weight or viewer-side convention, and did not measure placement inside the field. Laterality uses an EDUCATIONAL display convention shared with the renderer (PA display: patient left = viewer right, never mirrored by UI language / RTL). A wrong-side marker is still a critical finding (pass-mark gate).

## 4. rotation — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: Neutral target is validated; the +/-2 and +/-5 degree bands are provisional. Direction feedback follows BONTRAGER-9 p.83 through the sign convention (positive rotationDeg = patient's LEFT side toward the receptor = spine toward the viewer's right); it is feedback only and never changes the score.
- جديد: Rotation bands: +/-2 and +/-5 degrees. Direction feedback follows BONTRAGER-9 p.83 through the sign convention (positive rotationDeg = patient's LEFT side toward the receptor = spine toward the viewer's right); it is feedback only and never changes the score.

## 5. centering-lateral — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: Midline alignment is validated; tolerance values are provisional.
- جديد: Midline alignment.

## 6. centering-vertical — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: Target modelled as the centre of the required-anatomy region, not a measured T7 position; tolerances provisional.
- جديد: Target modelled as the centre of the required-anatomy region, not a measured T7 position.

## 7. kvp — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: 100–150 kV is a COMMON REFERENCE range (IAEA example) and earns partial credit; the narrower full-credit band is PROVISIONAL / LOCAL-PROTOCOL DEPENDENT. kVp physics (spectrum, penetration, output) is VALIDATED but is never mapped to displayed darkness.
- جديد: 100–150 kV is a common reference range (IAEA example) and earns partial credit; the narrower band earns full credit. kVp physics (spectrum, penetration, output) is never mapped to displayed darkness.

## 8. exposure-adequacy — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: VALIDATED: DI equation and the digital-exposure concepts (noise, DI sign). PROVISIONAL: the ±1 / ±3 DI scoring bands and the demo target the exposure is measured against; no universal EIT or DI pass/fail limit is claimed.
- جديد: DI equation and the digital-exposure concepts (noise, DI sign). No universal EIT or DI pass/fail limit is claimed.

## 9. dose-optimization — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: VALIDATED: digital dynamic range can hide excess exposure (dose creep) and optimization is the goal. PROVISIONAL: the DI scoring bands. No patient dose is calculated.
- جديد: Digital dynamic range can hide excess exposure (dose creep) and optimization is the goal. No patient dose is calculated.

## 10. aec-chambers — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: VALIDATED: the purpose of AEC. VENDOR / LOCAL-PROTOCOL DEPENDENT: chamber geometry, number, selection and termination. The lung-field preference is an educational, protocol-specific choice of this demo case.
- جديد: The purpose of AEC. Chamber geometry, number, selection and termination depend on the vendor and the local protocol.

## 11. sid — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: the reference is ≥ 183 cm (BONTRAGER-9 p.83, 92, 94); 180 cm (72 in rounded) earns full credit. Full credit 180–185 cm (existing 185 cm upper limit kept) and the 150–200 cm acceptable band are PROVISIONAL. Earlier note: 180 cm was a COMMON REFERENCE (IAEA example; 140–200 cm in the cited criteria), not the only valid SID. SID also feeds the exposure model (inverse square, VALIDATED physics; its mapping is an EDUCATIONAL MODEL).
- جديد: the reference is ≥ 183 cm (BONTRAGER-9 p.83, 92, 94); 180 cm (72 in rounded) earns full credit. Full credit 180–185 cm; acceptable band 150–200 cm. 180 cm is a common reference (IAEA example; 140–200 cm in the cited criteria), not the only valid SID. SID also feeds the exposure model (inverse-square physics; its mapping is an educational model).

## 12. wrong-projection.evidence — 3 موضعًا في 3 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect, chest-pa-erect
- قديم: PROVISIONAL / educational: forcing the pass mark below the threshold is a simulator rule, not a real-world automatic reject decision. The numeric score is unchanged.
- جديد: Forcing the pass mark below the threshold is a simulator rule, not a real-world automatic reject decision. The numeric score is unchanged.

## 13. patient-motion.concept — 3 موضعًا في 3 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect, chest-pa-erect
- قديم: COMMON QUALITY CRITERION: patient / respiratory motion reduces sharpness (the principle is validated). That this simulated patient moves is an educational assumption of the patient-cooperation profile.
- جديد: COMMON QUALITY CRITERION: patient / respiratory motion reduces sharpness. That this simulated patient moves is an educational assumption of the patient-cooperation profile.

## 14. patient-motion.evidence — 3 موضعًا في 3 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect, chest-pa-erect
- قديم: PROVISIONAL / educational: the gate is a simulator rule; no blur size or motion distance is claimed. The numeric score is unchanged.
- جديد: The gate is a simulator rule; no blur size or motion distance is claimed. The numeric score is unchanged.

## 15. wrong-side-marker.concept — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: COMMON QUALITY CRITERION: the image must identify the correct patient side. Which viewer side L / R belongs on is this simulator's EDUCATIONAL display convention (no validated orientation mapping is adopted in the references).
- جديد: COMMON QUALITY CRITERION: the image must identify the correct patient side. Which viewer side L / R belongs on is this simulator's EDUCATIONAL display convention (the references adopt no orientation mapping).

## 16. wrong-side-marker.evidence — 1 موضعًا في 1 فحصًا
- الفحوص: chest-pa-erect
- قديم: PROVISIONAL / educational: the laterality convention and the gate are simulator rules. Support read in full: Chung 2020 (PMC7685512) counted markers on the incorrect side as errors (4 of 421 audited paediatric radiographs; digital correction of a wrong radiopaque marker counted as acceptable), Fuller 2016 (PMC5016621) is an opinion editorial citing case reports of harm; neither defines which viewer side L / R belongs on. A missing marker is a separate critical finding with the same gate severity. The marker check itself stays unscored (weight 0) and the numeric score is unchanged.
- جديد: Support read in full: Chung 2020 (PMC7685512) counted markers on the incorrect side as errors (4 of 421 audited paediatric radiographs; digital correction of a wrong radiopaque marker counted as acceptable), Fuller 2016 (PMC5016621) is an opinion editorial citing case reports of harm; neither defines which viewer side L / R belongs on. A missing marker is a separate critical finding with the same gate severity. The marker check itself stays unscored (weight 0) and the numeric score is unchanged.

## 17. missing-marker.evidence — 3 موضعًا في 3 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect, chest-pa-erect
- قديم: PROVISIONAL / educational: the gate is a simulator rule with the same severity as the wrong-side marker. Pending educator / physicist review. The numeric score is unchanged.
- جديد: The gate is a simulator rule with the same severity as the wrong-side marker. The numeric score is unchanged.

## 18. side — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: Left lateral unless the protocol or right-sided pathology calls for the right (Bontrager); both sides are offered, left is correct for this case. Pending educator confirmation.
- جديد: Left lateral unless the protocol or right-sided pathology calls for the right (Bontrager); both sides are offered, left is correct for this case.

## 19. collimation-clipping — 2 موضعًا في 2 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect
- قديم: The required anatomy is Bontrager's criterion; the 27 × 31 cm demo region is provisional.
- جديد: The required anatomy is Bontrager's criterion.

## 20. collimation-excess — 2 موضعًا في 2 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect
- قديم: Principle validated; the 5 cm margin limit is provisional / configurable.
- جديد: Margin limit: 5 cm.

## 21. rotation — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: ENGINE TEACHING CHOICE: Bontrager gives about 1 cm of normal separation at 183 cm and no angle. The ±2° / ±5° bands come from separation ≈ 2·a·sin(θ) with an assumed thorax half-width a = 14 cm (1 cm → about 2°; 5° → about 2.4 cm). Neither the half-width nor the mapping is a Bontrager value. Magnitude only, no direction.
- جديد: Bontrager gives about 1 cm of normal separation at 183 cm and no angle. Magnitude only, no direction.

## 22. centering-lateral — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: CR perpendicular to the mid-thorax; the target is the centre of the demo region and the tolerances are provisional.
- جديد: CR perpendicular to the mid-thorax; the target is the centre of the required region.

## 23. centering-vertical — 2 موضعًا في 2 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect
- قديم: T7 is Bontrager's level; the position on the detector is modelled as the centre of the demo region and the tolerances are provisional.
- جديد: T7 is Bontrager's level; the position on the detector is modelled as the centre of the required region.

## 24. kvp — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: 110–125 kV is Bontrager (p.94). The partial bands 100–109 and 126–150 kV are an ENGINE TEACHING CHOICE (owner-approved), NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.
- جديد: 110–125 kV is Bontrager (p.94). kVp physics is never mapped to displayed darkness.

## 25. exposure-adequacy — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: VALIDATED: DI equation and digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the demo target; no numeric mAs target and no universal EIT or DI limit is claimed. A lateral is expected to need more exposure than the PA (teaching only).
- جديد: DI equation and digital-exposure concepts; no numeric mAs target and no universal EIT or DI limit is claimed. A lateral is expected to need more exposure than the PA.

## 26. dose-optimization — 14 موضعًا في 14 فحصًا
- الفحوص: ankle-ap, ankle-lateral, chest-ap-supine, chest-lateral-erect, elbow-ap, elbow-lateral, foot-ap, foot-oblique, hand-lateral, hand-pa, knee-ap, knee-lateral, wrist-lateral, wrist-pa
- قديم: VALIDATED: digital dynamic range can hide excess exposure (dose creep). PROVISIONAL: the DI bands. No patient dose is calculated.
- جديد: Digital dynamic range can hide excess exposure (dose creep). No patient dose is calculated.

## 27. aec-chambers — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: VALIDATED: the purpose of AEC. The central-chamber choice follows the EC16260 example (Bontrager is silent on AEC); the layout and factors are VENDOR / LOCAL-PROTOCOL DEPENDENT.
- جديد: The purpose of AEC. The central-chamber choice follows the EC16260 example (Bontrager is silent on AEC); the layout and factors depend on the vendor and the local protocol.

## 28. sid — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: Bontrager gives a MINIMUM of 72 in (183 cm) only. The 185 cm upper full-credit limit and the 150–200 cm partial band are ENGINE TEACHING CHOICES (owner decision 2026-10-07), NOT Bontrager; 180 cm earns full credit as the rounding of 183.
- جديد: Bontrager gives a MINIMUM of 72 in (183 cm) only. 180 cm earns full credit as the rounding of 183.

## 29. wrong-side-marker.evidence — 2 موضعًا في 2 فحصًا
- الفحوص: chest-ap-supine, chest-lateral-erect
- قديم: PROVISIONAL / educational: the gate is a simulator rule with the same severity as the PA wrong-side marker. The numeric score is unchanged.
- جديد: The gate is a simulator rule with the same severity as the PA wrong-side marker. The numeric score is unchanged.

## 30. arms-over-lungs.evidence — 1 موضعًا في 1 فحصًا
- الفحوص: chest-lateral-erect
- قديم: PROVISIONAL / educational: the gate is a simulator rule; the final list of critical findings is set by an educator. The numeric score is unchanged.
- جديد: The gate is a simulator rule. The numeric score is unchanged.

## 31. rotation — 1 موضعًا في 1 فحصًا
- الفحوص: chest-ap-supine
- قديم: Criterion = the PA's (equal spine-to-rib-border and sternoclavicular distances, p.96). The ±2° / ±5° bands are an ENGINE TEACHING CHOICE (the same numbers as the PA; Bontrager gives no angle). Magnitude only: no direction text. The sign of the value is defined by the RESULT IMAGE (positive = the spine shifts to the viewer's right in the frontal image, as for the PA); the sternal-clavicle-end rule (p.83) is the PA geometry and is not applied to the AP.
- جديد: Criterion = the PA's (equal spine-to-rib-border and sternoclavicular distances, p.96). Bontrager gives no angle. Magnitude only: no direction text. The sign of the value is defined by the RESULT IMAGE (positive = the spine shifts to the viewer's right in the frontal image, as for the PA); the sternal-clavicle-end rule (p.83) is the PA geometry and is not applied to the AP.

## 32. centering-lateral — 1 موضعًا في 1 فحصًا
- الفحوص: chest-ap-supine
- قديم: Midline alignment; tolerance values are provisional.
- جديد: Midline alignment.

## 33. angulation — 1 موضعًا في 1 فحصًا
- الفحوص: chest-ap-supine
- قديم: About 5° caudad (perpendicular to the long axis of the sternum) is Bontrager. The ±2° full-credit band and the 1–10° partial band are an ENGINE TEACHING CHOICE (not Bontrager). Feedback only: the clavicle / apex appearance is NOT drawn on the result image.
- جديد: About 5° caudad (perpendicular to the long axis of the sternum) is Bontrager. Feedback only: the clavicle / apex appearance is NOT drawn on the result image.

## 34. kvp — 1 موضعًا في 1 فحصًا
- الفحوص: chest-ap-supine
- قديم: 110–125 kV is Bontrager (p.96). The partial bands 100–109 and 126–150 kV are an ENGINE TEACHING CHOICE (owner-approved), NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.
- جديد: 110–125 kV is Bontrager (p.96). kVp physics is never mapped to displayed darkness.

## 35. exposure-adequacy — 1 موضعًا في 1 فحصًا
- الفحوص: chest-ap-supine
- قديم: VALIDATED: DI equation and digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the demo target; no numeric mAs target and no universal EIT or DI limit is claimed. A portable AP exposure is manual and recorded per image; the exposure mode itself is not scored.
- جديد: DI equation and digital-exposure concepts; no numeric mAs target and no universal EIT or DI limit is claimed. A portable AP exposure is manual and recorded per image; the exposure mode itself is not scored.

## 36. sid — 1 موضعًا في 1 فحصًا
- الفحوص: chest-ap-supine
- قديم: Bontrager gives a MINIMUM of 72 in (183 cm) where possible and asks for the SID to be marked when shorter. The 185 cm upper full-credit limit, the 150–200 cm style partial band and the 102 cm lower bound (ACR-PORTABLE conversion, not Bontrager) are ENGINE TEACHING CHOICES; 180 cm earns full credit as the rounding of 183.
- جديد: Bontrager gives a MINIMUM of 72 in (183 cm) where possible and asks for the SID to be marked when shorter. The 102 cm lower bound is an ACR-PORTABLE conversion; 180 cm earns full credit as the rounding of 183.

## 37. collimation-clipping — 2 موضعًا في 2 فحصًا
- الفحوص: wrist-lateral, wrist-pa
- قديم: The required anatomy is Bontrager's criterion; the region used is LIMITED BY THE BASELINE IMAGE (it ends at the proximal metacarpals, so the mid-metacarpal area cannot be shown,) and its size is provisional.
- جديد: The required anatomy is Bontrager's criterion; the region used is LIMITED BY THE BASELINE IMAGE (it ends at the proximal metacarpals, so the mid-metacarpal area cannot be shown,).

## 38. collimation-excess — 2 موضعًا في 2 فحصًا
- الفحوص: wrist-lateral, wrist-pa
- قديم: Principle from the textbook; the 3.5 cm margin limit is an engine teaching choice (provisional / configurable).
- جديد: Principle from the textbook. Margin limit: 3.5 cm.

## 39. motion-instruction — 12 موضعًا في 12 فحصًا
- الفحوص: ankle-ap, ankle-lateral, elbow-ap, elbow-lateral, foot-ap, foot-oblique, hand-lateral, hand-pa, knee-ap, knee-lateral, wrist-lateral, wrist-pa
- قديم: VALIDATED: motion reduces sharpness. EDUCATIONAL ASSUMPTION: that this instruction decides whether this simulated patient moves. Deliberately unscored (no rubric exists).
- جديد: Motion reduces sharpness. That this instruction decides whether this simulated patient moves is an educational assumption. Deliberately unscored (no rubric exists).

## 40. rotation — 11 موضعًا في 11 فحصًا
- الفحوص: ankle-ap, ankle-lateral, elbow-ap, elbow-lateral, foot-ap, hand-lateral, hand-pa, knee-ap, knee-lateral, wrist-lateral, wrist-pa
- قديم: The criteria are Bontrager's. The ±2° / ±5° bands are an ENGINE TEACHING CHOICE (Bontrager gives no angle). The sign of the value is defined by the RESULT IMAGE (positive = toward the viewer's right); no direction of turn is claimed. The drawn effect is an EDUCATIONAL APPROXIMATION made from one baseline image.
- جديد: The criteria are Bontrager's (Bontrager gives no angle). The sign of the value is defined by the RESULT IMAGE (positive = toward the viewer's right); no direction of turn is claimed.

## 41. centering-lateral — 12 موضعًا في 12 فحصًا
- الفحوص: ankle-ap, ankle-lateral, elbow-ap, elbow-lateral, foot-ap, foot-oblique, hand-lateral, hand-pa, knee-ap, knee-lateral, wrist-lateral, wrist-pa
- قديم: Alignment is Bontrager's; the tolerance values are an engine teaching choice (provisional).
- جديد: Alignment is Bontrager's.

## 42. centering-vertical — 2 موضعًا في 2 فحصًا
- الفحوص: wrist-lateral, wrist-pa
- قديم: The midcarpal target is Bontrager's; its position on the detector is read by eye on the baseline and the tolerances are an engine teaching choice (provisional).
- جديد: The midcarpal target is Bontrager's; its position on the detector is read by eye on the baseline.

## 43. kvp — 2 موضعًا في 2 فحصًا
- الفحوص: hand-pa, wrist-pa
- قديم: 55–65 kV is Bontrager. The partial bands 50–54 and 66–70 kV are an ENGINE TEACHING CHOICE, NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.
- جديد: 55–65 kV is Bontrager. kVp physics is never mapped to displayed darkness.

## 44. exposure-adequacy — 2 موضعًا في 2 فحصًا
- الفحوص: wrist-lateral, wrist-pa
- قديم: VALIDATED: the DI equation and the digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the manual reference point the exposure is measured against (an engine teaching constant); no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the wrist).
- جديد: The DI equation and the digital-exposure concepts; no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the wrist).

## 45. sid — 12 موضعًا في 12 فحصًا
- الفحوص: ankle-ap, ankle-lateral, elbow-ap, elbow-lateral, foot-ap, foot-oblique, hand-lateral, hand-pa, knee-ap, knee-lateral, wrist-lateral, wrist-pa
- قديم: The 102 cm minimum is Bontrager (inch-to-cm conversion). The 110 cm upper full-credit limit and the 95–130 cm partial band are ENGINE TEACHING CHOICES, NOT Bontrager.
- جديد: The 102 cm minimum is Bontrager (inch-to-cm conversion).

## 46. wrong-side-marker.evidence — 12 موضعًا في 12 فحصًا
- الفحوص: ankle-ap, ankle-lateral, elbow-ap, elbow-lateral, foot-ap, foot-oblique, hand-lateral, hand-pa, knee-ap, knee-lateral, wrist-lateral, wrist-pa
- قديم: PROVISIONAL / educational: the gate is a simulator rule (educator decision pending). The numeric score is unchanged.
- جديد: The gate is a simulator rule. The numeric score is unchanged.

## 47. missing-marker.evidence — 12 موضعًا في 12 فحصًا
- الفحوص: ankle-ap, ankle-lateral, elbow-ap, elbow-lateral, foot-ap, foot-oblique, hand-lateral, hand-pa, knee-ap, knee-lateral, wrist-lateral, wrist-pa
- قديم: PROVISIONAL / educational: the gate is a simulator rule with the same severity as the wrong-side marker. The numeric score is unchanged.
- جديد: The gate is a simulator rule with the same severity as the wrong-side marker. The numeric score is unchanged.

## 48. kvp — 4 موضعًا في 4 فحصًا
- الفحوص: foot-ap, foot-oblique, hand-lateral, wrist-lateral
- قديم: 60–70 kV is Bontrager. The partial bands 55–59 and 71–75 kV are an ENGINE TEACHING CHOICE, NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.
- جديد: 60–70 kV is Bontrager. kVp physics is never mapped to displayed darkness.

## 49. collimation-clipping — 2 موضعًا في 2 فحصًا
- الفحوص: hand-lateral, hand-pa
- قديم: The required anatomy is Bontrager's criterion. The 2.5 cm of distal forearm is Bontrager's 'about'; where the region's lower edge lies on the baseline (2.5 cm below the radiocarpal joint, read by eye) and the image scale (0.0113 cm / px) are engine estimates. Provisional.
- جديد: The required anatomy is Bontrager's criterion. The 2.5 cm of distal forearm is Bontrager's 'about'.

## 50. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: hand-pa
- قديم: Principle from the textbook; the 3.5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin is unavoidable.
- جديد: Principle from the textbook. Margin limit: 3.5 cm. The field is centred on the central ray, so a one-sided margin is unavoidable.

## 51. centering-vertical — 4 موضعًا في 4 فحصًا
- الفحوص: elbow-ap, elbow-lateral, hand-lateral, hand-pa
- قديم: The target joint is Bontrager's; its position on the detector is read by eye on the baseline and the tolerances are an engine teaching choice (provisional).
- جديد: The target joint is Bontrager's; its position on the detector is read by eye on the baseline.

## 52. exposure-adequacy — 2 موضعًا في 2 فحصًا
- الفحوص: hand-lateral, hand-pa
- قديم: VALIDATED: the DI equation and the digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the manual reference point the exposure is measured against (an engine teaching constant); no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the hand, and no hand source for the exposure appearance).
- جديد: The DI equation and the digital-exposure concepts; no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the hand, and no hand source for the exposure appearance).

## 53. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: hand-lateral
- قديم: Principle from the textbook; the 6.5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin is unavoidable.
- جديد: Principle from the textbook. Margin limit: 6.5 cm. The field is centred on the central ray, so a one-sided margin is unavoidable.

## 54. collimation-clipping — 2 موضعًا في 2 فحصًا
- الفحوص: elbow-ap, elbow-lateral
- قديم: The required anatomy is Bontrager's criterion. How far it extends along the arm (about 7 cm of humerus and 6–7 cm of forearm around the target), where the region lies on the baseline and the image scale (0.0155 cm / px) are engine estimates read by eye. Provisional.
- جديد: The required anatomy is Bontrager's criterion.

## 55. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: elbow-ap
- قديم: Principle from the textbook; the 3 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable.
- جديد: Principle from the textbook. Margin limit: 3 cm. The field is centred on the central ray, so a one-sided margin can be unavoidable.

## 56. kvp — 4 موضعًا في 4 فحصًا
- الفحوص: ankle-ap, ankle-lateral, elbow-ap, elbow-lateral
- قديم: 65–75 kV is Bontrager. The partial bands 60–64 and 76–80 kV are an ENGINE TEACHING CHOICE, NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.
- جديد: 65–75 kV is Bontrager. kVp physics is never mapped to displayed darkness.

## 57. exposure-adequacy — 2 موضعًا في 2 فحصًا
- الفحوص: elbow-ap, elbow-lateral
- قديم: VALIDATED: the DI equation and the digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the manual reference point the exposure is measured against (an engine teaching constant); no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the elbow, and no hand source for the exposure appearance).
- جديد: The DI equation and the digital-exposure concepts; no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the elbow, and no hand source for the exposure appearance).

## 58. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: elbow-lateral
- قديم: Principle from the textbook; the 4.5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable.
- جديد: Principle from the textbook. Margin limit: 4.5 cm. The field is centred on the central ray, so a one-sided margin can be unavoidable.

## 59. collimation-clipping — 6 موضعًا في 6 فحصًا
- الفحوص: ankle-ap, ankle-lateral, foot-ap, foot-oblique, knee-ap, knee-lateral
- قديم: The required anatomy is Bontrager's criterion. How far it extends, where the region lies on the baseline and the image scale are engine estimates read by eye. Provisional.
- جديد: The required anatomy is Bontrager's criterion.

## 60. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: foot-ap
- قديم: Principle from the textbook; the 6.5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable (-like).
- جديد: Principle from the textbook. Margin limit: 6.5 cm. The field is centred on the central ray, so a one-sided margin can be unavoidable.

## 61. centering-vertical — 6 موضعًا في 6 فحصًا
- الفحوص: ankle-ap, ankle-lateral, foot-ap, foot-oblique, knee-ap, knee-lateral
- قديم: The target is Bontrager's; its position on the detector is read by eye on the baseline and the tolerances are an engine teaching choice (provisional).
- جديد: The target is Bontrager's; its position on the detector is read by eye on the baseline.

## 62. angulation — 1 موضعًا في 1 فحصًا
- الفحوص: foot-ap
- قديم: About 10° toward the heel (about 15° for a high arch, about 5° for a low arch, no angle for a foreign body) is Bontrager; toward the heel = cephalad = negative on the control. The 5°–15° partial band is an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.
- جديد: About 10° toward the heel (about 15° for a high arch, about 5° for a low arch, no angle for a foreign body) is Bontrager; toward the heel = cephalad = negative on the control. Feedback only: the tube angle is NOT drawn on the result image.

## 63. exposure-adequacy — 6 موضعًا في 6 فحصًا
- الفحوص: ankle-ap, ankle-lateral, foot-ap, foot-oblique, knee-ap, knee-lateral
- قديم: VALIDATED: the DI equation and the digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the manual reference point the exposure is measured against (an engine teaching constant); no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the lower limb, and no source for the exposure appearance).
- جديد: The DI equation and the digital-exposure concepts; no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the lower limb, and no source for the exposure appearance).

## 64. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: foot-oblique
- قديم: Principle from the textbook; the 7.5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable (-like).
- جديد: Principle from the textbook. Margin limit: 7.5 cm. The field is centred on the central ray, so a one-sided margin can be unavoidable.

## 65. rotation — 1 موضعًا في 1 فحصًا
- الفحوص: foot-oblique
- قديم: The plantar angle 30°–40° (40° recommended) and the criteria are Bontrager's; the 25°–45° partial band is an ENGINE TEACHING CHOICE. The console value is the absolute angle; the picture's own obliquity is unmeasured, so the drawn effect (a displacement of the metatarsal and toe columns by the deviation from 40°) is an EDUCATIONAL APPROXIMATION made from one baseline image.
- جديد: The plantar angle 30°–40° (40° recommended) and the criteria are Bontrager's. The console value is the absolute angle; the picture's own obliquity is unmeasured.

## 66. angulation — 1 موضعًا في 1 فحصًا
- الفحوص: foot-oblique
- قديم: CR perpendicular to the detector is Bontrager. The ±2° full-credit and ±5° partial-credit bands are an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.
- جديد: CR perpendicular to the detector is Bontrager. Feedback only: the tube angle is NOT drawn on the result image.

## 67. collimation-excess — 2 موضعًا في 2 فحصًا
- الفحوص: knee-ap, knee-lateral
- قديم: Principle from the textbook; the 3.5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable (-like).
- جديد: Principle from the textbook. Margin limit: 3.5 cm. The field is centred on the central ray, so a one-sided margin can be unavoidable.

## 68. angulation — 1 موضعًا في 1 فحصًا
- الفحوص: knee-ap
- قديم: Perpendicular for an average patient (ASIS-to-table 19–24 cm; 3–5° caudad below 19 cm, cephalad above 24 cm) is Bontrager. The ±2° full-credit and ±5° partial-credit bands are an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.
- جديد: Perpendicular for an average patient (ASIS-to-table 19–24 cm; 3–5° caudad below 19 cm, cephalad above 24 cm) is Bontrager. Feedback only: the tube angle is NOT drawn on the result image.

## 69. kvp — 2 موضعًا في 2 فحصًا
- الفحوص: knee-ap, knee-lateral
- قديم: 70–80 kV is Bontrager. The partial bands 65–69 and 81–85 kV are an ENGINE TEACHING CHOICE, NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.
- جديد: 70–80 kV is Bontrager. kVp physics is never mapped to displayed darkness.

## 70. angulation — 1 موضعًا في 1 فحصًا
- الفحوص: knee-lateral
- قديم: 5°–7° cephalad (7–10° for a short patient with a wide pelvis, about 5° for a tall male with a narrow pelvis, perpendicular if the lower leg can be raised to the femur's plane) is Bontrager. The 3°–10° partial band is an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.
- جديد: 5°–7° cephalad (7–10° for a short patient with a wide pelvis, about 5° for a tall male with a narrow pelvis, perpendicular if the lower leg can be raised to the femur's plane) is Bontrager. Feedback only: the tube angle is NOT drawn on the result image.

## 71. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: ankle-ap
- قديم: Principle from the textbook; the 5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable (-like).
- جديد: Principle from the textbook. Margin limit: 5 cm. The field is centred on the central ray, so a one-sided margin can be unavoidable.

## 72. collimation-excess — 1 موضعًا في 1 فحصًا
- الفحوص: ankle-lateral
- قديم: Principle from the textbook; the 4.5 cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable (-like).
- جديد: Principle from the textbook. Margin limit: 4.5 cm. The field is centred on the central ray, so a one-sided margin can be unavoidable.

## 73. angulation, centering-lateral, centering-vertical, collimation-clipping — 16 موضعًا في 1 فحصًا
- الفحوص: pelvis-ap-supine
- قديم: Clinical facts common-reference, provisional pending. Numerical tolerances, weights and geometry are explicitly educational choices.
- جديد: Clinical facts: common reference.

## 74. angulation, centering-lateral, centering-vertical, collimation-clipping — 16 موضعًا في 1 فحصًا
- الفحوص: shoulder-grashey-erect
- قديم: Clinical facts common-reference, provisional pending. Numerical tolerances, weights, scale and region are explicitly educational choices.
- جديد: Clinical facts: common reference.
