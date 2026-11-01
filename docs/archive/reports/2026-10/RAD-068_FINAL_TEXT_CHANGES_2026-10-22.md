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

# الجولة الثانية (قرارات المالك 2026-10-23، §7)

النصوص المعروضة التي تغيّرت: 199 زوجًا فريدًا من 422 موضعًا (EN وAR؛ المواضع بصيغة case:اسم-الفحص أو en:/ar: للرسائل). الملاحظات بعد إزالة الرموز الداخلية.

## ب1. 3 موضعًا في 3 فحصًا — مثال: rules[15].evidence.note
- قديم: Patient or respiratory motion reduces sharpness (principle). That this instruction decides whether this simulated patient moves is an educational assumption. Caps the breathing category at the engine's partial credit when the instruction is missing (owner 2026-10-22); no instruction-quality rubric is claimed.
- جديد: Patient or respiratory motion reduces sharpness (principle). Caps the breathing category at the engine's partial credit when the instruction is missing (owner 2026-10-22); no instruction-quality rubric is claimed.

## ب2. 3 موضعًا في 3 فحصًا — مثال: scoring.criticalFindings[0].evidence.note
- قديم: Forcing the pass mark below the threshold is a simulator rule, not a real-world automatic reject decision. The numeric score is unchanged.
- جديد: The numeric score is unchanged.

## ب3. 3 موضعًا في 3 فحصًا — مثال: scoring.criticalFindings[1].concept.note
- قديم: COMMON QUALITY CRITERION: patient / respiratory motion reduces sharpness. That this simulated patient moves is an educational assumption of the patient-cooperation profile.
- جديد: COMMON QUALITY CRITERION: patient / respiratory motion reduces sharpness.

## ب4. 3 موضعًا في 3 فحصًا — مثال: scoring.criticalFindings[1].evidence.note
- قديم: The gate is a simulator rule; no blur size or motion distance is claimed. The numeric score is unchanged.
- جديد: No blur size or motion distance is claimed. The numeric score is unchanged.

## ب5. 15 موضعًا في 15 فحصًا — مثال: scoring.criticalFindings[3].evidence.note
- قديم: The gate is a simulator rule with the same severity as the wrong-side marker. The numeric score is unchanged.
- جديد: Same severity as the wrong-side marker. The numeric score is unchanged.

## ب6. 2 موضعًا في 2 فحصًا — مثال: rules[10].feedback.low.en
- قديم: kVp is below the target band. A less penetrating beam is absorbed more by the heart and the spine, so lung markings behind them are harder to see. Extra mAs adds photons, not penetration. (Only 110–125 kV is the textbook band; the 100–109 and 126–150 kV partial credit is an engine teaching choice.)
- جديد: kVp is below the target band. A less penetrating beam is absorbed more by the heart and the spine, so lung markings behind them are harder to see. Extra mAs adds photons, not penetration. (Only 110–125 kV is the textbook band; 100–109 and 126–150 kV earns partial credit.)

## ب7. 2 موضعًا في 2 فحصًا — مثال: rules[10].feedback.low.ar
- قديم: قيمة kVp أقل من النطاق المستهدف. الحزمة الأقل اختراقًا تمتصها البنى الكثيفة أكثر (القلب والعمود الفقري) فيصعب رؤية العلامات الرئوية خلفها. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق في الكتاب هو 110–125 kV فقط؛ أما الدرجة الجزئية لـ 100–109 و126–150 kV فهي اختيار تعليمي في المحاكي.)
- جديد: قيمة kVp أقل من النطاق المستهدف. الحزمة الأقل اختراقًا تمتصها البنى الكثيفة أكثر (القلب والعمود الفقري) فيصعب رؤية العلامات الرئوية خلفها. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق في الكتاب هو 110–125 kV فقط؛ وتُمنح درجة جزئية لـ 100–109 و126–150 kV.)

## ب8. 2 موضعًا في 2 فحصًا — مثال: rules[10].feedback.high.en
- قديم: kVp is above the target band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 110–125 kV is the textbook band; the 126–150 kV partial credit is an engine teaching choice.)
- جديد: kVp is above the target band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 110–125 kV is the textbook band; 126–150 kV earns partial credit.)

## ب9. 2 موضعًا في 2 فحصًا — مثال: rules[10].feedback.high.ar
- قديم: قيمة kVp أعلى من النطاق المستهدف. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق في الكتاب هو 110–125 kV فقط؛ أما الدرجة الجزئية لـ 126–150 kV فهي اختيار تعليمي.)
- جديد: قيمة kVp أعلى من النطاق المستهدف. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق في الكتاب هو 110–125 kV فقط؛ وتُمنح درجة جزئية لـ 126–150 kV.)

## ب10. 1 موضعًا في 1 فحصًا — مثال: rules[14].feedback.high.en
- قديم: SID is longer than this simulator's teaching band; exposure at the detector drops (inverse-square), so in manual mode the technique would need adjusting. An AEC compensates in the educational model. (The textbook gives only a minimum; the upper limit is an engine teaching choice.)
- جديد: SID is longer than this simulator's teaching band; exposure at the detector drops (inverse-square), so in manual mode the technique would need adjusting. An AEC compensates in the educational model. (The textbook gives only a minimum.)

## ب11. 1 موضعًا في 1 فحصًا — مثال: rules[14].feedback.high.ar
- قديم: قيمة SID أطول من النطاق التعليمي في المحاكي؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. ويعوّض AEC ذلك في النموذج التعليمي. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى اختيار تعليمي في المحاكي.)
- جديد: قيمة SID أطول من النطاق التعليمي في المحاكي؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. ويعوّض AEC ذلك في النموذج التعليمي. (الكتاب يذكر حدًا أدنى فقط.)

## ب12. 2 موضعًا في 2 فحصًا — مثال: scoring.criticalFindings[2].evidence.note
- قديم: The gate is a simulator rule with the same severity as the PA wrong-side marker. The numeric score is unchanged.
- جديد: Same severity as the PA wrong-side marker. The numeric score is unchanged.

## ب13. 13 موضعًا في 13 فحصًا — مثال: scoring.criticalFindings[4].evidence.note
- قديم: The gate is a simulator rule. The numeric score is unchanged.
- جديد: The numeric score is unchanged.

## ب14. 1 موضعًا في 1 فحصًا — مثال: rules[13].feedback.high.en
- قديم: SID is longer than this simulator's teaching band; exposure at the detector drops (inverse-square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum; the upper limit is an engine teaching choice.)
- جديد: SID is longer than this simulator's teaching band; exposure at the detector drops (inverse-square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum.)

## ب15. 1 موضعًا في 1 فحصًا — مثال: rules[13].feedback.high.ar
- قديم: قيمة SID أطول من النطاق التعليمي في المحاكي؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى اختيار تعليمي في المحاكي.)
- جديد: قيمة SID أطول من النطاق التعليمي في المحاكي؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط.)

## ب16. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 55–65 kV (Bontrager, digital, p.156); partial credit 50–70 kV is an engine teaching choice.
- جديد: Full credit inside 55–65 kV (Bontrager, digital, p.156); partial credit within 50–70 kV.

## ب17. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎55–65‎ kV (Bontrager، رقمي، ص.156)؛ والدرجة الجزئية ضمن ‎50–70‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎55–65‎ kV (Bontrager، رقمي، ص.156)؛ والدرجة الجزئية ضمن ‎50–70‎ kV.

## ب18. 2 موضعًا في 2 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the wrist and hand, without cutting off the required anatomy. (The 3.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the wrist and hand, without cutting off the required anatomy. (Margin limit: 3.5 cm; the field must still include the marker.)

## ب19. 2 موضعًا في 2 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الرسغ واليد دون أن تقطع التشريح المطلوب. (حدّ الهامش 3.5 سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الرسغ واليد دون أن تقطع التشريح المطلوب. (حدّ الهامش 3.5 سم؛ ويجب أن يشمل المجال العلامة.)

## ب20. 12 موضعًا في 12 فحصًا — مثال: rules[4].evidence.note
- قديم: Motion reduces sharpness. That this instruction decides whether this simulated patient moves is an educational assumption. Deliberately unscored (no rubric exists).
- جديد: Motion reduces sharpness. Deliberately unscored (no rubric exists).

## ب21. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The wrist is rotated. The spaces between the proximal metacarpals are unequal and the ulna moves over the radius, so the distal radius and ulna are no longer separated (Bontrager p.156). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The wrist is rotated. The spaces between the proximal metacarpals are unequal and the ulna moves over the radius, so the distal radius and ulna are no longer separated (Bontrager p.156). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). Full credit within ±2°, partial credit within ±5°.

## ب22. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: الرسغ مائل (دوران). أصبحت المسافات بين قواعد عظام مشط اليد غير متساوية وتحرك الزند فوق الكعبرة، فلم تعد النهايتان البعيدتان للكعبرة والزند منفصلتين (Bontrager ص.156). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: الرسغ مائل (دوران). أصبحت المسافات بين قواعد عظام مشط اليد غير متساوية وتحرك الزند فوق الكعبرة، فلم تعد النهايتان البعيدتان للكعبرة والزند منفصلتين (Bontrager ص.156). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب23. 2 موضعًا في 2 فحصًا — مثال: rules[8].feedback.low.en
- قديم: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 55–65 kV is the textbook digital band; the partial credit between 50 and 54 kV is an engine teaching choice.)
- جديد: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 55–65 kV is the textbook digital band; 50–54 kV earns partial credit.)

## ب24. 2 موضعًا في 2 فحصًا — مثال: rules[8].feedback.low.ar
- قديم: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎55–65‎ kV فقط؛ أما الدرجة الجزئية بين ‎50‎ و‎54‎ kV فهي اختيار تعليمي في المحاكي.)
- جديد: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎55–65‎ kV فقط؛ وتُمنح درجة جزئية بين ‎50‎ و‎54‎ kV.)

