/* story.js — 「你问 AI 的那句话，要喝掉一口水」7 章引擎 + 科技绘图 + 芯片 Three.js
   范式：GSAP pin 分阶段时序（文字纯位移滑入定格→图渐现+动画→停留→划走→下一块），
   teenager 黑块，高光笔 4 色，图形发光/数字不发光，严格对齐，配色只用卡内 4 色。 */
gsap.registerPlugin(ScrollTrigger);
const C={water:"#5fb6cf",energy:"#d2a24a",ember:"#e0664a",leaf:"#9aab6a",dim:"#9baab2",grid:"rgba(95,182,207,.08)"};
const cl=(v,a=0,b=1)=>v<a?a:v>b?b:v, sm=t=>t*t*(3-2*t), lerp=(a,b,t)=>a+(b-a)*t;
const FNT=(s,w=400)=>`${w} ${s}px 'Noto Sans SC',sans-serif`;
function layer(ctx,alpha,dy,fn){ctx.save();ctx.globalAlpha=alpha;ctx.translate(0,dy);fn();ctx.restore();}
// 通用：N 个黑块随 P 自动均分时序，纯位移滑入定格划走（支持补全文案后任意块数）
function slideBoxes(boxes,P){const Hh=innerHeight,N=boxes.length;
  boxes.forEach((el,i)=>{if(!el)return;const seg=1/N,u=cl((P-i*seg)/seg);
    const tin=sm(cl(u/0.18)),tout=(i===N-1)?0:sm(cl((u-0.82)/0.18));
    el.style.transform=`translateX(-50%) translateY(${(1-tin)*Hh*0.98+tout*(-Hh*1.15)}px)`;});}

/* ---------- 通用引擎 ---------- */
function scene(secId, draws){
  const sec=document.getElementById(secId); if(!sec) return;
  const cv=sec.querySelector('canvas'), ctx=cv.getContext('2d');
  const boxes=[...sec.querySelectorAll('.box')]; const N=boxes.length;
  let P=0,W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
  function rz(){W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
  rz(); addEventListener('resize',rz);
  ScrollTrigger.create({trigger:sec,start:"top top",end:"+="+(N*3400),pin:true,scrub:true,onUpdate:s=>P=s.progress});
  function frame(){
    requestAnimationFrame(frame);
    ctx.clearRect(0,0,W,H);
    const g=Math.max(54,Math.min(96,W*0.07));
    const p={l:g+34,r:W-g,t:H*0.40,b:H*0.86,W,H};
    for(let i=0;i<N;i++){
      const seg=1/N, u=cl((P-i*seg)/seg);
      const tin=sm(cl(u/0.16)), tout=(i===N-1)?0:sm(cl((u-0.84)/0.16));
      boxes[i].style.transform=`translateX(-50%) translateY(${(1-tin)*H*0.98 + tout*(-H*1.15)}px)`;
      const gin=sm(cl((u-0.12)/0.12)), alpha=gin*(1-tout), prog=sm(cl((u-0.18)/0.48));
      if(alpha>0.01 && draws[i]) draws[i](ctx,p,prog,alpha,(1-alpha)*34);
    }
  }
  frame();
}

/* ---------- 绘图组件 ---------- */
// 大数字组（无卡片，左对齐，不发光）
function bignums(items,cols=2){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const big=Math.max(38,Math.min(56,p.W*0.04));
  const colW=(p.r-p.l)/cols, rowH=Math.max(120,(p.b-p.t)/Math.ceil(items.length/cols));
  ctx.textAlign="left";ctx.textBaseline="top";
  items.forEach((it,i)=>{const col=i%cols,row=Math.floor(i/cols);
    const x=p.l+col*colW, y=p.t+row*rowH;
    ctx.fillStyle=it.c||C.ember;ctx.font=FNT(big,900);ctx.fillText(it.big,x,y);
    ctx.fillStyle=C.dim;ctx.font=FNT(14);
    wrap(ctx,it.cap,x,y+big+10,colW-30,21);});
});}
function wrap(ctx,t,x,y,maxW,lh){let line="",yy=y;for(const ch of t){if(ctx.measureText(line+ch).width>maxW){ctx.fillText(line,x,yy);line=ch;yy+=lh;}else line+=ch;}ctx.fillText(line,x,yy);}

// 通用竖柱（发光柱，数字不发光）
function bars(data,hlNames,color){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const ymax=Math.max(...data.map(d=>d.v))*1.1, n=data.length, bw=(p.r-p.l)/n*0.56;
  const yOf=v=>lerp(p.b,p.t,v/ymax);
  ctx.strokeStyle=C.grid;ctx.lineWidth=1;
  for(let k=0;k<=4;k++){const yy=lerp(p.b,p.t,k/4);ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(p.r,yy);ctx.stroke();}
  data.forEach((d,i)=>{const cx=p.l+(i+0.5)/n*(p.r-p.l), h=(p.b-yOf(d.v))*prog, hit=hlNames.includes(d.n);
    if(hit){ctx.shadowColor=color;ctx.shadowBlur=14;ctx.fillStyle=color;}else{ctx.shadowBlur=0;ctx.fillStyle="rgba(200,215,225,.16)";}
    ctx.fillRect(cx-bw/2,p.b-h,bw,h);ctx.shadowBlur=0;
    ctx.fillStyle=C.dim;ctx.font=FNT(14);ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText(d.n,cx,p.b+8);
    ctx.fillStyle=hit?color:C.dim;ctx.font=FNT(14,700);ctx.textBaseline="alphabetic";ctx.fillText(Math.round(d.v*prog),cx,p.b-h-8);});
});}

// 降水对比（宁夏 vs 全国，水青发光）
function rainfall(){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const items=[{n:"宁夏中卫",v:200,hl:1},{n:"全国平均",v:630}], max=700, bw=Math.min(120,(p.r-p.l)*0.16);
  const yOf=v=>lerp(p.b,p.t,v/max);
  items.forEach((d,i)=>{const cx=p.l+(i+0.5)/2*(p.r-p.l)*0.7+(p.r-p.l)*0.12, h=(p.b-yOf(d.v))*prog;
    if(d.hl){ctx.shadowColor=C.water;ctx.shadowBlur=16;ctx.fillStyle=C.water;}else{ctx.shadowBlur=0;ctx.fillStyle="rgba(200,215,225,.16)";}
    ctx.fillRect(cx-bw/2,p.b-h,bw,h);ctx.shadowBlur=0;
    ctx.fillStyle=C.dim;ctx.font=FNT(15);ctx.textAlign="center";ctx.textBaseline="top";ctx.fillText(d.n,cx,p.b+10);
    ctx.fillStyle=d.hl?C.water:C.dim;ctx.font=FNT(20,900);ctx.textBaseline="alphabetic";ctx.fillText(Math.round(d.v*prog)+" mm",cx,p.b-h-10);});
});}

