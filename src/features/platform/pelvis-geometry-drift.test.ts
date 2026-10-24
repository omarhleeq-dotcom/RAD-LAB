import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {expect,it} from 'vitest';

const scene=ts.createSourceFile('PelvisFigure.tsx',readFileSync('src/features/positioning/PelvisFigure.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const icon=ts.createSourceFile('designs.mjs',readFileSync('scripts/library-graphics/designs.mjs','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
function initializer(source:ts.SourceFile,name:string):ts.Expression {
 const found:ts.Expression[]=[];
 function visit(node:ts.Node){
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text===name&&node.initializer)found.push(node.initializer);
  ts.forEachChild(node,visit);
 }
 visit(source);expect(found,`${source.fileName}: one ${name}`).toHaveLength(1);return found[0]!;
}
function points(source:ts.SourceFile,name:string):number[][] {
 const arrays:ts.ArrayLiteralExpression[]=[];
 function visit(node:ts.Node){if(ts.isArrayLiteralExpression(node)&&node.elements.every(ts.isArrayLiteralExpression)){arrays.push(node);return;}ts.forEachChild(node,visit);}
 visit(initializer(source,name));expect(arrays,`${name}: one polygon`).toHaveLength(1);
 return JSON.parse(arrays[0]!.getText(source));
}
function mirror(source:ts.SourceFile,name:string,polygon:number[][]):number[][] {
 const js=ts.transpile(`const mirror=${initializer(source,name).getText(source)}; mirror(points);`,{target:ts.ScriptTarget.ES2022});
 return JSON.parse(JSON.stringify(runInNewContext(js,{points:polygon})));
}

it('keeps shared pelvis polygons and the documented patient-right-to-left icon mirroring in sync with the scene',()=>{
 for(const name of ['wingR','sacrum'])expect(points(icon,name),name).toEqual(points(scene,name));
 const sr=points(scene,'ringR'),ir=points(icon,'ringR');
 expect(ir.filter((_,i)=>i!==6&&i!==7)).toEqual(sr.filter((_,i)=>i!==6&&i!==7));
 for(const name of ['wingR','ringR','femurR']){
  const polygon=points(icon,name),expected=polygon.map(([x,y])=>[2675-x!,y!]);
  expect(mirror(icon,'pm',polygon),name).toEqual(expected);
  expect(mirror(scene,'mirror',polygon),name).toEqual(expected);
  // Guard the use of mirroring as well as its implementation.
  expect(icon.text.replace(/\s/g,'')).toContain(`pts:pm(${name})`);
 }
});

it('pins both sides of the intentional B2b pelvis icon adaptations',()=>{
 // Owner-approved seated femoral heads / angled neck redraw: docs/DECISIONS.md#rad069b2b-owner-2026-10-24
 // Evidence: docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md#المرحلة-b2 (approved in B3).
 expect(points(scene,'ringR')).toEqual([[640,1450],[700,1650],[780,1880],[900,1960],[1100,1960],[1250,1880],[1335,1760],[1330,1690],[1050,1610],[880,1500]]);
 expect(points(icon,'ringR')).toEqual([[640,1450],[700,1650],[780,1880],[900,1960],[1100,1960],[1250,1880],[1337,1760],[1337,1690],[1050,1610],[880,1500]]);
 expect(points(scene,'femurR')).toEqual([[470,1500],[250,1470],[100,1490],[20,1580],[50,1800],[30,2084],[540,2084],[520,1850],[560,1720],[600,1620]]);
 expect(points(icon,'femurR')).toEqual([[470,1330],[330,1390],[200,1420],[100,1470],[20,1580],[50,1800],[40,2084],[330,2084],[340,1860],[420,1740],[540,1620]]);
});