## ب25. 2 موضعًا في 2 فحصًا — مثال: rules[8].feedback.high.en
- قديم: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 55–65 kV is the textbook digital band; the partial credit up to 70 kV is an engine teaching choice.)
- جديد: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 55–65 kV is the textbook digital band; partial credit applies up to 70 kV.)

## ب26. 2 موضعًا في 2 فحصًا — مثال: rules[8].feedback.high.ar
- قديم: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎55–65‎ kV فقط؛ أما الدرجة الجزئية حتى ‎70‎ kV فهي اختيار تعليمي.)
- جديد: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎55–65‎ kV فقط؛ وتُمنح درجة جزئية حتى ‎70‎ kV.)

## ب27. 12 موضعًا في 12 فحصًا — مثال: rules[11].feedback.high.en
- قديم: SID is longer than this simulator's teaching band (102–110 cm); exposure at the detector drops (inverse square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum; the upper limit and the partial band are engine teaching choices.)
- جديد: SID is longer than this simulator's teaching band (102–110 cm); exposure at the detector drops (inverse square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum.)

## ب28. 12 موضعًا في 12 فحصًا — مثال: rules[11].feedback.high.ar
- قديم: قيمة SID أطول من النطاق التعليمي في المحاكي (102–110 سم)؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى والنطاق الجزئي اختياران تعليميان في المحاكي.)
- جديد: قيمة SID أطول من النطاق التعليمي في المحاكي (102–110 سم)؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط.)

## ب29. 12 موضعًا في 12 فحصًا — مثال: scoring.criticalFindings[0].evidence.note
- قديم: Educational simulator rule: choosing a projection other than the requested one is scored by the projection check and now also gates the pass mark. The result image of a projection that is not simulated is labelled, not drawn. The numeric score is unchanged.
- جديد: Choosing a projection other than the requested one is scored by the projection check and also affects the pass mark. The result image of a projection that is not simulated is labelled, not drawn. The numeric score is unchanged.

## ب30. 14 موضعًا في 14 فحصًا — مثال: scoring.criticalFindings[1].concept.note
- قديم: COMMON QUALITY CRITERION: patient motion reduces sharpness. That this simulated patient moves after an instruction to move is an educational assumption of the patient-cooperation profile.
- جديد: COMMON QUALITY CRITERION: patient motion reduces sharpness.

## ب31. 14 موضعًا في 14 فحصًا — مثال: scoring.criticalFindings[1].evidence.note
- قديم: Educational simulator rule, the same as the chest exams': an instruction to move gates the pass mark; a missing 'stay still' instruction alone does not. No blur size is claimed. The numeric score is unchanged.
- جديد: An instruction to move affects the pass mark; a missing 'stay still' instruction alone does not. No blur size is claimed. The numeric score is unchanged.

## ب32. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 60–70 kV (Bontrager, digital, p.158); partial credit 55–75 kV is an engine teaching choice.
- جديد: Full credit inside 60–70 kV (Bontrager, digital, p.158); partial credit within 55–75 kV.

## ب33. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.158)؛ والدرجة الجزئية ضمن ‎55–75‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.158)؛ والدرجة الجزئية ضمن ‎55–75‎ kV.

## ب34. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The wrist is rotated: the ulnar head is no longer over the distal radius and the proximal metacarpals are no longer superimposed (Bontrager p.158). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The wrist is rotated: the ulnar head is no longer over the distal radius and the proximal metacarpals are no longer superimposed (Bontrager p.158). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). Full credit within ±2°, partial credit within ±5°.

## ب35. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: الرسغ مائل (دوران): لم يعد رأس الزند فوق النهاية البعيدة للكعبرة ولم تعد قواعد عظام مشط اليد متراكبة (Bontrager ص.158). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: الرسغ مائل (دوران): لم يعد رأس الزند فوق النهاية البعيدة للكعبرة ولم تعد قواعد عظام مشط اليد متراكبة (Bontrager ص.158). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب36. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.low.en
- قديم: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 60–70 kV is the textbook digital band; the partial credit between 55 and 59 kV is an engine teaching choice.)
- جديد: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 60–70 kV is the textbook digital band; 55–59 kV earns partial credit.)

## ب37. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.low.ar
- قديم: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎60–70‎ kV فقط؛ أما الدرجة الجزئية بين ‎55‎ و‎59‎ kV فهي اختيار تعليمي في المحاكي.)
- جديد: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎60–70‎ kV فقط؛ وتُمنح درجة جزئية بين ‎55‎ و‎59‎ kV.)

## ب38. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.high.en
- قديم: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 60–70 kV is the textbook digital band; the partial credit up to 75 kV is an engine teaching choice.)
- جديد: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 60–70 kV is the textbook digital band; partial credit applies up to 75 kV.)

## ب39. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.high.ar
- قديم: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎60–70‎ kV فقط؛ أما الدرجة الجزئية حتى ‎75‎ kV فهي اختيار تعليمي.)
- جديد: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎60–70‎ kV فقط؛ وتُمنح درجة جزئية حتى ‎75‎ kV.)

## ب40. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 55–65 kV (Bontrager, digital, p.150); partial credit 50–70 kV is an engine teaching choice.
- جديد: Full credit inside 55–65 kV (Bontrager, digital, p.150); partial credit within 50–70 kV.

## ب41. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎55–65‎ kV (Bontrager، رقمي، ص.150)؛ والدرجة الجزئية ضمن ‎50–70‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎55–65‎ kV (Bontrager، رقمي، ص.150)؛ والدرجة الجزئية ضمن ‎50–70‎ kV.

## ب42. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the hand, without cutting off the required anatomy. (The 3.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the hand, without cutting off the required anatomy. (Margin limit: 3.5 cm; the field must still include the marker.)

## ب43. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من اليد دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎3.5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من اليد دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎3.5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب44. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The hand is rotated. The spaces between the metacarpal shafts and the digits are unequal and the soft tissue on the two sides of the phalanges is no longer equal (Bontrager p.150). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the hand). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The hand is rotated. The spaces between the metacarpal shafts and the digits are unequal and the soft tissue on the two sides of the phalanges is no longer equal (Bontrager p.150). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the hand). Full credit within ±2°, partial credit within ±5°.

## ب45. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: اليد مائلة (دوران). أصبحت المسافات بين أجسام عظام مشط اليد وبين الأصابع غير متساوية ولم تعد الأنسجة الرخوة على جانبي السلاميات متساوية (Bontrager ص.150). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه لليد). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: اليد مائلة (دوران). أصبحت المسافات بين أجسام عظام مشط اليد وبين الأصابع غير متساوية ولم تعد الأنسجة الرخوة على جانبي السلاميات متساوية (Bontrager ص.150). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه لليد). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب46. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 60–70 kV (Bontrager, digital, p.153); partial credit 55–75 kV is an engine teaching choice.
- جديد: Full credit inside 60–70 kV (Bontrager, digital, p.153); partial credit within 55–75 kV.

## ب47. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.153)؛ والدرجة الجزئية ضمن ‎55–75‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.153)؛ والدرجة الجزئية ضمن ‎55–75‎ kV.

## ب48. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the hand, without cutting off the required anatomy. (The 6.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the hand, without cutting off the required anatomy. (Margin limit: 6.5 cm; the field must still include the marker.)

## ب49. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من اليد دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎6.5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من اليد دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎6.5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب50. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The hand is rotated: the metacarpals and phalanges are no longer superimposed and the distal radius and ulna are no longer superimposed (Bontrager p.153). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the hand). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The hand is rotated: the metacarpals and phalanges are no longer superimposed and the distal radius and ulna are no longer superimposed (Bontrager p.153). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the hand). Full credit within ±2°, partial credit within ±5°.

## ب51. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: اليد مائلة (دوران): لم تعد عظام مشط اليد والسلاميات متراكبة ولم تعد النهايتان البعيدتان للكعبرة والزند متراكبتين (Bontrager ص.153). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه لليد). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: اليد مائلة (دوران): لم تعد عظام مشط اليد والسلاميات متراكبة ولم تعد النهايتان البعيدتان للكعبرة والزند متراكبتين (Bontrager ص.153). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه لليد). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب52. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 65–75 kV (Bontrager, digital, p.166); partial credit 60–80 kV is an engine teaching choice.
- جديد: Full credit inside 65–75 kV (Bontrager, digital, p.166); partial credit within 60–80 kV.

## ب53. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.166)؛ والدرجة الجزئية ضمن ‎60–80‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.166)؛ والدرجة الجزئية ضمن ‎60–80‎ kV.

## ب54. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the elbow, without cutting off the required anatomy. (The 3 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the elbow, without cutting off the required anatomy. (Margin limit: 3 cm; the field must still include the marker.)

## ب55. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من المرفق دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎3‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من المرفق دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎3‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب56. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The elbow is rotated: the epicondyles are no longer in profile and the radial head, neck and tubercle are no longer separated from the ulna (Bontrager p.166). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The elbow is rotated: the epicondyles are no longer in profile and the radial head, neck and tubercle are no longer separated from the ulna (Bontrager p.166). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). Full credit within ±2°, partial credit within ±5°.

## ب57. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: المرفق مائل (دوران): لم تعد اللقيمتان في وضع جانبي (بروفايل) ولم يعد رأس الكعبرة وعنقها وحدبتها منفصلة عن الزند (Bontrager ص.166). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: المرفق مائل (دوران): لم تعد اللقيمتان في وضع جانبي (بروفايل) ولم يعد رأس الكعبرة وعنقها وحدبتها منفصلة عن الزند (Bontrager ص.166). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب58. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.low.en
- قديم: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 65–75 kV is the textbook digital band; the partial credit between 60 and 64 kV is an engine teaching choice.)
- جديد: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 65–75 kV is the textbook digital band; 60–64 kV earns partial credit.)

