"use client";
import {useId,useState,type PointerEvent,type KeyboardEvent} from "react";
import {NextIntlClientProvider} from "next-intl";
import {CHEST_PA_FIGURE,CHEST_LATERAL_FIGURE,DETECTOR_FIGURES,U} from "@/features/positioning/detector-figures";
import {PELVIS_FIGURE} from "@/features/positioning/PelvisFigure";
import {SHOULDER_FIGURE} from "@/features/positioning/ShoulderFigure";
import {SCENE,STROKE} from "@/features/positioning/scene-style";
import {clientToNorm,collimationFromEdgeDrag,normToView,roundTo,type FieldEdge} from "@/features/simulation/coords";
import {collimatedField} from "@/features/simulation/geometry";
import {practicalSettings,type PracticalView} from "./practical-presentation";
type Target="ray"|"marker"|FieldEdge;
/** Existing anatomy drawings, fixed guides OFF. No case registry, scoring targets, evaluator or Practice store. */
export function PracticalScene({view,values,disabled,onChange}:{view:PracticalView;values:Readonly<Record<string,unknown>>;disabled:boolean;onChange:(v:Record<string,unknown>)=>void}){
  const id=useId().replaceAll(":",""),[drag,setDrag]=useState<{target:Target;dx:number;dy:number}|null>(null);
  const s=practicalSettings(values),{detector,anatomyFrame,markerSizeCm}=view.scene,W=detector.widthCm*U,H=detector.heightCm*U;
  const figure=view.scene.id==="pelvis-ap-supine"?PELVIS_FIGURE:view.scene.id==="shoulder-grashey-erect"?SHOULDER_FIGURE:view.scene.id==="chest-lateral"?CHEST_LATERAL_FIGURE:DETECTOR_FIGURES[view.scene.id]??CHEST_PA_FIGURE;
  const {Drawing}=figure,frame={x:0,y:0,width:W,height:H},box={x:-30,y:-30,width:W+60,height:H+60};
  const field=collimatedField(s,detector),ray=normToView(s.centralRay,frame),marker=normToView(s.markerPosition,frame);
  const min=view.controls["collimation.width"]?.kind==="number"?view.controls["collimation.width"].min:0;
  const description=Object.entries(values).map(([p,v])=>`${view.labels[p]}: ${Array.isArray(v)?v.join(", ")||"None":v===null?"None":String(v)}`).join("; ");
  const coords=(e:PointerEvent<SVGElement>)=>clientToNorm({x:e.clientX,y:e.clientY},e.currentTarget.ownerSVGElement!.getBoundingClientRect(),box,frame);
  function move(target:Target,x:number,y:number){
    if(disabled)return;
    if(target==="ray"||target==="marker") {const root=target==="ray"?"centralRay":"markerPosition";onChange({...values,[`${root}.x`]:roundTo(Math.max(-1,Math.min(1,x))),[`${root}.y`]:roundTo(Math.max(-1,Math.min(1,y)))});}
    else {const size=collimationFromEdgeDrag({x,y},s.centralRay,target,s.collimation,min);onChange({...values,"collimation.width":roundTo(size.width),"collimation.height":roundTo(size.height)});}
  }
  const handles=(target:Target)=>({
    onPointerDown:(e:PointerEvent<SVGElement>)=>{if(disabled)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const p=coords(e),at=target==="ray"?s.centralRay:target==="marker"?s.markerPosition:p;setDrag({target,dx:at.x-p.x,dy:at.y-p.y});},
    onPointerMove:(e:PointerEvent<SVGElement>)=>{const d=drag;if(!d||disabled)return;const p=coords(e);move(d.target,p.x+d.dx,p.y+d.dy);},
    onPointerUp:(e:PointerEvent<SVGElement>)=>{setDrag(null);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);},onPointerCancel:()=>{setDrag(null);},
  });
  const keyboard=(target:"ray"|"marker")=>(e:KeyboardEvent)=>{if(disabled||!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();const at=target==="ray"?s.centralRay:s.markerPosition,step=e.shiftKey?0.1:0.02;move(target,at.x+(e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0),at.y+(e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0));};
  const fx=field.x1*U,fy=field.y1*U,fw=(field.x2-field.x1)*U,fh=(field.y2-field.y1)*U;
  return <figure className="space-y-3 rounded border border-line p-3" dir="ltr" lang="en">
    <figcaption>Positioning scene. Schematic anatomy follows the existing simulation model.</figcaption>
    <p id={`${id}-settings`} className="sr-only">{description}</p>
    <div className="grid gap-3 lg:grid-cols-2">
      <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} role="group" aria-label="Detector and patient" aria-describedby={`${id}-settings`} className="mx-auto max-h-[32rem] w-full bg-console" style={{direction:"ltr",touchAction:disabled?"auto":"none"}}>
        <defs><clipPath id={`${id}-clip`}><rect width={W} height={H}/></clipPath></defs>
        <rect width={W} height={H} fill={SCENE.detectorFill} stroke={SCENE.detectorEdge} strokeWidth={STROKE.thin}/>
        <g clipPath={`url(#${id}-clip)`}>
          <NextIntlClientProvider locale="en" messages={{scene:{heart:"Heart"},sceneWrist:{}}}><Drawing radCase={{detector,requiredAnatomy:anatomyFrame,requiredProjection:s.projection}} settings={s} showGuides={false} W={W} H={H}/></NextIntlClientProvider>
          <path fillRule="evenodd" fill={SCENE.underStroke} opacity={0.6} d={`M0 0H${W}V${H}H0Z M${fx} ${fy}h${fw}v${fh}h${-fw}Z`}/>
          <rect x={fx} y={fy} width={fw} height={fh} fill="none" stroke={SCENE.beam} strokeWidth={STROKE.medium}/>
          {s.sideMarker&&<g {...handles("marker")} onKeyDown={keyboard("marker")} tabIndex={disabled?-1:0} role="button" aria-disabled={disabled} aria-label={`Move marker ${s.sideMarker} with arrow keys or drag`}>
            <rect x={marker.x-22} y={marker.y-22} width={44} height={44} fill="transparent"/>
            <rect x={marker.x-markerSizeCm*U/2} y={marker.y-markerSizeCm*U/2} width={markerSizeCm*U} height={markerSizeCm*U} fill={SCENE.label}/>
            <text x={marker.x} y={marker.y+7} textAnchor="middle" fill={SCENE.underStroke} fontSize={20}>{s.sideMarker}</text>
          </g>}
          <g {...handles("ray")} onKeyDown={keyboard("ray")} tabIndex={disabled?-1:0} role="button" aria-disabled={disabled} aria-label="Move beam with arrow keys or drag">
            <circle cx={ray.x} cy={ray.y} r={24} fill="transparent"/>
            <path d={`M${ray.x-18} ${ray.y}h36 M${ray.x} ${ray.y-18}v36`} stroke={SCENE.underStroke} strokeWidth={STROKE.heavy+2}/>
            <path d={`M${ray.x-18} ${ray.y}h36 M${ray.x} ${ray.y-18}v36`} stroke={SCENE.beam} strokeWidth={STROKE.medium}/>
          </g>
        </g>
        {([["left",fx,fy+fh/2],["right",fx+fw,fy+fh/2],["top",fx+fw/2,fy],["bottom",fx+fw/2,fy+fh]] as const).map(([edge,x,y])=><g key={edge} {...handles(edge)} aria-hidden><rect x={x-22} y={y-22} width={44} height={44} fill="transparent"/><rect x={x-6} y={y-6} width={12} height={12} fill={SCENE.beam} stroke={SCENE.underStroke} strokeWidth={STROKE.thin}/></g>)}
      </svg>
      <svg viewBox="0 0 450 300" role="img" aria-label={`Equipment: SID ${s.sidCm} cm; tube angle ${s.tubeAngulationDeg??0} degrees`} className="mx-auto max-h-96 w-full bg-console">
        <title>Current equipment settings</title>
        <rect x="360" y="65" width="18" height="150" fill={SCENE.detector}/>
        <g transform={`translate(${360-Math.min(300,s.sidCm)},140) rotate(${s.tubeAngulationDeg??0})`}>
          <rect x="-20" y="-20" width="40" height="40" rx="4" fill={SCENE.tube}/><line x1="20" y1="0" x2={Math.min(300,s.sidCm)} y2="0" stroke={SCENE.beam} strokeWidth={STROKE.medium}/>
        </g>
        <text x="225" y="250" textAnchor="middle" fill={SCENE.label} fontSize="17">SID {s.sidCm} cm · angle {s.tubeAngulationDeg??0}°</text>
      </svg>
    </div>
    <p className="text-sm">Drag the beam, field edges or marker; beam and marker also use arrow keys. All settings are available below.</p>
    <details><summary className="min-h-11 cursor-pointer py-2">Current settings in text</summary><p className="break-words text-sm">{description}</p></details>
  </figure>;
}