// 水分两路（蒸发粗/废水细，发光流）
function split(){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const sx=p.l+(p.r-p.l)*0.18, sy=(p.t+p.b)/2, ex=p.l+(p.r-p.l)*0.84;
  ctx.lineCap="round";
  // 蒸发（粗，水青，上）
  ctx.shadowColor=C.water;ctx.shadowBlur=14;ctx.strokeStyle=C.water;ctx.lineWidth=34;
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(lerp(sx,ex,.4),sy-10,lerp(sx,ex,.6),p.t+40,lerp(sx,ex,prog),lerp(sy,p.t+40,prog));ctx.stroke();
  // 废水（细，废水红，下）
  ctx.shadowColor=C.ember;ctx.strokeStyle=C.ember;ctx.lineWidth=12;
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(lerp(sx,ex,.4),sy+10,lerp(sx,ex,.6),p.b-40,lerp(sx,ex,prog),lerp(sy,p.b-40,prog));ctx.stroke();
  ctx.shadowBlur=0;
  // 源点
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(sx,sy,5,0,7);ctx.fill();
  ctx.fillStyle=C.dim;ctx.font=FNT(14);ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillText("扛完热的水",sx-30,sy+30);
  if(prog>0.6){const a=cl((prog-0.6)/0.4);ctx.globalAlpha=alpha*a;ctx.textAlign="right";
    ctx.fillStyle=C.water;ctx.font=FNT(20,900);ctx.fillText("蒸发 70–80%",ex+40,p.t+44);
    ctx.fillStyle=C.dim;ctx.font=FNT(13);ctx.fillText("升空 · 多在别处降雨",ex+40,p.t+66);
    ctx.fillStyle=C.ember;ctx.font=FNT(20,900);ctx.fillText("废水 20–30%",ex+40,p.b-40);
    ctx.fillStyle=C.dim;ctx.font=FNT(13);ctx.fillText("含盐/杀菌剂 · 回不去",ex+40,p.b-18);}
});}