## ب59. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.low.ar
- قديم: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎65–75‎ kV فقط؛ أما الدرجة الجزئية بين ‎60‎ و‎64‎ kV فهي اختيار تعليمي في المحاكي.)
- جديد: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎65–75‎ kV فقط؛ وتُمنح درجة جزئية بين ‎60‎ و‎64‎ kV.)

## ب60. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.high.en
- قديم: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 65–75 kV is the textbook digital band; the partial credit up to 80 kV is an engine teaching choice.)
- جديد: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 65–75 kV is the textbook digital band; partial credit applies up to 80 kV.)

## ب61. 4 موضعًا في 4 فحصًا — مثال: rules[8].feedback.high.ar
- قديم: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎65–75‎ kV فقط؛ أما الدرجة الجزئية حتى ‎80‎ kV فهي اختيار تعليمي.)
- جديد: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎65–75‎ kV فقط؛ وتُمنح درجة جزئية حتى ‎80‎ kV.)

## ب62. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 65–75 kV (Bontrager, digital, p.172); partial credit 60–80 kV is an engine teaching choice.
- جديد: Full credit inside 65–75 kV (Bontrager, digital, p.172); partial credit within 60–80 kV.

## ب63. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.172)؛ والدرجة الجزئية ضمن ‎60–80‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.172)؛ والدرجة الجزئية ضمن ‎60–80‎ kV.

## ب64. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the elbow, without cutting off the required anatomy. (The 4.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the elbow, without cutting off the required anatomy. (Margin limit: 4.5 cm; the field must still include the marker.)

## ب65. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من المرفق دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎4.5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من المرفق دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎4.5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب66. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The elbow is rotated: the condyle outlines and epicondyles are no longer superimposed and the radial head is no longer about half covered by the coronoid process (Bontrager p.172). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The elbow is rotated: the condyle outlines and epicondyles are no longer superimposed and the radial head is no longer about half covered by the coronoid process (Bontrager p.172). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). Full credit within ±2°, partial credit within ±5°.

## ب67. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: المرفق مائل (دوران): لم تعد حدود اللقمتين ونتوءاهما متراكبة ولم يعد نحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي (Bontrager ص.172). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: المرفق مائل (دوران): لم تعد حدود اللقمتين ونتوءاهما متراكبة ولم يعد نحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي (Bontrager ص.172). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب68. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 60–70 kV (Bontrager, digital, p.232); partial credit 55–75 kV is an engine teaching choice.
- جديد: Full credit inside 60–70 kV (Bontrager, digital, p.232); partial credit within 55–75 kV.

## ب69. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.232)؛ والدرجة الجزئية ضمن ‎55–75‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.232)؛ والدرجة الجزئية ضمن ‎55–75‎ kV.

## ب70. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the foot, without cutting off the required anatomy. (The 6.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the foot, without cutting off the required anatomy. (Margin limit: 6.5 cm; the field must still include the marker.)

## ب71. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من القدم دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎6.5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من القدم دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎6.5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب72. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The foot is rotated: the spacing of metatarsals 2–5 is no longer nearly equal (Bontrager p.232). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule or tolerance). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The foot is rotated: the spacing of metatarsals 2–5 is no longer nearly equal (Bontrager p.232). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule or tolerance). Full credit within ±2°, partial credit within ±5°.

## ب73. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: القدم مائلة (دوران): لم تعد المسافات بين مشط القدم 2–5 متقاربة تقريبًا (Bontrager ص.232). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه ولا حدًّا). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: القدم مائلة (دوران): لم تعد المسافات بين مشط القدم 2–5 متقاربة تقريبًا (Bontrager ص.232). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه ولا حدًّا). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب74. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.low.en
- قديم: More than about 10° toward the heel. Bontrager gives about 15° only for a high arch; this foot has an average arch. (The 5°–15° partial-credit band is an engine teaching choice.)
- جديد: More than about 10° toward the heel. Bontrager gives about 15° only for a high arch; this foot has an average arch. (Partial credit applies within 5°–15°.)

## ب75. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.low.ar
- قديم: أكثر من نحو 10° باتجاه العقب. يذكر Bontrager نحو 15° لقوس عالٍ فقط؛ وهذه القدم ذات قوس متوسط. (نطاق الدرجة الجزئية 5°–15° اختيار تعليمي في المحاكي.)
- جديد: أكثر من نحو 10° باتجاه العقب. يذكر Bontrager نحو 15° لقوس عالٍ فقط؛ وهذه القدم ذات قوس متوسط. (وتُمنح درجة جزئية ضمن 5°–15°.)

## ب76. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.high.en
- قديم: Less than about 10° toward the heel (or angled toward the toes). The beam is not perpendicular to the metatarsals; Bontrager angles it about 10° toward the heel for an average arch. (The 5°–15° partial-credit band is an engine teaching choice.)
- جديد: Less than about 10° toward the heel (or angled toward the toes). The beam is not perpendicular to the metatarsals; Bontrager angles it about 10° toward the heel for an average arch. (Partial credit applies within 5°–15°.)

## ب77. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.high.ar
- قديم: أقل من نحو 10° باتجاه العقب (أو مائل نحو الأصابع). الشعاع ليس عموديًا على عظام مشط القدم؛ يميله Bontrager نحو 10° باتجاه العقب لقوس متوسط. (نطاق الدرجة الجزئية 5°–15° اختيار تعليمي في المحاكي.)
- جديد: أقل من نحو 10° باتجاه العقب (أو مائل نحو الأصابع). الشعاع ليس عموديًا على عظام مشط القدم؛ يميله Bontrager نحو 10° باتجاه العقب لقوس متوسط. (وتُمنح درجة جزئية ضمن 5°–15°.)

## ب78. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 60–70 kV (Bontrager, digital, p.233); partial credit 55–75 kV is an engine teaching choice.
- جديد: Full credit inside 60–70 kV (Bontrager, digital, p.233); partial credit within 55–75 kV.

## ب79. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.233)؛ والدرجة الجزئية ضمن ‎55–75‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎60–70‎ kV (Bontrager، رقمي، ص.233)؛ والدرجة الجزئية ضمن ‎55–75‎ kV.

## ب80. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the foot, without cutting off the required anatomy. (The 7.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the foot, without cutting off the required anatomy. (Margin limit: 7.5 cm; the field must still include the marker.)

## ب81. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من القدم دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎7.5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من القدم دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎7.5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب82. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The plantar surface is outside the 30°–40° Bontrager gives (p.233), so metatarsals 3–5 are not free of superimposition as required. The 25°–45° partial-credit band is an engine teaching choice.
- جديد: The plantar surface is outside the 30°–40° Bontrager gives (p.233), so metatarsals 3–5 are not free of superimposition as required. Partial credit applies within 25°–45°.

## ب83. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: الأخمص خارج الزاوية 30°–40° التي يذكرها Bontrager (ص.233) فلا تكون عظام مشط القدم 3–5 غير متراكبة كما هو مطلوب. نطاق الدرجة الجزئية 25°–45° اختيار تعليمي في المحاكي.
- جديد: الأخمص خارج الزاوية 30°–40° التي يذكرها Bontrager (ص.233) فلا تكون عظام مشط القدم 3–5 غير متراكبة كما هو مطلوب. وتُمنح درجة جزئية ضمن 25°–45°.

## ب84. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.low.en
- قديم: The foot is turned less than the 30°–40° Bontrager gives (p.233): the plantar surface is too close to the detector. Turn the foot further medially (40° is recommended). The 25°–45° partial-credit band is an engine teaching choice.
- جديد: The foot is turned less than the 30°–40° Bontrager gives (p.233): the plantar surface is too close to the detector. Turn the foot further medially (40° is recommended). Partial credit applies within 25°–45°.

## ب85. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.low.ar
- قديم: القدم مدارة أقل من 30°–40° التي يذكرها Bontrager (ص.233): الأخمص قريب جدًّا من الكاشف. أدِر القدم إنسيًّا أكثر (يوصى بـ40°). نطاق الدرجة الجزئية 25°–45° اختيار تعليمي في المحاكي.
- جديد: القدم مدارة أقل من 30°–40° التي يذكرها Bontrager (ص.233): الأخمص قريب جدًّا من الكاشف. أدِر القدم إنسيًّا أكثر (يوصى بـ40°). وتُمنح درجة جزئية ضمن 25°–45°.

## ب86. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.high.en
- قديم: The foot is turned more than the 30°–40° Bontrager gives (p.233). Turn the foot back toward 40°. The 25°–45° partial-credit band is an engine teaching choice.
- جديد: The foot is turned more than the 30°–40° Bontrager gives (p.233). Turn the foot back toward 40°. Partial credit applies within 25°–45°.

## ب87. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.high.ar
- قديم: القدم مدارة أكثر من 30°–40° التي يذكرها Bontrager (ص.233). أعد القدم نحو 40°. نطاق الدرجة الجزئية 25°–45° اختيار تعليمي في المحاكي.
- جديد: القدم مدارة أكثر من 30°–40° التي يذكرها Bontrager (ص.233). أعد القدم نحو 40°. وتُمنح درجة جزئية ضمن 25°–45°.

## ب88. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 70–80 kV (Bontrager, digital, p.246); partial credit 65–85 kV is an engine teaching choice.
- جديد: Full credit inside 70–80 kV (Bontrager, digital, p.246); partial credit within 65–85 kV.

## ب89. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎70–80‎ kV (Bontrager، رقمي، ص.246)؛ والدرجة الجزئية ضمن ‎65–85‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎70–80‎ kV (Bontrager، رقمي، ص.246)؛ والدرجة الجزئية ضمن ‎65–85‎ kV.

## ب90. 2 موضعًا في 2 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the knee, without cutting off the required anatomy. (The 3.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the knee, without cutting off the required anatomy. (Margin limit: 3.5 cm; the field must still include the marker.)

## ب91. 2 موضعًا في 2 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الركبة دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎3.5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الركبة دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎3.5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب92. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The leg is rotated: the condyles and the joint space are no longer symmetric and the fibular head is covered by the tibia more or less than about half (Bontrager p.246). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule or tolerance). Value 0 = the interepicondylar line parallel to the detector (Bontrager rotates the leg internally 3°–5° to achieve this). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The leg is rotated: the condyles and the joint space are no longer symmetric and the fibular head is covered by the tibia more or less than about half (Bontrager p.246). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule or tolerance). Value 0 = the interepicondylar line parallel to the detector (Bontrager rotates the leg internally 3°–5° to achieve this). Full credit within ±2°, partial credit within ±5°.

## ب93. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: الساق مائلة (دوران): لم تعد اللقمتان وحيز المفصل متناظرين وأصبح رأس الشظية مغطى بالظنبوب بأكثر أو بأقل من نحو النصف (Bontrager ص.246). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه ولا حدًّا). القيمة 0 = الخط بين اللقمتين موازٍ للكاشف (يدير Bontrager الساق إنسيًّا 3°–5° لتحقيق ذلك). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: الساق مائلة (دوران): لم تعد اللقمتان وحيز المفصل متناظرين وأصبح رأس الشظية مغطى بالظنبوب بأكثر أو بأقل من نحو النصف (Bontrager ص.246). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه ولا حدًّا). القيمة 0 = الخط بين اللقمتين موازٍ للكاشف (يدير Bontrager الساق إنسيًّا 3°–5° لتحقيق ذلك). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب94. 2 موضعًا في 2 فحصًا — مثال: rules[9].feedback.low.en
- قديم: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 70–80 kV is the textbook digital band; the partial credit between 65 and 69 kV is an engine teaching choice.)
- جديد: kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only 70–80 kV is the textbook digital band; 65–69 kV earns partial credit.)

## ب95. 2 موضعًا في 2 فحصًا — مثال: rules[9].feedback.low.ar
- قديم: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎70–80‎ kV فقط؛ أما الدرجة الجزئية بين ‎65‎ و‎69‎ kV فهي اختيار تعليمي في المحاكي.)
- جديد: قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎70–80‎ kV فقط؛ وتُمنح درجة جزئية بين ‎65‎ و‎69‎ kV.)

## ب96. 2 موضعًا في 2 فحصًا — مثال: rules[9].feedback.high.en
- قديم: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 70–80 kV is the textbook digital band; the partial credit up to 85 kV is an engine teaching choice.)
- جديد: kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 70–80 kV is the textbook digital band; partial credit applies up to 85 kV.)

## ب97. 2 موضعًا في 2 فحصًا — مثال: rules[9].feedback.high.ar
- قديم: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎70–80‎ kV فقط؛ أما الدرجة الجزئية حتى ‎85‎ kV فهي اختيار تعليمي.)
- جديد: قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎70–80‎ kV فقط؛ وتُمنح درجة جزئية حتى ‎85‎ kV.)

## ب98. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 70–80 kV (Bontrager, digital, p.249); partial credit 65–85 kV is an engine teaching choice.
- جديد: Full credit inside 70–80 kV (Bontrager, digital, p.249); partial credit within 65–85 kV.

## ب99. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎70–80‎ kV (Bontrager، رقمي، ص.249)؛ والدرجة الجزئية ضمن ‎65–85‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎70–80‎ kV (Bontrager، رقمي، ص.249)؛ والدرجة الجزئية ضمن ‎65–85‎ kV.

## ب100. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The knee is rotated: the posterior borders of the femoral condyles are no longer superimposed and the fibular head is covered by the tibia more or less than in a true lateral (over-rotation = less covered, under-rotation = more; Bontrager p.249). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The knee is rotated: the posterior borders of the femoral condyles are no longer superimposed and the fibular head is covered by the tibia more or less than in a true lateral (over-rotation = less covered, under-rotation = more; Bontrager p.249). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). Full credit within ±2°, partial credit within ±5°.

## ب101. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: الركبة مائلة (دوران): لم تعد الحدود الخلفية للقمتي عظم الفخذ متراكبة وأصبح رأس الشظية مغطى بالظنبوب بأكثر أو بأقل مما في الإسقاط الجانبي الصحيح (الدوران الزائد = تغطية أقل، والناقص = أكثر؛ Bontrager ص.249). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: الركبة مائلة (دوران): لم تعد الحدود الخلفية للقمتي عظم الفخذ متراكبة وأصبح رأس الشظية مغطى بالظنبوب بأكثر أو بأقل مما في الإسقاط الجانبي الصحيح (الدوران الزائد = تغطية أقل، والناقص = أكثر؛ Bontrager ص.249). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب102. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.low.en
- قديم: More cephalad than 5°–7°. Bontrager gives 7°–10° only for a short patient with a wide pelvis; this patient is average. (The 3°–10° partial-credit band is an engine teaching choice.)
- جديد: More cephalad than 5°–7°. Bontrager gives 7°–10° only for a short patient with a wide pelvis; this patient is average. (Partial credit applies within 3°–10°.)

## ب103. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.low.ar
- قديم: ميل نحو الرأس أكبر من 5°–7°. يذكر Bontrager 7°–10° لمريض قصير ذي حوض عريض فقط؛ وهذا المريض متوسط. (نطاق الدرجة الجزئية 3°–10° اختيار تعليمي في المحاكي.)
- جديد: ميل نحو الرأس أكبر من 5°–7°. يذكر Bontrager 7°–10° لمريض قصير ذي حوض عريض فقط؛ وهذا المريض متوسط. (وتُمنح درجة جزئية ضمن 3°–10°.)

## ب104. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.high.en
- قديم: Too little cephalad angle (a perpendicular beam is used only when the lower leg can be raised to the plane of the femur). Angle the tube 5°–7° cephalad. (The 3°–10° partial-credit band is an engine teaching choice.)
- جديد: Too little cephalad angle (a perpendicular beam is used only when the lower leg can be raised to the plane of the femur). Angle the tube 5°–7° cephalad. (Partial credit applies within 3°–10°.)

## ب105. 1 موضعًا في 1 فحصًا — مثال: rules[8].feedback.high.ar
- قديم: ميل نحو الرأس أقل من اللازم (يُستخدم الشعاع العمودي فقط إذا أمكن رفع الساق إلى مستوى عظم الفخذ). أمِل الأنبوب 5°–7° نحو الرأس. (نطاق الدرجة الجزئية 3°–10° اختيار تعليمي في المحاكي.)
- جديد: ميل نحو الرأس أقل من اللازم (يُستخدم الشعاع العمودي فقط إذا أمكن رفع الساق إلى مستوى عظم الفخذ). أمِل الأنبوب 5°–7° نحو الرأس. (وتُمنح درجة جزئية ضمن 3°–10°.)

## ب106. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 65–75 kV (Bontrager, digital, p.239); partial credit 60–80 kV is an engine teaching choice.
- جديد: Full credit inside 65–75 kV (Bontrager, digital, p.239); partial credit within 60–80 kV.

## ب107. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.239)؛ والدرجة الجزئية ضمن ‎60–80‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.239)؛ والدرجة الجزئية ضمن ‎60–80‎ kV.

## ب108. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the ankle, without cutting off the required anatomy. (The 5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the ankle, without cutting off the required anatomy. (Margin limit: 5 cm; the field must still include the marker.)

## ب109. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الكاحل دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الكاحل دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب110. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The leg is rotated: the medial and lateral parts of the ankle mortise no longer look as they do in a true AP (medial open, lateral closed) and the overlap of the distal fibula changes (Bontrager p.239). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). Value 0 = the leg not rotated, the line between the malleoli about 15° from parallel to the detector (the lateral malleolus lies further back). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The leg is rotated: the medial and lateral parts of the ankle mortise no longer look as they do in a true AP (medial open, lateral closed) and the overlap of the distal fibula changes (Bontrager p.239). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). Value 0 = the leg not rotated, the line between the malleoli about 15° from parallel to the detector (the lateral malleolus lies further back). Full credit within ±2°, partial credit within ±5°.

## ب111. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: الساق مدارة: لم يعد الجزءان الإنسي والوحشي من تجويف مفصل الكاحل كما في إسقاط AP الصحيح (الإنسي مفتوح والوحشي مغلق) وتغيّر تراكب الشظية السفلية (Bontrager ص.239). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). القيمة 0 = الساق غير مدارة والخط بين الكعبين يميل نحو 15° عن الموازاة للكاشف (الكعب الوحشي أكثر خلفية). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: الساق مدارة: لم يعد الجزءان الإنسي والوحشي من تجويف مفصل الكاحل كما في إسقاط AP الصحيح (الإنسي مفتوح والوحشي مغلق) وتغيّر تراكب الشظية السفلية (Bontrager ص.239). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). القيمة 0 = الساق غير مدارة والخط بين الكعبين يميل نحو 15° عن الموازاة للكاشف (الكعب الوحشي أكثر خلفية). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب112. 2 موضعًا في 2 فحصًا — مثال: rules[8].evidence.note
- قديم: CR perpendicular to the detector is Bontrager. The ±2° full-credit and ±5° partial-credit bands are an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.
- جديد: CR perpendicular to the detector is Bontrager. Full credit within ±2°, partial credit within ±5°. Feedback only: the tube angle is NOT drawn on the result image.