// 电价发光曲线（账单章第一版，认可样式）
const PRICE=[[2016,8.5],[2018,9.3],[2020,10.4],[2022,11.7],[2024,13.2],[2026,14.7]];
function price(){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const Y0=8.5, xOf=yr=>lerp(p.l,p.r,(yr-2016)/10), yOf=c=>lerp(p.b,p.t,(c-7)/9);
  const at=pr=>{const yr=2016+10*pr;let i=0;while(i<PRICE.length-1&&PRICE[i+1][0]<yr)i++;const[x0,v0]=PRICE[i],[x1,v1]=PRICE[Math.min(i+1,PRICE.length-1)];const f=x1===x0?0:(yr-x0)/(x1-x0);return{yr,c:lerp(v0,v1,f)};};
  ctx.strokeStyle=C.grid;ctx.lineWidth=1;
  for(let gx=p.l;gx<=p.r+1;gx+=(p.r-p.l)/10){ctx.beginPath();ctx.moveTo(gx,p.t-18);ctx.lineTo(gx,p.b);ctx.stroke();}
  for(let gy=p.t;gy<=p.b+1;gy+=(p.b-p.t)/5){ctx.beginPath();ctx.moveTo(p.l,gy);ctx.lineTo(p.r,gy);ctx.stroke();}
  ctx.fillStyle=C.dim;ctx.font=FNT(14);ctx.textAlign="center";for(let yr=2016;yr<=2026;yr+=2)ctx.fillText(yr,xOf(yr),p.b+22);
  ctx.textAlign="right";for(const c of[8,11,14])ctx.fillText(c+"¢",p.l-10,yOf(c)+4);
  ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowColor="rgba(224,102,74,.55)";ctx.shadowBlur=16;ctx.strokeStyle=C.ember;ctx.lineWidth=3;ctx.beginPath();
  for(let i=0;i<=120;i++){const d=at(i/120*prog);i===0?ctx.moveTo(xOf(d.yr),yOf(d.c)):ctx.lineTo(xOf(d.yr),yOf(d.c));}ctx.stroke();ctx.shadowBlur=0;
  const cur=at(prog),cx=xOf(cur.yr),cy=yOf(cur.c);
  const grad=ctx.createLinearGradient(0,p.t,0,p.b);grad.addColorStop(0,"rgba(224,102,74,.18)");grad.addColorStop(1,"rgba(224,102,74,0)");
  ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(p.l,p.b);for(let i=0;i<=120;i++){const d=at(i/120*prog);ctx.lineTo(xOf(d.yr),yOf(d.c));}ctx.lineTo(cx,p.b);ctx.closePath();ctx.fill();
  ctx.fillStyle="#fff";ctx.shadowColor=C.ember;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(cx,cy,4,0,7);ctx.fill();ctx.shadowBlur=0;
  const cyEnd=yOf(14.7),yTop=cyEnd-90,big=Math.max(50,Math.min(78,p.W*0.052)),pct=Math.round((cur.c-Y0)/Y0*100);
  ctx.textAlign="left";ctx.textBaseline="top";ctx.fillStyle=C.ember;ctx.font=FNT(big,700);ctx.fillText("+"+pct+"%",p.l,yTop);
  ctx.fillStyle=C.dim;ctx.font=FNT(14);ctx.fillText(cur.c.toFixed(1)+" ¢/kWh",p.l,yTop+big+2);
  if(prog>0.9){const aa=cl((prog-0.9)/0.1);ctx.setLineDash([3,3]);ctx.strokeStyle=`rgba(224,102,74,${aa})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx-10,cy-72);ctx.stroke();ctx.setLineDash([]);
    ctx.textAlign="right";ctx.textBaseline="alphabetic";
    ctx.fillStyle=`rgba(255,255,255,${aa})`;ctx.font=FNT(16,700);ctx.fillText("$940.08",cx-14,cy-76);
    ctx.fillStyle=`rgba(205,214,218,${aa})`;ctx.font=FNT(13);ctx.fillText("2026·2 月 Rebecca 的一张电费单",cx-14,cy-56);
    ctx.fillStyle=`rgba(224,102,74,${aa})`;ctx.font=FNT(13,700);ctx.fillText("超过她当月全部收入",cx-14,cy-38);}
});}

// 点阵（166 格，90 格金色点亮）
function dots(total,litMax,color,label){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const cols=21,rows=Math.ceil(total/cols),litN=Math.round(litMax*prog);
  const y0=p.t+54,availH=p.b-y0,cellW=(p.r-p.l)/cols,cellH=availH/rows,s=Math.min(cellW,cellH)*0.6;
  for(let i=0;i<total;i++){const col=i%cols,row=Math.floor(i/cols),x=p.l+col*cellW+(cellW-s)/2,y=y0+row*cellH+(cellH-s)/2;
    if(i<litN){ctx.shadowColor=color;ctx.shadowBlur=9;ctx.fillStyle=color;}else{ctx.shadowBlur=0;ctx.fillStyle="rgba(200,215,225,.10)";}
    ctx.fillRect(x,y,s,s);}
  ctx.shadowBlur=0;const bx=p.l+(cellW-s)/2,big=Math.max(40,Math.min(60,p.W*0.044));
  ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle=color;ctx.font=FNT(big,700);ctx.fillText(litN+" / "+total+" 吉瓦",bx,y0-32);
  ctx.fillStyle=C.dim;ctx.font=FNT(14);ctx.fillText(label,bx,y0-12);
});}

// 量筒（0.32→519ml，水青发光水面）
function cylinder(){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const lo=Math.log(0.32),hi=Math.log(519),val=Math.exp(lo+(hi-lo)*prog);
  const gw=Math.min(180,(p.r-p.l)*0.2),gh=(p.b-p.t)*0.82,gx=(p.l+p.r)/2-gw/2,gy=p.t+(p.b-p.t)*0.08;
  ctx.strokeStyle="rgba(150,180,190,.45)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.lineTo(gx+gw,gy);ctx.stroke();
  ctx.fillStyle=C.dim;ctx.font=FNT(12);ctx.textAlign="right";
  for(const m of[0,130,260,390,519]){const yy=gy+gh-(m/519)*gh;ctx.strokeStyle="rgba(140,160,170,.18)";ctx.beginPath();ctx.moveTo(gx,yy);ctx.lineTo(gx+gw,yy);ctx.stroke();ctx.fillText(m+"",gx-8,yy+4);}
  const wh=(val/519)*gh,wy=gy+gh-wh,grad=ctx.createLinearGradient(0,wy,0,gy+gh);
  grad.addColorStop(0,"rgba(95,182,207,.92)");grad.addColorStop(1,"rgba(35,95,112,.95)");
  ctx.fillStyle=grad;ctx.shadowColor="rgba(95,182,207,.4)";ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(gx,gy+gh);ctx.lineTo(gx,wy);ctx.lineTo(gx+gw,wy);ctx.lineTo(gx+gw,gy+gh);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle=C.ember;ctx.lineWidth=1.5;const l032=gy+gh-(0.32/519)*gh;ctx.beginPath();ctx.moveTo(gx,l032);ctx.lineTo(gx+gw+44,l032);ctx.stroke();
  ctx.fillStyle=C.ember;ctx.font=FNT(12);ctx.textAlign="left";ctx.fillText("企业说的 0.32ml 就这条线 ↑",gx+gw+8,l032-6);
  const big=Math.max(40,Math.min(64,p.W*0.045));
  ctx.fillStyle="#fff";ctx.font=FNT(big,900);ctx.textAlign="center";ctx.textBaseline="alphabetic";
  ctx.fillText(val<10?val.toFixed(2):Math.round(val)+"",(p.l+p.r)/2,gy-14);
  ctx.fillStyle=C.water;ctx.font=FNT(15,700);ctx.fillText(prog<0.5?"毫升 · 企业口径":"毫升 · 学术口径（算上发电）",(p.l+p.r)/2,gy+gh+30);
});}

// 系统总览（水电进、污染出、绕成一个圈）发光流
function flow(){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const cxp=(p.l+p.r)/2,cyp=(p.t+p.b)/2,bw=120,bh=84;
  const dash=(x1,y1,x2,y2,col,w)=>{ctx.setLineDash([6,8]);ctx.lineDashOffset=-(performance.now?0:0);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.shadowColor=col;ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.shadowBlur=0;ctx.setLineDash([]);};
  const rv=cl(prog*1.3);
  // 取水→机房
  dash(p.l+60,cyp,cxp-bw/2,cyp,C.water,14);
  // 机房盒
  ctx.fillStyle="rgba(38,52,60,.96)";ctx.strokeStyle="rgba(180,205,215,.25)";ctx.lineWidth=1;ctx.fillRect(cxp-bw/2,cyp-bh/2,bw,bh);ctx.strokeRect(cxp-bw/2,cyp-bh/2,bw,bh);
  ctx.fillStyle="#fff";ctx.font=FNT(14,700);ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("数据中心",cxp,cyp-6);
  ctx.fillStyle=C.dim;ctx.font=FNT(11);ctx.fillText("芯片烧电·水扛热",cxp,cyp+14);
  // 蒸发↑ 废水↓
  if(rv>0.4){dash(cxp+bw/2,cyp-10,p.r-40,p.t+50,C.water,16);dash(cxp+bw/2,cyp+10,p.r-40,p.b-50,C.ember,8);}
  // CO₂ → 绕回取水（闭环）
  if(rv>0.7){const a=cl((rv-0.7)/0.3);ctx.globalAlpha=alpha*a;
    ctx.setLineDash([4,8]);ctx.strokeStyle=C.leaf;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.r-40,p.t+50);ctx.bezierCurveTo(cxp,p.t-30,p.l,p.t-10,p.l+60,cyp-30);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=C.leaf;ctx.font=FNT(13);ctx.textAlign="center";ctx.fillText("CO₂ 加剧干旱 → 下一口水更紧",cxp,p.t-16);}
  // 标注
  ctx.textBaseline="alphabetic";ctx.fillStyle=C.water;ctx.font=FNT(13);ctx.textAlign="left";ctx.fillText("取水口",p.l+40,cyp-20);
  if(rv>0.4){ctx.textAlign="right";ctx.fillStyle=C.water;ctx.font=FNT(14,700);ctx.fillText("蒸发 70–80%",p.r-40,p.t+44);ctx.fillStyle=C.ember;ctx.fillText("废水 20–30%",p.r-40,p.b-40);}
});}

// 单位图：N 个小格 = N 个真实单位（人/台/公顷），逐个点亮；读数用 +73% 标准大小/位置
function unitChart(total,color,big,sub){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const y0=p.t+92,availW=p.r-p.l,availH=p.b-y0;
  let cols=Math.max(8,Math.round(Math.sqrt(total*availW/Math.max(1,availH))));
  const rows=Math.ceil(total/cols),cw=availW/cols,ch=availH/rows,s=Math.max(1.5,Math.min(cw,ch)*0.6);
  const litN=Math.round(total*prog);
  for(let i=0;i<total;i++){const c=i%cols,r=Math.floor(i/cols),x=p.l+c*cw+(cw-s)/2,y=y0+r*ch+(ch-s)/2;
    if(i<litN){ctx.shadowColor=color;ctx.shadowBlur=5;ctx.fillStyle=color;}else{ctx.shadowBlur=0;ctx.fillStyle="rgba(200,215,225,.08)";}
    ctx.fillRect(x,y,s,s);}
  ctx.shadowBlur=0;const bf=Math.max(50,Math.min(78,p.W*0.052));
  ctx.textAlign="left";ctx.textBaseline="top";ctx.fillStyle=color;ctx.font=FNT(bf,700);ctx.fillText(big,p.l,p.t);
  ctx.fillStyle=C.dim;ctx.font=FNT(15);ctx.fillText(sub,p.l+4,p.t+bf+6);
});}
// 趋势线（有时间变化才用）：读数 +73% 标准
function trend(pts,ydom,color,big,sub){return (ctx,p,prog,alpha,dy)=>layer(ctx,alpha,dy,()=>{
  const x0=pts[0][0],x1=pts[pts.length-1][0],t=p.t+96;
  const xOf=v=>lerp(p.l,p.r,(v-x0)/(x1-x0)),yOf=v=>lerp(p.b,t,(v-ydom[0])/(ydom[1]-ydom[0]));
  ctx.strokeStyle=C.grid;ctx.lineWidth=1;for(let k=0;k<=4;k++){const yy=lerp(p.b,t,k/4);ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(p.r,yy);ctx.stroke();}
  ctx.fillStyle=C.dim;ctx.font=FNT(14);ctx.textAlign="center";ctx.textBaseline="top";for(const pt of pts)ctx.fillText(pt[0],xOf(pt[0]),p.b+8);
  ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowColor=color;ctx.shadowBlur=14;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();
  const N=80;for(let i=0;i<=N;i++){const f=i/N*prog,xx=lerp(x0,x1,f);let j=0;while(j<pts.length-1&&pts[j+1][0]<xx)j++;
    const a=pts[j],bb=pts[Math.min(j+1,pts.length-1)],ff=bb[0]===a[0]?0:(xx-a[0])/(bb[0]-a[0]),yv=lerp(a[1],bb[1],ff);
    i===0?ctx.moveTo(xOf(xx),yOf(yv)):ctx.lineTo(xOf(xx),yOf(yv));}
  ctx.stroke();ctx.shadowBlur=0;const bf=Math.max(50,Math.min(78,p.W*0.052));
  ctx.textAlign="left";ctx.textBaseline="top";ctx.fillStyle=color;ctx.font=FNT(bf,700);ctx.fillText(big,p.l,p.t);
  ctx.fillStyle=C.dim;ctx.font=FNT(15);ctx.fillText(sub,p.l+4,p.t+bf+6);
});}

/* ---------- 注册 7 章（s1 取水、s3 水分两路、chip 芯片为 3D；s4 烟囱为 3D，单独写） ---------- */
/* ⑤ 账单：一条持续的电价曲线（2016→2026 时间序列，画一次并保持），文字滑过它；后段切到负荷点阵 */
(function s5Scene(){
  const sec=document.getElementById('s5'); if(!sec) return;
  const cv=sec.querySelector('canvas'),ctx=cv.getContext('2d');
  const boxes=[...sec.querySelectorAll('.box')];
  let P=0,W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
  function rz(){W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
  rz();addEventListener('resize',rz);
  ScrollTrigger.create({trigger:sec,start:"top top",end:"+="+(boxes.length*3400),pin:true,scrub:true,onUpdate:s=>P=s.progress});
  const drawPrice=price(),drawDots=dots(166,90,C.energy,"每格 1 吉瓦 · 亮起的是数据中心新增用电，约占新增的一半");
  function frame(){requestAnimationFrame(frame);
    ctx.clearRect(0,0,W,H);
    const g=Math.max(54,Math.min(96,W*0.07)),p={l:g+34,r:W-g,t:H*0.40,b:H*0.86,W,H};
    const curveP=sm(cl(P/0.46));           // 曲线只画一次（前两段），画完保持，不随每块重放
    const toDots=sm(cl((P-0.62)/0.08));    // 讲到负荷时，曲线交叉淡出 → 点阵
    if(toDots<1) drawPrice(ctx,p,curveP,1-toDots,0);
    if(toDots>0) drawDots(ctx,p,sm(cl((P-0.66)/0.3)),toDots,(1-toDots)*30);
    slideBoxes(boxes,P);
  }
  frame();
})();

/* ---------- 章节过渡：炫酷 pin（大编号水光扫亮 + 标题滑入 + 上升水粒子 + 扫光线） ---------- */
document.querySelectorAll('.ctrans').forEach(sec=>{
  const cv=sec.querySelector('canvas'),ctx=cv.getContext('2d');
  const NN=sec.dataset.n,KK=sec.dataset.k,TT=sec.dataset.t;
  let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
  function rz(){W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
  rz();addEventListener('resize',rz);
  const parts=Array.from({length:64},()=>({x:Math.random(),y:Math.random(),s:0.2+Math.random()*0.6,r:0.8+Math.random()*1.8}));
  function frame(){requestAnimationFrame(frame);
    // 不 pin：随过渡卡自身滚过视口算进度（滑入→扫亮→滑出），避免与相邻 pin 冲突
    const rect=sec.getBoundingClientRect(), secH=sec.offsetHeight||H;
    const P=cl((H-rect.top)/(H+secH));
    ctx.fillStyle="#1a2632";ctx.fillRect(0,0,W,H);
    const ein=sm(cl(P/0.42)),eout=sm(cl((P-0.58)/0.42)),A=ein*(1-eout),sweep=sm(cl((P-0.2)/0.5));
    ctx.strokeStyle="rgba(95,182,207,.05)";ctx.lineWidth=1;
    for(let gx=0;gx<=W;gx+=W/16){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
    for(let gy=0;gy<=H;gy+=H/9){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}
    parts.forEach(pt=>{pt.y-=pt.s*0.0016;if(pt.y<0){pt.y=1;pt.x=Math.random();}ctx.fillStyle=`rgba(95,182,207,${0.28*A})`;ctx.beginPath();ctx.arc(pt.x*W,pt.y*H,pt.r,0,7);ctx.fill();});
    const cxp=W*0.5,cyp=H*0.45,nf=Math.min(H*0.52,W*0.34);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`900 ${nf}px 'Noto Sans SC',sans-serif`;
    ctx.strokeStyle=`rgba(95,182,207,${0.20*A})`;ctx.lineWidth=2;ctx.strokeText(NN,cxp,cyp);
    const nw=ctx.measureText(NN).width;
    ctx.save();ctx.beginPath();ctx.rect(cxp-nw/2,0,nw*sweep,H);ctx.clip();
    ctx.shadowColor="rgba(95,182,207,.6)";ctx.shadowBlur=26;ctx.fillStyle=`rgba(95,182,207,${0.9*A})`;ctx.fillText(NN,cxp,cyp);ctx.restore();ctx.shadowBlur=0;
    const lx=lerp(cxp-nw/2,cxp+nw/2,sweep);
    if(sweep<0.99&&A>0.05){ctx.strokeStyle=`rgba(190,235,245,${A*0.6})`;ctx.lineWidth=2;ctx.shadowColor="rgba(95,182,207,.8)";ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(lx,cyp-nf*0.42);ctx.lineTo(lx,cyp+nf*0.42);ctx.stroke();ctx.shadowBlur=0;}
    const ty=H*0.80+(1-ein)*44;ctx.textBaseline="alphabetic";
    ctx.fillStyle=`rgba(138,150,156,${A})`;ctx.font=`500 14px 'Noto Sans SC',sans-serif`;ctx.fillText(KK,cxp,ty);
    ctx.fillStyle=`rgba(255,255,255,${A})`;ctx.font=`900 ${Math.max(24,Math.min(38,W*0.025))}px 'Noto Sans SC',sans-serif`;ctx.fillText(TT,cxp,ty+36);
  }
  frame();
});

/* ---------- ① 取水：3D 水柱阵列被抽干（与芯片同款 3D 语言） ---------- */
(function intakeScene(){
  const stage=document.getElementById('s1-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.020);
  const cam=new THREE.PerspectiveCamera(52,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:true,canvas:document.getElementById('s1-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x40505a,0.95));const key=new THREE.DirectionalLight(0xcfe6ec,0.6);key.position.set(5,12,7);sc.add(key);
  // 干裂地面（网格平面）
  const grid=new THREE.GridHelper(40,28,0x2a3a40,0x1a2730);grid.position.y=0;sc.add(grid);
  // 数据中心建筑（抽水的主体，立在水柱中间）
  const dc=new THREE.Group();sc.add(dc);
  for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(2.4,3.4,2.6),new THREE.MeshStandardMaterial({color:0x2a3640,emissive:0x16323b,emissiveIntensity:.5,metalness:.5,roughness:.4}));m.position.set((i-1)*3.4,1.7,-12.5);const e=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0x5fb6cf,transparent:true,opacity:.45}));m.add(e);dc.add(m);}
  // 水柱阵列：半透明水青、发光、随滚动逐列塌缩（被抽干）
  const N=14,sp=1.5,baseH=4,geo=new THREE.BoxGeometry(0.78,1,0.78);
  const cols=[],grp=new THREE.Group();sc.add(grp);const cc=(N-1)/2;
  for(let x=0;x<N;x++)for(let z=0;z<N;z++){
    const mat=new THREE.MeshStandardMaterial({color:0x2f7d92,emissive:0x2f7d92,emissiveIntensity:.5,transparent:true,opacity:.62,metalness:.2,roughness:.35});
    const m=new THREE.Mesh(geo,mat);m.position.set((x-cc)*sp,baseH/2,(z-cc)*sp);m.scale.y=baseH;
    const ed=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x6fc8dc,transparent:true,opacity:.5}));m.add(ed);
    const delay=((x)+(z))/(2*N); // 对角抽干波
    cols.push({m,mat,delay});grp.add(m);
  }
  // 抽水水流：水从水柱被抽向数据中心（看得出流向）
  const dcPos=new THREE.Vector3(0,2.6,-12);
  const NF=220,fg=new THREE.BufferGeometry(),fp=new Float32Array(NF*3),fst=new Float32Array(NF),fsx=new Float32Array(NF),fsz=new Float32Array(NF);
  function seedFlow(i){fst[i]=Math.random();fsx[i]=(Math.random()-.5)*N*sp*0.85;fsz[i]=(Math.random()-.5)*N*sp*0.6+2;}
  for(let i=0;i<NF;i++)seedFlow(i);fg.setAttribute('position',new THREE.BufferAttribute(fp,3));
  const flow=new THREE.Points(fg,new THREE.PointsMaterial({color:0x9fe0ee,size:.17,transparent:true,opacity:0,depthWrite:false}));sc.add(flow);
  let P=0;ScrollTrigger.create({trigger:"#s1-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const drainedV=document.getElementById('s1-drained');
  // 黑块滑入
  const cbs=[...stage.querySelectorAll('.cbox')];
  function animate(){requestAnimationFrame(animate);
    grp.rotation.y=Math.sin(P*0.5)*0.04;
    const camP=sm(cl((P-0.6)/0.4)),r=lerp(15,26,camP),hgt=lerp(8,17,camP);
    cam.position.set(Math.sin(0.3)*r,hgt,Math.cos(0.3)*r);cam.lookAt(0,2,0);
    let sum=0;
    for(const c of cols){const dp=sm(cl((P-0.16-c.delay*0.5)/0.42)); // 抽干进度
      const h=lerp(baseH,0.06,dp);c.m.scale.y=h;c.m.position.y=h/2;
      c.mat.opacity=lerp(.62,.12,dp);c.mat.emissiveIntensity=lerp(.5,.08,dp);
      sum+=dp;}
    drainedV.textContent=Math.round(sum/cols.length*290);
    const flowOn=sm(cl((P-0.1)/0.4));flow.material.opacity=flowOn*0.85;
    for(let i=0;i<NF;i++){fst[i]+=0.012;if(fst[i]>1)seedFlow(i);const t=fst[i];
      fp[i*3]=lerp(fsx[i],dcPos.x,t);fp[i*3+1]=lerp(3,dcPos.y,t)+Math.sin(t*Math.PI)*1.6;fp[i*3+2]=lerp(fsz[i],dcPos.z,t);}
    fg.attributes.position.needsUpdate=true;
    slideBoxes(cbs,P);rdr.render(sc,cam);}
  animate();
  addEventListener('resize',()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();rdr.setSize(W(),H());});
})();

/* ---------- ④ 不只是水：3D 冒烟电厂为持续舞台（厂房+3 烟囱+234 台柴油机阵列+棕烟越冒越浓），
   逐块换 HUD 读数；碳强度对比/碳排趋势这两块切到 2D 图表 overlay（盖在变暗的 3D 上） ---------- */
(function emitScene(){
  const stage=document.getElementById('s4-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.018);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:true,canvas:document.getElementById('s4-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x46565f,0.95));
  const key=new THREE.DirectionalLight(0xcfe6ec,0.65);key.position.set(7,12,8);sc.add(key);
  const rim=new THREE.DirectionalLight(0xe0a060,0.35);rim.position.set(-6,5,-6);sc.add(rim);
  const grid=new THREE.GridHelper(60,32,0x2a3a40,0x18222a);sc.add(grid);
  const grp=new THREE.Group();sc.add(grp);
  // 数据中心厂房（带边线，与其它章节一致的科技线框语言）
  const hallMat=new THREE.MeshStandardMaterial({color:0x243038,emissive:0x14202a,emissiveIntensity:.32,metalness:.45,roughness:.5});
  const hall=new THREE.Mesh(new THREE.BoxGeometry(6.4,1.7,3.6),hallMat);hall.position.y=0.85;grp.add(hall);
  hall.add(new THREE.LineSegments(new THREE.EdgesGeometry(hall.geometry),new THREE.LineBasicMaterial({color:0x5fb6cf,transparent:true,opacity:.4})));
  // 厂房顶散热风扇（小圆盘点缀，体现机房）
  for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.12,18),new THREE.MeshStandardMaterial({color:0x32434c,emissive:0x16262e,metalness:.6,roughness:.4}));f.position.set((i-1)*1.7,1.74,0.7);grp.add(f);}
  // 3 根烟囱：锥筒身 + 顶部环口（torus）+ 内壁深色，细节更足
  const stMat=new THREE.MeshStandardMaterial({color:0x2c3942,emissive:0x1a2630,emissiveIntensity:.25,metalness:.55,roughness:.5});
  const mouths=[];[-2.1,0,2.1].forEach(x=>{
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.46,3.6,20),stMat);body.position.set(x,2.55,-0.7);grp.add(body);
    const lip=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.07,10,22),new THREE.MeshStandardMaterial({color:0x3a4a52,emissive:0x20303a,metalness:.6,roughness:.4}));
    lip.rotation.x=Math.PI/2;lip.position.set(x,4.35,-0.7);grp.add(lip);
    mouths.push(new THREE.Vector3(x,4.35,-0.7));
  });
  // 234 台柴油发电机：26×9 阵列小箱（一证一台），随空气段亮起
  const NU=234,uCols=26,ug=new THREE.Group();ug.position.set(0,0,3.2);grp.add(ug);
  const uGeo=new THREE.BoxGeometry(0.26,0.2,0.34),uMat=new THREE.MeshStandardMaterial({color:0x3a3026,emissive:0x2a1c10,emissiveIntensity:.2,metalness:.3,roughness:.6});
  const units=[];for(let i=0;i<NU;i++){const c=i%uCols,r=Math.floor(i/uCols);
    const m=new THREE.Mesh(uGeo,uMat.clone());m.position.set((c-(uCols-1)/2)*0.42,0.1,r*0.46);ug.add(m);units.push(m);}
  // 棕烟粒子：从 3 个烟囱口升腾扩散，越冒越浓
  const NS=620,sg=new THREE.BufferGeometry(),spos=new Float32Array(NS*3),sst=new Float32Array(NS),sox=new Float32Array(NS),soz=new Float32Array(NS);
  function seedSmoke(i){const m=mouths[Math.floor(Math.random()*3)];spos[i*3]=m.x+(Math.random()-.5)*0.3;spos[i*3+1]=m.y+Math.random()*0.4;spos[i*3+2]=m.z+(Math.random()-.5)*0.3;sst[i]=Math.random();sox[i]=(Math.random()-.5);soz[i]=(Math.random()-.5)*0.6;}
  for(let i=0;i<NS;i++)seedSmoke(i);sg.setAttribute('position',new THREE.BufferAttribute(spos,3));
  const smoke=new THREE.Points(sg,new THREE.PointsMaterial({color:0xb08a6a,size:.32,transparent:true,opacity:0,depthWrite:false}));sc.add(smoke);

  // 2D 图表 overlay（碳强度柱 / 碳排趋势）
  const cv2=document.getElementById('s4-2d'),x2=cv2.getContext('2d');
  let DPR=Math.min(devicePixelRatio||1,2),CW=0,CH=0;
  function rz2(){CW=innerWidth;CH=innerHeight;cv2.width=CW*DPR;cv2.height=CH*DPR;x2.setTransform(DPR,0,0,DPR,0,0);}
  rz2();addEventListener('resize',rz2);
  const drawBars=bars([{n:"挪威",v:25},{n:"法国",v:40},{n:"德国",v:336},{n:"美国",v:386},{n:"中国",v:555},{n:"印度",v:705},{n:"波兰",v:716}],["挪威","波兰"],C.leaf);
  const drawTrend=trend([[2024,1.8],[2027,2.8],[2030,4.0]],[0,4.5],C.leaf,"4 亿吨","数据中心相关碳排：2024 → 2030 翻倍多（亿吨二氧化碳）");

  // 逐块 HUD 文案（图表块 3/4 不显示读数，交给图表自身大数字）
  const HUD=[
    null,
    {v:"+79%",c:"var(--ember)",u:"xAI 孟菲斯厂区投运后紧邻 NO₂ 峰值 · 一张许可证就列着 234 台柴油机"},
    {v:"~1300 人",c:"var(--ember)",u:"2030 年数据中心空气污染每年最多致提前死亡 · 约 200 亿美元健康损失"},
    null,null,
    {v:"3,240 兆瓦",c:"var(--energy)",u:"2025 年美国能源部下令保留 5 座退役燃煤待命 · 宾州一座仅 0.5% 负荷"},
    {v:"7.4 万公顷",c:"var(--water)",u:"2021 台湾大旱被停灌的农田 · 水优先供给芯片工厂"}
  ];
  const hudEl=document.getElementById('s4-hud'),vEl=document.getElementById('s4-v'),uEl=document.getElementById('s4-u');
  let hudIdx=-1;

  let P=0,N=7;ScrollTrigger.create({trigger:"#s4-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const cbs=[...stage.querySelectorAll('.cbox')];
  function animate(){requestAnimationFrame(animate);
    grp.rotation.y=Math.sin(P*0.6)*0.06;
    // 揭示式相机：先近看烟囱口，再拉远露出整座厂区+柴油阵列+烟羽
    const camP=sm(cl(P/0.55)),r=lerp(11,21,camP),hgt=lerp(4.5,9,camP);
    cam.position.set(Math.sin(0.42)*r,hgt,Math.cos(0.42)*r);cam.lookAt(0,lerp(3.6,2.2,camP),0.6);
    // 烟越冒越浓
    const on=sm(cl((P-0.04)/0.6));smoke.material.opacity=on*0.52;
    for(let i=0;i<NS;i++){sst[i]+=0.005*(0.4+on);if(sst[i]>1)seedSmoke(i);
      spos[i*3+1]+=0.052*(0.4+on);spos[i*3]+=sox[i]*0.012;spos[i*3+2]+=soz[i]*0.004;
      if(spos[i*3+1]>14)seedSmoke(i);}
    sg.attributes.position.needsUpdate=true;
    // 柴油阵列在空气段（块 1）逐台亮起
    const litF=sm(cl((P-0.10)/0.16)),litN=Math.round(NU*litF);
    for(let i=0;i<NU;i++){const e=i<litN?0.55:0.2;if(Math.abs(units[i].material.emissiveIntensity-e)>0.01)units[i].material.emissiveIntensity=e;}

    // 2D overlay：碳强度柱（块3）/ 碳排趋势（块4），并在其后铺暗幕让 3D 退后
    x2.clearRect(0,0,CW,CH);
    const g=Math.max(54,Math.min(96,CW*0.07)),pp={l:g+34,r:CW-g,t:CH*0.40,b:CH*0.86,W:CW,H:CH};
    const seg=1/N;
    const ua=cl((P-3*seg)/seg),a3i=sm(cl((ua-0.12)/0.12)),a3o=sm(cl((ua-0.84)/0.16)),al3=a3i*(1-a3o),pr3=sm(cl((ua-0.18)/0.48));
    const ub=cl((P-4*seg)/seg),a4i=sm(cl((ub-0.12)/0.12)),a4o=sm(cl((ub-0.84)/0.16)),al4=a4i*(1-a4o),pr4=sm(cl((ub-0.18)/0.48));
    const veil=Math.max(al3,al4);
    if(veil>0.01){x2.save();x2.globalAlpha=veil*0.82;x2.fillStyle="#16222c";x2.fillRect(0,0,CW,CH);x2.restore();}
    if(al3>0.01) drawBars(x2,pp,pr3,al3,(1-al3)*34);
    if(al4>0.01) drawTrend(x2,pp,pr4,al4,(1-al4)*34);

    // HUD：选当前最居中的块；图表块隐藏读数
    let best=0,bs=-1;for(let i=0;i<N;i++){const u=cl((P-i*seg)/seg);const tin=sm(cl(u/0.16)),tout=(i===N-1)?0:sm(cl((u-0.84)/0.16));const pres=tin*(1-tout);if(pres>bs){bs=pres;best=i;}}
    const want=HUD[best];
    if(want){if(hudIdx!==best){hudIdx=best;vEl.textContent=want.v;vEl.style.color=want.c;uEl.textContent=want.u;}hudEl.style.opacity=1;}
    else{hudEl.style.opacity=0;hudIdx=-1;}

    slideBoxes(cbs,P);rdr.render(sc,cam);}
  animate();
  addEventListener('resize',()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();rdr.setSize(W(),H());});
})();

/* ---------- ⑦ 系统总览：3D 循环（水进/电进 → 蒸发/废水/碳 → 绕回取水） ---------- */
(function loopScene(){
  const stage=document.getElementById('s7-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.015);
  const cam=new THREE.PerspectiveCamera(52,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:true,canvas:document.getElementById('s7-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x4a5a64,1));const key=new THREE.DirectionalLight(0xcfe6ec,0.6);key.position.set(5,10,7);sc.add(key);
  // 中心数据中心
  const box=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.6,2.4),new THREE.MeshStandardMaterial({color:0x26343c,emissive:0x16323b,emissiveIntensity:.3,metalness:.4,roughness:.5}));sc.add(box);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry),new THREE.LineBasicMaterial({color:0x5fb6cf,transparent:true,opacity:.4}));box.add(edge);
  // 闭环轨道点（水进→机房→蒸发→碳→绕回），粒子沿环流动
  const R=6, ring=[]; for(let i=0;i<5;i++){const a=i/5*Math.PI*2-Math.PI/2;ring.push(new THREE.Vector3(Math.cos(a)*R,Math.sin(a)*1.2,Math.sin(a)*R));}
  const cols=[0x5fb6cf,0xd2a24a,0xdce9ed,0x9aab6a,0xe0664a]; // 水/电/蒸汽/碳/废水
  const NP=240,pg=new THREE.BufferGeometry(),pp=new Float32Array(NP*3),pt=new Float32Array(NP),pc=new Float32Array(NP*3);
  function bez(t){const seg=t*5,i=Math.floor(seg)%5,f=seg-Math.floor(seg);const a=ring[i],b=ring[(i+1)%5];
    return {x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f)+Math.sin(f*Math.PI)*0.6,z:lerp(a.z,b.z,f),c:cols[i]};}
  for(let i=0;i<NP;i++){pt[i]=Math.random();}
  pg.setAttribute('position',new THREE.BufferAttribute(pp,3));pg.setAttribute('color',new THREE.BufferAttribute(pc,3));
  const flow=new THREE.Points(pg,new THREE.PointsMaterial({size:.34,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));sc.add(flow);
  let P=0;ScrollTrigger.create({trigger:"#s7-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const cntV=document.getElementById('s7-cnt');
  const cbs=[...stage.querySelectorAll('.cbox')];
  function animate(){requestAnimationFrame(animate);
    sc.rotation.y=0.42;sc.rotation.x=0.12;   // 固定 3/4 视角，别一直转（看清这个圈）
    cam.position.set(0,4,16);cam.lookAt(0,0,0);
    const reveal=cl(P*1.2);
    for(let i=0;i<NP;i++){pt[i]+=0.0016;if(pt[i]>1)pt[i]=0;
      const show=pt[i]<reveal?1:0;const b=bez(pt[i]);
      pp[i*3]=b.x;pp[i*3+1]=b.y;pp[i*3+2]=b.z;
      const c=new THREE.Color(b.c);pc[i*3]=c.r*show;pc[i*3+1]=c.g*show;pc[i*3+2]=c.b*show;}
    pg.attributes.position.needsUpdate=true;pg.attributes.color.needsUpdate=true;
    cntV.textContent=Math.round(sm(cl((P-0.5)/0.4))*25);
    slideBoxes(cbs,P);rdr.render(sc,cam);}
  animate();
  addEventListener('resize',()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();rdr.setSize(W(),H());});
})();

/* ---------- ⑥ 算不清：3D 水球体积对比（0.32 vs 519，差一千倍做成物理体积） ---------- */
(function volumeScene(){
  const stage=document.getElementById('s6-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.012);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:true,canvas:document.getElementById('s6-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x44555f,0.9));
  const key=new THREE.DirectionalLight(0xffffff,1.2);key.position.set(6,9,8);sc.add(key);
  const key2=new THREE.DirectionalLight(0x5fb6cf,0.5);key2.position.set(-7,3,-4);sc.add(key2);
  // 真实水材质：透射折射 + 清漆湿亮 + 体积色衰减
  function water(){return new THREE.MeshPhysicalMaterial({color:0x9fdcec,roughness:0.06,metalness:0,transmission:0.92,thickness:3,ior:1.33,attenuationColor:new THREE.Color(0x2f7d92),attenuationDistance:5,clearcoat:1,clearcoatRoughness:0.05,transparent:true,opacity:0.97});}
  const rs=0.5, rb=rs*Math.pow(519/0.32,1/3);   // 体积差一千倍 → 半径差约 11.7 倍
  const small=new THREE.Mesh(new THREE.SphereGeometry(rs,40,40),water());small.position.set(rb*1.2,-rb+rs,0);sc.add(small);
  const big=new THREE.Mesh(new THREE.SphereGeometry(rb,72,72),water());big.position.set(0,0,0);sc.add(big);
  const baseS=small.geometry.attributes.position.array.slice(),baseB=big.geometry.attributes.position.array.slice();
  const grid=new THREE.GridHelper(80,30,0x2a3a40,0x1a2730);grid.position.y=-rb-0.3;sc.add(grid);
  let P=0;ScrollTrigger.create({trigger:"#s6-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const cbs=[...stage.querySelectorAll('.cbox')];
  function ripple(mesh,base,amp,t){const a=mesh.geometry.attributes.position.array;
    for(let i=0;i<a.length;i+=3){const x=base[i],y=base[i+1],z=base[i+2];const d=1+amp*Math.sin(x*2.6+t)*Math.sin(y*2.6+t*1.1)*Math.sin(z*2.6+t*0.9);a[i]=x*d;a[i+1]=y*d;a[i+2]=z*d;}
    mesh.geometry.attributes.position.needsUpdate=true;mesh.geometry.computeVertexNormals();}
  let T=0;function animate(){requestAnimationFrame(animate);T+=0.02;
    ripple(small,baseS,0.05,T);ripple(big,baseB,0.012,T*0.7);
    small.rotation.y+=0.004;big.rotation.y+=0.002;
    // 揭示式相机：先近看小滴（几乎看不见），再拉远露出巨球对比（不是数字爬升）
    const camP=sm(cl((P-0.4)/0.4)),dist=lerp(5,rb*2.9,camP),hgt=lerp(0.3,rb*0.5,camP);
    cam.position.set(Math.sin(0.32)*dist,hgt,Math.cos(0.32)*dist);
    cam.lookAt(lerp(small.position.x,0,camP),lerp(small.position.y,-1,camP),0);
    slideBoxes(cbs,P);rdr.render(sc,cam);}
  animate();
  addEventListener('resize',()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();rdr.setSize(W(),H());});
})();

/* ---------- ③ 水分两路：3D 冷却塔（七八成蒸发升空 / 两三成废水沉出，比例贴合文案） ---------- */
(function splitScene(){
  const stage=document.getElementById('s3-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.02);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:true,canvas:document.getElementById('s3-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x4a5a64,1));const key=new THREE.DirectionalLight(0xcfe6ec,0.6);key.position.set(5,10,7);sc.add(key);
  // 冷却塔（双曲线 Lathe，缩小，别被文字块挡上下）
  const TH=4.6;
  const prof=[];for(let i=0;i<=24;i++){const t=i/24,y=t*TH; const r=2.0-1.15*Math.sin(t*Math.PI*0.86); prof.push(new THREE.Vector2(Math.max(0.85,r),y));}
  const rad=t=>Math.max(0.85,2.0-1.15*Math.sin(t*Math.PI*0.86));
  // 实体塔身（混凝土感）
  const tower=new THREE.Mesh(new THREE.LatheGeometry(prof,72),new THREE.MeshStandardMaterial({color:0x2b3a44,emissive:0x14242c,emissiveIntensity:.18,metalness:.25,roughness:.7,transparent:true,opacity:.82,side:THREE.DoubleSide}));
  tower.position.y=-0.4;sc.add(tower);
  const towerEdge=new THREE.Mesh(new THREE.LatheGeometry(prof,44),new THREE.MeshBasicMaterial({color:0x5fb6cf,wireframe:true,transparent:true,opacity:.1}));towerEdge.position.y=-0.4;sc.add(towerEdge);
  // 结构环带 + 顶口加厚环（更像真冷却塔）
  const rings=new THREE.Group();rings.position.y=-0.4;sc.add(rings);
  for(let k=1;k<7;k++){const t=k/7,y=t*TH,r=rad(t);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.035,8,48),new THREE.MeshBasicMaterial({color:0x6fc8dc,transparent:true,opacity:.4}));
    ring.rotation.x=Math.PI/2;ring.position.y=y;rings.add(ring);}
  const lip=new THREE.Mesh(new THREE.TorusGeometry(rad(1),0.09,10,52),new THREE.MeshStandardMaterial({color:0x3a4a54,metalness:.5,roughness:.4}));lip.rotation.x=Math.PI/2;lip.position.y=TH;rings.add(lip);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(rad(0)+0.15,rad(0)+0.4,0.5,52),new THREE.MeshStandardMaterial({color:0x222e36,metalness:.3,roughness:.7}));base.position.y=0.25;rings.add(base);
  const grid=new THREE.GridHelper(34,22,0x2a3a40,0x1a2730);grid.position.y=-0.4;sc.add(grid);
  const topY=TH-0.4;
  // 进水：水从侧上方注入塔顶（先有水进去）
  const NI=180,ig=new THREE.BufferGeometry(),ip=new Float32Array(NI*3),ist=new Float32Array(NI);
  for(let i=0;i<NI;i++)ist[i]=Math.random();ig.setAttribute('position',new THREE.BufferAttribute(ip,3));
  const inflow=new THREE.Points(ig,new THREE.PointsMaterial({color:0x5fb6cf,size:.2,transparent:true,opacity:0,depthWrite:false}));sc.add(inflow);
  // 蒸汽（多，70-80%，从塔顶升腾）
  const NE=520,eg=new THREE.BufferGeometry(),ep=new Float32Array(NE*3),est=new Float32Array(NE);
  function seedEvap(i){const a=Math.random()*6.28,rr=Math.random()*1.0;ep[i*3]=Math.cos(a)*rr;ep[i*3+1]=topY+Math.random()*0.4;ep[i*3+2]=Math.sin(a)*rr;est[i]=Math.random();}
  for(let i=0;i<NE;i++)seedEvap(i);eg.setAttribute('position',new THREE.BufferAttribute(ep,3));
  const evap=new THREE.Points(eg,new THREE.PointsMaterial({color:0xdce9ed,size:.22,transparent:true,opacity:0,depthWrite:false}));sc.add(evap);
  // 废水（少，20-30%，从塔底沉出，暗红）
  const NW=150,wg=new THREE.BufferGeometry(),wp=new Float32Array(NW*3),wst=new Float32Array(NW);
  function seedWaste(i){const a=Math.random()*6.28,rr=1.3+Math.random()*0.5;wp[i*3]=Math.cos(a)*rr;wp[i*3+1]=-0.2;wp[i*3+2]=Math.sin(a)*rr;wst[i]=Math.random();}
  for(let i=0;i<NW;i++)seedWaste(i);wg.setAttribute('position',new THREE.BufferAttribute(wp,3));
  const waste=new THREE.Points(wg,new THREE.PointsMaterial({color:0xc0432a,size:.16,transparent:true,opacity:0,depthWrite:false}));sc.add(waste);
  let P=0;ScrollTrigger.create({trigger:"#s3-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const cbs=[...stage.querySelectorAll('.cbox')];
  function animate(){requestAnimationFrame(animate);
    tower.rotation.y+=0.0014;towerEdge.rotation.y=tower.rotation.y;rings.rotation.y=tower.rotation.y;
    cam.position.set(Math.sin(0.4)*13,4.6,Math.cos(0.4)*13);cam.lookAt(0,2.0,0);
    const inOn=sm(cl((P-0.02)/0.16))*(1-sm(cl((P-0.46)/0.2)));   // 先：水注入
    const evapOn=sm(cl((P-0.2)/0.3));                             // 再：蒸发
    const wasteOn=sm(cl((P-0.55)/0.3));                           // 再：废水
    inflow.material.opacity=inOn*0.95;evap.material.opacity=evapOn*0.55;waste.material.opacity=wasteOn*0.85;
    for(let i=0;i<NI;i++){ist[i]+=0.013;if(ist[i]>1)ist[i]=0;const t=ist[i];
      ip[i*3]=lerp(-6.5,0,t)+(Math.random()-.5)*0.12;ip[i*3+1]=lerp(5.8,topY,t)-Math.sin(t*Math.PI)*0.5;ip[i*3+2]=(Math.random()-.5)*0.3;}
    ig.attributes.position.needsUpdate=true;
    for(let i=0;i<NE;i++){est[i]+=0.006*(0.5+evapOn);if(est[i]>1){seedEvap(i);est[i]=0;}
      ep[i*3+1]+=0.05*(0.4+evapOn);ep[i*3]*=1.004;ep[i*3+2]*=1.004;if(ep[i*3+1]>12)seedEvap(i);}
    eg.attributes.position.needsUpdate=true;
    for(let i=0;i<NW;i++){wp[i*3+1]-=0.012*(0.3+wasteOn);if(wp[i*3+1]<-1.5)seedWaste(i);}
    wg.attributes.position.needsUpdate=true;
    slideBoxes(cbs,P);rdr.render(sc,cam);}
  animate();
  addEventListener('resize',()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();rdr.setSize(W(),H());});
})();

/* ---------- ② 芯片 Three.js（原 viz-chip-heat，原样保留） ---------- */
(function chipScene(){
  const stage=document.getElementById('chip-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.018);
  const cam=new THREE.PerspectiveCamera(52,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:true,canvas:document.getElementById('chip-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x405058,0.9));const key=new THREE.DirectionalLight(0xcfe0e6,0.7);key.position.set(6,12,8);sc.add(key);
  const N=16,sp=1.18,geo=new THREE.BoxGeometry(0.92,0.22,0.92),COLD=new THREE.Color(0x16323b),HOT=new THREE.Color(0xd4502e),chips=[],grp=new THREE.Group();sc.add(grp);const cx=(N-1)/2;
  for(let x=0;x<N;x++)for(let z=0;z<N;z++){const mat=new THREE.MeshStandardMaterial({color:0x0e1c24,emissive:0x16323b,emissiveIntensity:.35,metalness:.3,roughness:.6});const m=new THREE.Mesh(geo,mat);m.position.set((x-cx)*sp,0,(z-cx)*sp);const ed=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x24424c}));m.add(ed);const d=Math.hypot(x-cx,z-cx)/Math.hypot(cx,cx);chips.push({m,mat,d});grp.add(m);}
  const ST=600,sg=new THREE.BufferGeometry(),spos=new Float32Array(ST*3),svel=new Float32Array(ST);
  for(let i=0;i<ST;i++){spos[i*3]=(Math.random()-.5)*N*sp;spos[i*3+1]=Math.random()*6;spos[i*3+2]=(Math.random()-.5)*N*sp;svel[i]=.01+Math.random()*.03;}
  sg.setAttribute('position',new THREE.BufferAttribute(spos,3));
  const steam=new THREE.Points(sg,new THREE.PointsMaterial({color:0xcfe6ec,size:.14,transparent:true,opacity:0,depthWrite:false}));sc.add(steam);
  let P=0;ScrollTrigger.create({trigger:"#chip-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const tempV=document.getElementById('chip-temp'),waterV=document.getElementById('chip-water');
  const cbs=[...document.querySelectorAll('#chip-stage .cbox')];
  let T=0;function animate(){requestAnimationFrame(animate);T++;
    grp.rotation.y=Math.sin(P*0.6)*0.05;
    const camP=sm(cl((P-0.74)/0.26)),r=lerp(13,30,camP),hgt=lerp(7.5,22,camP),ang=lerp(0,0.5,camP);
    cam.position.set(Math.sin(ang)*r,hgt,Math.cos(ang)*r);cam.lookAt(0,0,0);
    for(const c of chips){const onP=sm(cl((P-0.16-c.d*0.14)/0.26)),coolP=sm(cl((P-0.50-c.d*0.14)/0.26)),heat=onP*(1-coolP);
      c.mat.emissive.copy(COLD).lerp(HOT,heat);c.mat.emissiveIntensity=0.3+heat*1.5;c.m.position.y=heat*0.18;}
    const coolG=sm(cl((P-0.48)/0.22))*(1-sm(cl((P-0.82)/0.18)));steam.material.opacity=coolG*0.5;
    const pos=steam.geometry.attributes.position.array;for(let i=0;i<ST;i++){pos[i*3+1]+=svel[i]*(0.4+coolG);if(pos[i*3+1]>7)pos[i*3+1]=0;}steam.geometry.attributes.position.needsUpdate=true;
    const temp=Math.round(lerp(22,86,sm(cl((P-0.14)/0.34)))-lerp(0,18,sm(cl((P-0.5)/0.3))));tempV.textContent=temp;
    waterV.textContent=Math.round(sm(cl((P-0.46)/0.4))*519);slideBoxes(cbs,P);
    rdr.render(sc,cam);}
  animate();
  addEventListener('resize',()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();rdr.setSize(W(),H());});
})();