## ب113. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Full credit inside 65–75 kV (Bontrager, digital, p.242); partial credit 60–80 kV is an engine teaching choice.
- جديد: Full credit inside 65–75 kV (Bontrager, digital, p.242); partial credit within 60–80 kV.

## ب114. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.242)؛ والدرجة الجزئية ضمن ‎60–80‎ kV اختيار تعليمي في المحاكي.
- جديد: درجة كاملة ضمن ‎65–75‎ kV (Bontrager، رقمي، ص.242)؛ والدرجة الجزئية ضمن ‎60–80‎ kV.

## ب115. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.en
- قديم: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the ankle, without cutting off the required anatomy. (The 4.5 cm margin limit is an engine teaching choice; the field must still include the marker.)
- جديد: The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the ankle, without cutting off the required anatomy. (Margin limit: 4.5 cm; the field must still include the marker.)

## ب116. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.high.ar
- قديم: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الكاحل دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎4.5‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)
- جديد: المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الكاحل دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎4.5‎ سم؛ ويجب أن يشمل المجال العلامة.)

## ب117. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: The ankle is rotated: the distal fibula no longer lies over the posterior half of the tibia and the tibiotalar joint space is no longer uniform (Bontrager p.242). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.
- جديد: The ankle is rotated: the distal fibula no longer lies over the posterior half of the tibia and the tibiotalar joint space is no longer uniform (Bontrager p.242). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). Full credit within ±2°, partial credit within ±5°.

## ب118. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: الكاحل مائل (دوران): لم تعد الشظية السفلية فوق النصف الخلفي للظنبوب ولم يعد حيز مفصل الظنبوب والكاحل منتظمًا (Bontrager ص.242). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.
- جديد: الكاحل مائل (دوران): لم تعد الشظية السفلية فوق النصف الخلفي للظنبوب ولم يعد حيز مفصل الظنبوب والكاحل منتظمًا (Bontrager ص.242). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب119. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Bontrager p.279: 80–90 kV, SID at least 102 cm, grid. Manual-only mode, partial bands, 85 kV / 2.5 mAs / 102 cm model anchor, attenuation and tolerances are engine teaching choices, not a clinical technique chart.
- جديد: Bontrager p.279: 80–90 kV, SID at least 102 cm, grid. Manual-only mode, partial bands, 85 kV / 2.5 mAs / 102 cm model anchor, attenuation and tolerances are not a clinical technique chart.

## ب120. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: Bontrager ص.279: ‏80–90 kV وSID لا يقل عن 102 سم، مع شبكة. الوضع اليدوي والنطاقات الجزئية ونقطة النموذج 85 kV و2.5 mAs عند 102 سم والتوهين والتسامحات اختيارات تعليمية في المحاكي وليست جدول تعريض سريريًا.
- جديد: Bontrager ص.279: ‏80–90 kV وSID لا يقل عن 102 سم، مع شبكة. الوضع اليدوي والنطاقات الجزئية ونقطة النموذج 85 kV و2.5 mAs عند 102 سم والتوهين والتسامحات وليست جدول تعريض سريريًا.

## ب121. 2 موضعًا في 2 فحصًا — مثال: technique.patient.label.en
- قديم: Reference adult attenuation (teaching assumption)
- جديد: Reference adult attenuation

## ب122. 2 موضعًا في 2 فحصًا — مثال: technique.patient.label.ar
- قديم: توهين بالغ مرجعي (افتراض تعليمي)
- جديد: توهين بالغ مرجعي

## ب123. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.pass.en
- قديم: Pelvis aligned: iliac wings and obturator foramina should be symmetric (Bontrager p.279). The ±2°/±5° bands are an engine teaching choice.
- جديد: Pelvis aligned: iliac wings and obturator foramina should be symmetric (Bontrager p.279). Full credit within ±2°, partial credit within ±5°.

## ب124. 1 موضعًا في 1 فحصًا — مثال: rules[2].feedback.pass.ar
- قديم: الحوض محاذٍ: ينبغي تناظر جناحي الحرقفة والثقبتين السداديتين (Bontrager ص.279). نطاقا ±2° و±5° اختيار تعليمي في المحاكي.
- جديد: الحوض محاذٍ: ينبغي تناظر جناحي الحرقفة والثقبتين السداديتين (Bontrager ص.279). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب125. 3 موضعًا في 1 فحصًا — مثال: rules[2].feedback.fail.en
- قديم: Pelvic rotation changes the symmetry of the iliac wings and obturator foramina (Bontrager p.279). The one-image warp is an educational approximation; independent bone overlap is not reconstructed. The ±2°/±5° bands are an engine teaching choice.
- جديد: Pelvic rotation changes the symmetry of the iliac wings and obturator foramina (Bontrager p.279). The one-image warp is an educational approximation; independent bone overlap is not reconstructed. Full credit within ±2°, partial credit within ±5°.

## ب126. 3 موضعًا في 1 فحصًا — مثال: rules[2].feedback.fail.ar
- قديم: دوران الحوض يغيّر تناظر جناحي الحرقفة والثقبتين السداديتين (Bontrager ص.279). تحويل الصورة الواحدة تقريب تعليمي؛ لا يُعاد بناء تراكب العظام المستقل. نطاقا ±2° و±5° اختيار تعليمي في المحاكي.
- جديد: دوران الحوض يغيّر تناظر جناحي الحرقفة والثقبتين السداديتين (Bontrager ص.279). تحويل الصورة الواحدة تقريب تعليمي؛ لا يُعاد بناء تراكب العظام المستقل. درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب127. 3 موضعًا في 1 فحصًا — مثال: rules[4].feedback.fail.en
- قديم: The field clips the required pelvis region. Re-center or open the appropriate field edge; the region box is an engine teaching choice.
- جديد: The field clips the required pelvis region. Re-center or open the appropriate field edge.

## ب128. 3 موضعًا في 1 فحصًا — مثال: rules[4].feedback.fail.ar
- قديم: المجال يقطع منطقة الحوض المطلوبة. أعد التمركز أو وسّع الحافة المناسبة؛ مستطيل المنطقة اختيار تعليمي في المحاكي.
- جديد: المجال يقطع منطقة الحوض المطلوبة. أعد التمركز أو وسّع الحافة المناسبة.

## ب129. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.pass.en
- قديم: The field includes the required anatomy with restricted margins. The 2.6 cm margin is an engine teaching choice.
- جديد: The field includes the required anatomy with restricted margins. Margin limit: 2.6 cm.

## ب130. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.pass.ar
- قديم: يشمل المجال التشريح المطلوب بهوامش محدودة. هامش 2.6 سم اختيار تعليمي في المحاكي.
- جديد: يشمل المجال التشريح المطلوب بهوامش محدودة. حدّ الهامش 2.6 سم.

## ب131. 3 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: Reduce unnecessary field area while retaining anatomy and marker. The 2.6 cm excess-margin threshold is an engine teaching choice, not a Bontrager measurement.
- جديد: Reduce unnecessary field area while retaining anatomy and marker. Excess-margin threshold: 2.6 cm.

## ب132. 3 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: قلّل مساحة المجال الزائدة مع الحفاظ على التشريح والعلامة. حد الهامش الزائد 2.6 سم اختيار تعليمي في المحاكي وليس قياسًا من Bontrager.
- جديد: قلّل مساحة المجال الزائدة مع الحفاظ على التشريح والعلامة. حد الهامش الزائد 2.6 سم.

## ب133. 2 موضعًا في 1 فحصًا — مثال: rules[6].feedback.pass.en
- قديم: CR centered at the reference point: midway between ASIS level and pubic symphysis, about 5 cm below ASIS (Bontrager p.279). 1/2.5 cm tolerances are engine teaching choices.
- جديد: CR centered at the reference point: midway between ASIS level and pubic symphysis, about 5 cm below ASIS (Bontrager p.279). Tolerances: 1 / 2.5 cm.

## ب134. 2 موضعًا في 1 فحصًا — مثال: rules[6].feedback.pass.ar
- قديم: الشعاع متمركز عند النقطة المرجعية: منتصف مستوى ASIS والارتفاق العاني، نحو 5 سم تحت ASIS (Bontrager ص.279). تسامحا 1 و2.5 سم اختياران تعليميان.
- جديد: الشعاع متمركز عند النقطة المرجعية: منتصف مستوى ASIS والارتفاق العاني، نحو 5 سم تحت ASIS (Bontrager ص.279). التسامح 1 و2.5 سم.

## ب135. 6 موضعًا في 1 فحصًا — مثال: rules[6].feedback.fail.en
- قديم: Re-center the ray at the pelvis reference point. The image scale and 1/2.5 cm tolerances are engine teaching choices, not measured patient anatomy.
- جديد: Re-center the ray at the pelvis reference point. The image scale is not measured patient anatomy; tolerances: 1 / 2.5 cm.

## ب136. 6 موضعًا في 1 فحصًا — مثال: rules[6].feedback.fail.ar
- قديم: أعد توسيط الشعاع عند نقطة الحوض المرجعية. مقياس الصورة وتسامحا 1 و2.5 سم اختيارات تعليمية في المحاكي وليست قياسات تشريحية للمريض.
- جديد: أعد توسيط الشعاع عند نقطة الحوض المرجعية. مقياس الصورة ليس قياسًا تشريحيًا للمريض؛ التسامح 1 و2.5 سم.

## ب137. 1 موضعًا في 1 فحصًا — مثال: rules[9].feedback.pass.en
- قديم: CR perpendicular to the detector (Bontrager p.279); ±2°/±5° bands are engine teaching choices.
- جديد: CR perpendicular to the detector (Bontrager p.279); full credit within ±2°, partial credit within ±5°.

## ب138. 1 موضعًا في 1 فحصًا — مثال: rules[9].feedback.pass.ar
- قديم: الشعاع عمودي على الكاشف (Bontrager ص.279)؛ نطاقا ±2° و±5° اختياران تعليميان.
- جديد: الشعاع عمودي على الكاشف (Bontrager ص.279)؛ درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب139. 3 موضعًا في 1 فحصًا — مثال: rules[9].feedback.fail.en
- قديم: Make the CR perpendicular to the detector. The angle bands are engine teaching choices; tube angulation is shown in the setup, not applied to the radiograph.
- جديد: Make the CR perpendicular to the detector. Tube angulation is shown in the setup, not applied to the radiograph.

## ب140. 6 موضعًا في 2 فحصًا — مثال: rules[9].feedback.fail.ar
- قديم: اجعل الشعاع عموديًا على الكاشف. نطاقات الزاوية اختيارات تعليمية؛ تظهر زاوية الأنبوب في الإعداد ولا تُطبّق على صورة الأشعة.
- جديد: اجعل الشعاع عموديًا على الكاشف. تظهر زاوية الأنبوب في الإعداد ولا تُطبّق على صورة الأشعة.

## ب141. 1 موضعًا في 1 فحصًا — مثال: rules[10].feedback.pass.en
- قديم: SID meets the 102 cm minimum (Bontrager p.279). The 110 cm upper full-credit bound and 95–130 cm partial band are engine teaching choices.
- جديد: SID meets the 102 cm minimum (Bontrager p.279). Full credit up to 110 cm, partial credit within 95–130 cm.

## ب142. 1 موضعًا في 1 فحصًا — مثال: rules[10].feedback.pass.ar
- قديم: تبلغ SID الحد الأدنى 102 سم (Bontrager ص.279). الحد الأعلى 110 سم ونطاق الدرجة الجزئية 95–130 سم اختياران تعليميان.
- جديد: تبلغ SID الحد الأدنى 102 سم (Bontrager ص.279). درجة كاملة حتى 110 سم ودرجة جزئية ضمن 95–130 سم.

## ب143. 6 موضعًا في 2 فحصًا — مثال: rules[10].feedback.fail.en
- قديم: Adjust SID. Bontrager gives a 102 cm minimum; the remaining bands are engine teaching choices. Manual detector exposure changes with distance.
- جديد: Adjust SID. Bontrager gives a 102 cm minimum. Manual detector exposure changes with distance.

## ب144. 6 موضعًا في 2 فحصًا — مثال: rules[10].feedback.fail.ar
- قديم: اضبط SID. يذكر Bontrager حدًا أدنى 102 سم؛ بقية النطاقات اختيارات تعليمية في المحاكي. يتغير تعريض الكاشف اليدوي مع المسافة.
- جديد: اضبط SID. يذكر Bontrager حدًا أدنى 102 سم. يتغير تعريض الكاشف اليدوي مع المسافة.

## ب145. 1 موضعًا في 1 فحصًا — مثال: rules[11].feedback.pass.en
- قديم: Digital 80–90 kV (Bontrager p.279); partial 75–95 kV is an engine teaching choice.
- جديد: Digital 80–90 kV (Bontrager p.279); partial credit 75–95 kV.

## ب146. 1 موضعًا في 1 فحصًا — مثال: rules[11].feedback.pass.ar
- قديم: رقمي 80–90 kV (Bontrager ص.279)؛ نطاق 75–95 kV الجزئي اختيار تعليمي في المحاكي.
- جديد: رقمي 80–90 kV (Bontrager ص.279)؛ درجة جزئية ضمن 75–95 kV.

## ب147. 3 موضعًا في 1 فحصًا — مثال: rules[11].feedback.fail.en
- قديم: Adjust kV: 80–90 kV is source-backed; partial 75–95 kV is an engine teaching choice. Brightness does not indicate exposure.
- جديد: Adjust kV: 80–90 kV is source-backed; partial credit 75–95 kV. Brightness does not indicate exposure.

## ب148. 3 موضعًا في 1 فحصًا — مثال: rules[11].feedback.fail.ar
- قديم: اضبط kV: نطاق 80–90 kV من المرجع؛ ونطاق 75–95 kV الجزئي اختيار تعليمي في المحاكي. السطوع لا يدل على التعريض.
- جديد: اضبط kV: نطاق 80–90 kV من المرجع؛ ودرجة جزئية ضمن 75–95 kV. السطوع لا يدل على التعريض.

## ب149. 2 موضعًا في 1 فحصًا — مثال: rules[12].feedback.pass.en
- قديم: Detector exposure is adequate for this teaching model. DI bands and the 85 kV / 2.5 mAs / 102 cm anchor are engine teaching choices, not a clinical recommendation.
- جديد: Detector exposure is adequate for this teaching model. This is not a clinical recommendation.

## ب150. 2 موضعًا في 1 فحصًا — مثال: rules[12].feedback.pass.ar
- قديم: تعريض الكاشف مناسب لهذا النموذج التعليمي. نطاقات DI ونقطة 85 kV و2.5 mAs عند 102 سم اختيارات تعليمية في المحاكي وليست توصية سريرية.
- جديد: تعريض الكاشف مناسب لهذا النموذج التعليمي. وهذه ليست توصية سريرية.

## ب151. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.en
- قديم: Bontrager p.196: digital 80 ± 5 kV, SID at least 102 cm, grid. Manual-only mode, the partial bands, the 80 kV / 2 mAs / 102 cm model anchor, attenuation and tolerances are engine teaching choices, not a clinical technique chart.
- جديد: Bontrager p.196: digital 80 ± 5 kV, SID at least 102 cm, grid. Manual-only mode, the partial bands, the 80 kV / 2 mAs / 102 cm model anchor, attenuation and tolerances are not a clinical technique chart.

## ب152. 1 موضعًا في 1 فحصًا — مثال: technique.assumptions[9].value.ar
- قديم: Bontrager ص.196: ‏رقمي 80 ± 5 kV وSID لا يقل عن 102 سم، مع شبكة. الوضع اليدوي والنطاقات الجزئية ونقطة النموذج 80 kV و2 mAs عند 102 سم والتوهين والتسامحات اختيارات تعليمية في المحاكي وليست جدول تعريض سريريًا.
- جديد: Bontrager ص.196: ‏رقمي 80 ± 5 kV وSID لا يقل عن 102 سم، مع شبكة. الوضع اليدوي والنطاقات الجزئية ونقطة النموذج 80 kV و2 mAs عند 102 سم والتوهين والتسامحات وليست جدول تعريض سريريًا.

## ب153. 1 موضعًا في 1 فحصًا — مثال: rules[1].feedback.fail.en
- قديم: Turn the body 35°–45° toward the affected shoulder so the glenoid is in profile with an open joint space (Bontrager p.196). The 30°–50° partial band is an engine teaching choice; the picture only closes the joint space as a one-image approximation.
- جديد: Turn the body 35°–45° toward the affected shoulder so the glenoid is in profile with an open joint space (Bontrager p.196). Partial credit applies within 30°–50°; the picture only closes the joint space as a one-image approximation.

## ب154. 1 موضعًا في 1 فحصًا — مثال: rules[1].feedback.fail.ar
- قديم: أدر الجسم 35°–45° نحو الكتف المصاب ليظهر الجوف الحقاني جانبيًا والحيّز المفصلي مفتوحًا (Bontrager ص.196). نطاق 30°–50° الجزئي اختيار تعليمي في المحاكي؛ والصورة تغلق الحيّز المفصلي فقط كتقريب من صورة واحدة.
- جديد: أدر الجسم 35°–45° نحو الكتف المصاب ليظهر الجوف الحقاني جانبيًا والحيّز المفصلي مفتوحًا (Bontrager ص.196). تُمنح درجة جزئية ضمن 30°–50°؛ والصورة تغلق الحيّز المفصلي فقط كتقريب من صورة واحدة.

## ب155. 1 موضعًا في 1 فحصًا — مثال: rules[1].feedback.low.en
- قديم: The body is turned less than 35° toward the affected side (Bontrager p.196). The 30°–50° partial band is an engine teaching choice; the picture only closes the joint space as a one-image approximation.
- جديد: The body is turned less than 35° toward the affected side (Bontrager p.196). Partial credit applies within 30°–50°; the picture only closes the joint space as a one-image approximation.

## ب156. 1 موضعًا في 1 فحصًا — مثال: rules[1].feedback.low.ar
- قديم: الجسم مُدار أقل من 35° نحو الجانب المصاب (Bontrager ص.196). نطاق 30°–50° الجزئي اختيار تعليمي في المحاكي؛ والصورة تغلق الحيّز المفصلي فقط كتقريب من صورة واحدة.
- جديد: الجسم مُدار أقل من 35° نحو الجانب المصاب (Bontrager ص.196). تُمنح درجة جزئية ضمن 30°–50°؛ والصورة تغلق الحيّز المفصلي فقط كتقريب من صورة واحدة.

## ب157. 1 موضعًا في 1 فحصًا — مثال: rules[1].feedback.high.en
- قديم: The body is turned more than 45° toward the affected side (Bontrager p.196). The 30°–50° partial band is an engine teaching choice; the picture only closes the joint space as a one-image approximation.
- جديد: The body is turned more than 45° toward the affected side (Bontrager p.196). Partial credit applies within 30°–50°; the picture only closes the joint space as a one-image approximation.

## ب158. 1 موضعًا في 1 فحصًا — مثال: rules[1].feedback.high.ar
- قديم: الجسم مُدار أكثر من 45° نحو الجانب المصاب (Bontrager ص.196). نطاق 30°–50° الجزئي اختيار تعليمي في المحاكي؛ والصورة تغلق الحيّز المفصلي فقط كتقريب من صورة واحدة.
- جديد: الجسم مُدار أكثر من 45° نحو الجانب المصاب (Bontrager ص.196). تُمنح درجة جزئية ضمن 30°–50°؛ والصورة تغلق الحيّز المفصلي فقط كتقريب من صورة واحدة.

## ب159. 3 موضعًا في 1 فحصًا — مثال: rules[4].feedback.fail.en
- قديم: The field clips the required shoulder region. Re-centre or open the appropriate field edge; the region box is an engine teaching choice.
- جديد: The field clips the required shoulder region. Re-centre or open the appropriate field edge.

## ب160. 3 موضعًا في 1 فحصًا — مثال: rules[4].feedback.fail.ar
- قديم: المجال يقطع منطقة الكتف المطلوبة. أعد التمركز أو وسّع الحافة المناسبة؛ مستطيل المنطقة اختيار تعليمي في المحاكي.
- جديد: المجال يقطع منطقة الكتف المطلوبة. أعد التمركز أو وسّع الحافة المناسبة.

## ب161. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.pass.en
- قديم: The field includes the required anatomy with restricted margins. The 4.5 cm margin is an engine teaching choice (the baseline frame is cut on the medial side, so the field, which is centred on the central ray, needs a wide margin).
- جديد: The field includes the required anatomy with restricted margins. Margin limit: 4.5 cm (the baseline frame is cut on the medial side, so the field, which is centred on the central ray, needs a wide margin).

## ب162. 1 موضعًا في 1 فحصًا — مثال: rules[5].feedback.pass.ar
- قديم: يشمل المجال التشريح المطلوب بهوامش محدودة. هامش 4.5 سم اختيار تعليمي في المحاكي (إطار الصورة المرجعية مقطوع من الجهة الإنسية، فيحتاج المجال المتمركز على الشعاع المركزي إلى هامش واسع).
- جديد: يشمل المجال التشريح المطلوب بهوامش محدودة. حدّ الهامش 4.5 سم (إطار الصورة المرجعية مقطوع من الجهة الإنسية، فيحتاج المجال المتمركز على الشعاع المركزي إلى هامش واسع).

## ب163. 3 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.en
- قديم: Reduce unnecessary field area while retaining the anatomy and the marker. The 4.5 cm excess-margin threshold is an engine teaching choice, not a Bontrager measurement.
- جديد: Reduce unnecessary field area while retaining the anatomy and the marker. Excess-margin threshold: 4.5 cm.

## ب164. 3 موضعًا في 1 فحصًا — مثال: rules[5].feedback.fail.ar
- قديم: قلّل مساحة المجال الزائدة مع الحفاظ على التشريح والعلامة. حد الهامش الزائد 4.5 سم اختيار تعليمي في المحاكي وليس قياسًا من Bontrager.
- جديد: قلّل مساحة المجال الزائدة مع الحفاظ على التشريح والعلامة. حد الهامش الزائد 4.5 سم.

## ب165. 2 موضعًا في 1 فحصًا — مثال: rules[6].feedback.pass.en
- قديم: CR centred on the scapulohumeral joint, about 5 cm inferior and 5 cm medial to the superolateral shoulder border (Bontrager p.196). The 1/2.5 cm tolerances are engine teaching choices.
- جديد: CR centred on the scapulohumeral joint, about 5 cm inferior and 5 cm medial to the superolateral shoulder border (Bontrager p.196). The Tolerances: 1 / 2.5 cm.

## ب166. 2 موضعًا في 1 فحصًا — مثال: rules[6].feedback.pass.ar
- قديم: الشعاع متمركز على المفصل الحقاني العضدي، نحو 5 سم تحت وإنسي الحد العلوي الوحشي للكتف (Bontrager ص.196). تسامحا 1 و2.5 سم اختياران تعليميان.
- جديد: الشعاع متمركز على المفصل الحقاني العضدي، نحو 5 سم تحت وإنسي الحد العلوي الوحشي للكتف (Bontrager ص.196). التسامح 1 و2.5 سم.

## ب167. 6 موضعًا في 1 فحصًا — مثال: rules[6].feedback.fail.en
- قديم: Re-centre the ray on the scapulohumeral joint. The image scale and the 1/2.5 cm tolerances are engine teaching choices, not measured patient anatomy.
- جديد: Re-centre the ray on the scapulohumeral joint. The image scale is not measured patient anatomy; tolerances: 1 / 2.5 cm.

## ب168. 6 موضعًا في 1 فحصًا — مثال: rules[6].feedback.fail.ar
- قديم: أعد توسيط الشعاع على المفصل الحقاني العضدي. مقياس الصورة وتسامحا 1 و2.5 سم اختيارات تعليمية في المحاكي وليست قياسات تشريحية للمريض.
- جديد: أعد توسيط الشعاع على المفصل الحقاني العضدي. مقياس الصورة ليس قياسًا تشريحيًا للمريض؛ التسامح 1 و2.5 سم.

## ب169. 1 موضعًا في 1 فحصًا — مثال: rules[9].feedback.pass.en
- قديم: CR perpendicular to the detector (Bontrager p.196); the ±2°/±5° bands are engine teaching choices.
- جديد: CR perpendicular to the detector (Bontrager p.196); full credit within ±2°, partial credit within ±5°.

## ب170. 1 موضعًا في 1 فحصًا — مثال: rules[9].feedback.pass.ar
- قديم: الشعاع عمودي على الكاشف (Bontrager ص.196)؛ نطاقا ±2° و±5° اختياران تعليميان.
- جديد: الشعاع عمودي على الكاشف (Bontrager ص.196)؛ درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.

## ب171. 3 موضعًا في 1 فحصًا — مثال: rules[9].feedback.fail.en
- قديم: Make the CR perpendicular to the detector. The angle bands are engine teaching choices; the tube angle is shown in the setup, not applied to the radiograph.
- جديد: Make the CR perpendicular to the detector. The tube angle is shown in the setup, not applied to the radiograph.

## ب172. 1 موضعًا في 1 فحصًا — مثال: rules[10].feedback.pass.en
- قديم: SID meets the 102 cm minimum (Bontrager p.196). The 110 cm upper full-credit bound and the 95–130 cm partial band are engine teaching choices.
- جديد: SID meets the 102 cm minimum (Bontrager p.196). Full credit up to 110 cm, partial credit within 95–130 cm.

## ب173. 1 موضعًا في 1 فحصًا — مثال: rules[10].feedback.pass.ar
- قديم: تبلغ SID الحد الأدنى 102 سم (Bontrager ص.196). الحد الأعلى 110 سم ونطاق الدرجة الجزئية 95–130 سم اختياران تعليميان.
- جديد: تبلغ SID الحد الأدنى 102 سم (Bontrager ص.196). درجة كاملة حتى 110 سم ودرجة جزئية ضمن 95–130 سم.

## ب174. 1 موضعًا في 1 فحصًا — مثال: rules[11].feedback.pass.en
- قديم: Digital 80 ± 5 kV, i.e. 75–85 kV (Bontrager p.196); the partial 70–90 kV band is an engine teaching choice.
- جديد: Digital 80 ± 5 kV, i.e. 75–85 kV (Bontrager p.196); partial credit 70–90 kV.

## ب175. 1 موضعًا في 1 فحصًا — مثال: rules[11].feedback.pass.ar
- قديم: رقمي 80 ± 5 kV أي 75–85 kV (Bontrager ص.196)؛ نطاق 70–90 kV الجزئي اختيار تعليمي في المحاكي.
- جديد: رقمي 80 ± 5 kV أي 75–85 kV (Bontrager ص.196)؛ درجة جزئية ضمن 70–90 kV.

## ب176. 3 موضعًا في 1 فحصًا — مثال: rules[11].feedback.fail.en
- قديم: Adjust kV: 75–85 kV is source-backed; the partial 70–90 kV band is an engine teaching choice. Brightness does not indicate exposure.
- جديد: Adjust kV: 75–85 kV is source-backed; partial credit 70–90 kV. Brightness does not indicate exposure.

## ب177. 3 موضعًا في 1 فحصًا — مثال: rules[11].feedback.fail.ar
- قديم: اضبط kV: نطاق 75–85 kV من المرجع؛ ونطاق 70–90 kV الجزئي اختيار تعليمي في المحاكي. السطوع لا يدل على التعريض.
- جديد: اضبط kV: نطاق 75–85 kV من المرجع؛ ودرجة جزئية ضمن 70–90 kV. السطوع لا يدل على التعريض.

## ب178. 2 موضعًا في 1 فحصًا — مثال: rules[12].feedback.pass.en
- قديم: Detector exposure is adequate for this teaching model. DI bands and the 80 kV / 2 mAs / 102 cm anchor are engine teaching choices, not a clinical recommendation.
- جديد: Detector exposure is adequate for this teaching model. This is not a clinical recommendation.

## ب179. 2 موضعًا في 1 فحصًا — مثال: rules[12].feedback.pass.ar
- قديم: تعريض الكاشف مناسب لهذا النموذج التعليمي. نطاقات DI ونقطة 80 kV و2 mAs عند 102 سم اختيارات تعليمية في المحاكي وليست توصية سريرية.
- جديد: تعريض الكاشف مناسب لهذا النموذج التعليمي. وهذه ليست توصية سريرية.

## ب180. 1 موضعًا — مثال: result.criticalImplementation
- قديم: Implementation (educational simulator rule)
- جديد: Implementation in this simulator

## ب181. 1 موضعًا — مثال: technique.gaugeNote
- قديم: DI = 10 × log10(EI / EIT). +3 ≈ twice the target exposure, −3 ≈ half. The ±1 and ±3 scoring bands are teaching choices of this simulator, not universal limits. EI here is a simulated exposure indicator, not patient dose.
- جديد: DI = 10 × log10(EI / EIT). +3 ≈ twice the target exposure, −3 ≈ half. The ±1 and ±3 scoring bands are not universal limits. EI here is a simulated exposure indicator, not patient dose.

## ب182. 1 موضعًا — مثال: technique.assumptionsIntro
- قديم: Every medical rule behind this feedback is classified. Only “source-based” items are claims taken from a cited source; the rest are protocol-specific or teaching choices.
- جديد: Every medical rule behind this feedback is classified. Only “source-based” items are claims taken from a cited source; the rest are protocol-specific or educational simplifications.

## ب183. 1 موضعًا — مثال: positioningPelvis.schematicNote
- قديم: Educational schematic, not anatomically exact. The same one-image model drives pelvic rotation in the setup and result. Leg position is independent; hidden trochanters and femoral-neck foreshortening are not reconstructed on the radiograph. Numeric tolerances and geometry are teaching assumptions.
- جديد: Educational schematic, not anatomically exact. The same one-image model drives pelvic rotation in the setup and result. Leg position is independent; hidden trochanters and femoral-neck foreshortening are not reconstructed on the radiograph.

## ب184. 1 موضعًا — مثال: positioningPelvis.rotationHelp
- قديم: Rotate the pelvis independently of both legs. Iliac wings and obturator foramina should be symmetric. This one-image warp is a teaching approximation; ±2° full / ±5° partial are engine teaching choices.
- جديد: Rotate the pelvis independently of both legs. Iliac wings and obturator foramina should be symmetric. This one-image warp is a teaching approximation; ±2° full / ±5° partial credit.

## ب185. 1 موضعًا — مثال: positioningShoulder.schematicNote
- قديم: Educational schematic, not anatomically exact. The same one-image model closes the joint space in the setup and in the result when the body turn is outside the 35°–45° source range. The arm position is drawn in the setup only and does not change the radiograph; the glenoid rims and head overlap are not reconstructed. Scale, region and tolerances are teaching assumptions.
- جديد: Educational schematic, not anatomically exact. The same one-image model closes the joint space in the setup and in the result when the body turn is outside the 35°–45° source range. The arm position is drawn in the setup only and does not change the radiograph; the glenoid rims and head overlap are not reconstructed.

## ب186. 1 موضعًا — مثال: positioningShoulder.rotationHelp
- قديم: Turn the body toward the affected (right) shoulder; the angle is the absolute turn from the detector. Bontrager gives 35°–45° and every angle in that range scores the same: there is no single ideal angle. The 30°–50° partial band is an engine teaching choice.
- جديد: Turn the body toward the affected (right) shoulder; the angle is the absolute turn from the detector. Bontrager gives 35°–45° and every angle in that range scores the same: there is no single ideal angle. Partial credit applies within 30°–50°.

## ب187. 1 موضعًا — مثال: terms.patients.p4
- قديم: Values marked “Teaching value” are this simulator's teaching choices (for example tolerance limits, scoring weights, exposure-indicator ranges and the size of visual effects), not universal clinical standards. Facts are taken from the professional sources cited.
- جديد: Values marked “Teaching value”, “Educational simplification” or “Common reference / not universal” reflect choices or simplifications made in this simulator for teaching purposes (for example tolerance limits, scoring weights, exposure-indicator ranges and the size of visual effects); they are not universal clinical standards. Facts are taken from the professional sources cited.

## ب188. 1 موضعًا — مثال: terms.patients.p5
- قديم: (جديد)
- جديد: Some errors are treated as critical in this simulator for teaching purposes; this is not a clinical accept or reject decision.

## ب189. 1 موضعًا — مثال: terms.patients.p6
- قديم: (جديد)
- جديد: The simulated patient's behaviour follows simplified teaching assumptions.

## ب190. 1 موضعًا — مثال: result.criticalImplementation
- قديم: التطبيق (قاعدة تعليمية في المحاكي)
- جديد: التطبيق في هذا المحاكي

## ب191. 1 موضعًا — مثال: technique.gaugeNote
- قديم: DI = 10 × log10(EI / EIT). ‏+3 ≈ ضعف التعريض المستهدف و−3 ≈ نصفه. نطاقا التقييم ±1 و±3 اختياران تعليميان في هذا المحاكي وليسا حدودًا عالمية. EI هنا مؤشر تعريض محاكى وليس جرعة المريض.
- جديد: DI = 10 × log10(EI / EIT). ‏+3 ≈ ضعف التعريض المستهدف و−3 ≈ نصفه. نطاقا التقييم ±1 و±3 ليسا حدودًا عالمية. EI هنا مؤشر تعريض محاكى وليس جرعة المريض.

## ب192. 1 موضعًا — مثال: technique.assumptionsIntro
- قديم: كل قاعدة طبية وراء هذه التغذية الراجعة مصنَّفة. فقط البنود «المستندة إلى مصدر» تُعدّ ادعاءات مأخوذة من مصدر مذكور؛ أما البقية فخاصة بالبروتوكول أو اختيارات تعليمية.
- جديد: كل قاعدة طبية وراء هذه التغذية الراجعة مصنَّفة. فقط البنود «المستندة إلى مصدر» تُعدّ ادعاءات مأخوذة من مصدر مذكور؛ أما البقية فخاصة بالبروتوكول أو تبسيطات تعليمية.

## ب193. 1 موضعًا — مثال: positioningPelvis.schematicNote
- قديم: رسم تعليمي تقريبي وليس تشريحًا دقيقًا. يحرّك نموذج الصورة الواحدة دوران الحوض في الإعداد والنتيجة. وضع الطرفين مستقل؛ لا يُعاد بناء المدورات المخفية أو قِصَر عنق الفخذ في الأشعة. التسامحات الرقمية والهندسة افتراضات تعليمية.
- جديد: رسم تعليمي تقريبي وليس تشريحًا دقيقًا. يحرّك نموذج الصورة الواحدة دوران الحوض في الإعداد والنتيجة. وضع الطرفين مستقل؛ لا يُعاد بناء المدورات المخفية أو قِصَر عنق الفخذ في الأشعة.

## ب194. 1 موضعًا — مثال: positioningPelvis.rotationHelp
- قديم: أدر الحوض بصورة مستقلة عن الطرفين. ينبغي تناظر جناحي الحرقفة والثقبتين السداديتين. تحويل الصورة الواحدة تقريب تعليمي؛ نطاقا ±2° للدرجة الكاملة و±5° للجزئية اختياران تعليميان في المحاكي.
- جديد: أدر الحوض بصورة مستقلة عن الطرفين. ينبغي تناظر جناحي الحرقفة والثقبتين السداديتين. تحويل الصورة الواحدة تقريب تعليمي؛ درجة كاملة ضمن ±2° وجزئية ضمن ±5°.

## ب195. 1 موضعًا — مثال: positioningShoulder.schematicNote
- قديم: رسم تعليمي تقريبي وليس تشريحًا دقيقًا. يغلق نموذج الصورة الواحدة نفسه الحيّز المفصلي في الإعداد والنتيجة عندما تقع تدوير الجسم خارج نطاق المصدر 35°–45°. يُرسم وضع الذراع في الإعداد فقط ولا يغيّر صورة الأشعة؛ ولا تُعاد حافتا الجوف ولا تراكب الرأس. المقياس والمنطقة والتسامحات افتراضات تعليمية.
- جديد: رسم تعليمي تقريبي وليس تشريحًا دقيقًا. يغلق نموذج الصورة الواحدة نفسه الحيّز المفصلي في الإعداد والنتيجة عندما تقع تدوير الجسم خارج نطاق المصدر 35°–45°. يُرسم وضع الذراع في الإعداد فقط ولا يغيّر صورة الأشعة؛ ولا تُعاد حافتا الجوف ولا تراكب الرأس.

## ب196. 1 موضعًا — مثال: positioningShoulder.rotationHelp
- قديم: أدر الجسم نحو الكتف المصاب (الأيمن)؛ الزاوية هي الإدارة المطلقة بالنسبة إلى الكاشف. يذكر Bontrager نطاق 35°–45° وكل زاوية فيه تنال الدرجة نفسها: لا توجد زاوية مثالية وحيدة. نطاق 30°–50° الجزئي اختيار تعليمي في المحاكي.
- جديد: أدر الجسم نحو الكتف المصاب (الأيمن)؛ الزاوية هي الإدارة المطلقة بالنسبة إلى الكاشف. يذكر Bontrager نطاق 35°–45° وكل زاوية فيه تنال الدرجة نفسها: لا توجد زاوية مثالية وحيدة. تُمنح درجة جزئية ضمن 30°–50°.

## ب197. 1 موضعًا — مثال: terms.patients.p4
- قديم: القيم الموسومة «قيمة تعليمية» هي اختيارات تعليمية لهذا المحاكي (مثل حدود التسامح وأوزان التصحيح ونطاقات مؤشر التعريض وحجم الأثر البصري)، وليست معايير سريرية عامة. أما الحقائق فمأخوذة من المصادر المهنية المذكورة.
- جديد: القيم الموسومة «قيمة تعليمية» أو «تبسيط تعليمي» أو «مرجع شائع / غير عالمي» تعبّر عن اختيارات أو تبسيطات وضعها هذا المحاكي لأغراض التعليم (مثل حدود التسامح وأوزان التصحيح ونطاقات مؤشر التعريض وحجم الأثر البصري)، وليست معايير سريرية عامة. أما الحقائق فمأخوذة من المصادر المهنية المذكورة.

## ب198. 1 موضعًا — مثال: terms.patients.p5
- قديم: (جديد)
- جديد: تُعامَل بعض الأخطاء في هذا المحاكي على أنها حرجة لأغراض تعليمية؛ وليس هذا قرار قبول أو رفض سريريًا.

## ب199. 1 موضعًا — مثال: terms.patients.p6
- قديم: (جديد)
- جديد: يتبع سلوك المريض المحاكى افتراضات تعليمية مبسّطة.
