var PSCALE=innerWidth<640?1.8:1;
function fitFov(cam){if(cam.userData.bf===undefined)cam.userData.bf=cam.fov;var a=innerWidth/innerHeight,bf=cam.userData.bf;cam.fov=a<1?Math.min(86,bf*(1+(1/a-1)*0.6)):bf;cam.updateProjectionMatrix();}
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
// 视口守卫：元素离视口太远就不渲染——同一时刻只画在看的那一章，避免十几个 rAF 同时烧 GPU 拖垮滚动
function vis(el,m){if(!el)return true;const r=el.getBoundingClientRect();return r.bottom>-(m||0)&&r.top<innerHeight+(m||0);}

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
  ctx.shadowBlur=0;const bx=p.l+(cellW-s)/2,maxW=p.r-bx,bigStr=litN+" / "+total+" 吉瓦";
  ctx.textAlign="left";ctx.textBaseline="alphabetic";
  let big=Math.max(40,Math.min(60,p.W*0.044));ctx.font=FNT(big,700);
  while(ctx.measureText(bigStr).width>maxW&&big>22){big-=2;ctx.font=FNT(big,700);}   // 窄屏收缩防右裁
  ctx.font=FNT(14);const lines=Math.max(1,Math.ceil(ctx.measureText(label).width/maxW));
  ctx.fillStyle=color;ctx.font=FNT(big,700);ctx.fillText(bigStr,bx,y0-32-(lines-1)*19);
  ctx.fillStyle=C.dim;ctx.font=FNT(14);wrap(ctx,label,bx,y0-12-(lines-1)*19,maxW,19);   // 副标题按可用宽换行
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
  ctx.fillStyle=C.dim;ctx.font=FNT(15);wrap(ctx,sub,p.l+4,p.t+bf+6,p.r-p.l-8,20);   // 窄屏换行防右裁
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
  const DBG=new URLSearchParams(location.search).get('dbgp');
  function frame(){requestAnimationFrame(frame);
    if(DBG!==null)P=parseFloat(DBG);
    else if(!vis(sec,300))return;
    ctx.fillStyle="#1a2632";ctx.fillRect(0,0,W,H);   // 不透明底：手机浏览器上一切残影/叠影直接盖掉
    const g=Math.max(54,Math.min(96,W*0.07)),p={l:g+34,r:W-g,t:H*0.40,b:H*0.86,W,H};
    const curveP=sm(cl(P/0.46));           // 曲线只画一次（前两段），画完保持，不随每块重放
    const priceOut=sm(cl((P-0.58)/0.06));  // 曲线先完全退场（0.64 前清空）
    const dotsIn=sm(cl((P-0.655)/0.06));   // 点阵 0.655 才进场：中间留空档，两图绝不同屏叠影
    if(priceOut<1) drawPrice(ctx,p,curveP,1-priceOut,0);
    if(dotsIn>0) drawDots(ctx,p,sm(cl((P-0.68)/0.28)),dotsIn,(1-dotsIn)*30);
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
    if(rect.bottom<-50||rect.top>H+50)return;   // 视口外不渲染
    const P=cl((H-rect.top)/(H+secH));
    ctx.fillStyle="#1a2632";ctx.fillRect(0,0,W,H);
    const ein=sm(cl(P/0.42)),eout=sm(cl((P-0.58)/0.42)),A=ein*(1-eout),sweep=sm(cl((P-0.2)/0.5));
    if(W>640){ctx.strokeStyle="rgba(95,182,207,.05)";ctx.lineWidth=1;
    for(let gx=0;gx<=W;gx+=W/16){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
    for(let gy=0;gy<=H;gy+=H/9){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}}
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
    ctx.fillStyle=`rgba(255,255,255,${A})`;let tf=Math.max(22,Math.min(38,W*0.05));ctx.font=`900 ${tf}px 'Noto Sans SC',sans-serif`;while(ctx.measureText(TT).width>W*0.9&&tf>14){tf-=1;ctx.font=`900 ${tf}px 'Noto Sans SC',sans-serif`;}ctx.fillText(TT,cxp,ty+36);
  }
  frame();
});

/* ---------- ① 取水：左侧水源被抽干 + 右侧数据中心蓄水上升（守恒：一边减、一边增，和恒定 290）；
   抽水速率有快慢节奏（非线性），粒子流量随速率脉动（滚得快抽得多，停下只剩细流） ---------- */
(function intakeScene(){
  const stage=document.getElementById('s1-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.014);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:innerWidth>640,canvas:document.getElementById('s1-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?1.5:2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x44555f,0.95));
  const key=new THREE.DirectionalLight(0xcfe6ec,0.7);key.position.set(7,14,9);sc.add(key);
  const key2=new THREE.DirectionalLight(0x5fb6cf,0.35);key2.position.set(-8,4,-3);sc.add(key2);
  const grid=new THREE.GridHelper(64,36,0x2a3a40,0x18222a);sc.add(grid);

  // ===== 左侧：水源水柱阵列（剩余水量）=====
  const N=11,sp=1.3,baseH=4,geo=new THREE.BoxGeometry(0.74,1,0.74);
  const field=new THREE.Group();field.position.set(-6,0,0);sc.add(field);const cc=(N-1)/2;
  const cols=[];
  for(let x=0;x<N;x++)for(let z=0;z<N;z++){
    const mat=new THREE.MeshStandardMaterial({color:0x2f7d92,emissive:0x2f7d92,emissiveIntensity:.5,transparent:true,opacity:.62,metalness:.2,roughness:.35});
    const m=new THREE.Mesh(geo,mat);m.position.set((x-cc)*sp,baseH/2,(z-cc)*sp);m.scale.y=baseH;
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x6fc8dc,transparent:true,opacity:.4})));
    cols.push({m,mat,delay:(x+z)/(2*(N-1))});field.add(m);
  }

  // ===== 右侧：数据中心（精细工厂）+ 蓄水塔 =====
  const dc=new THREE.Group();dc.position.set(7,0,-1);sc.add(dc);
  const hall=new THREE.Mesh(new THREE.BoxGeometry(5.4,3,4.4),new THREE.MeshStandardMaterial({color:0x223038,emissive:0x16323b,emissiveIntensity:.28,metalness:.55,roughness:.45}));hall.position.y=1.5;dc.add(hall);
  hall.add(new THREE.LineSegments(new THREE.EdgesGeometry(hall.geometry),new THREE.LineBasicMaterial({color:0x6fc8dc,transparent:true,opacity:.5})));
  // 正面机柜发光窗格（一眼是机房）
  for(let r=0;r<3;r++)for(let c=0;c<6;c++){const win=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.06),new THREE.MeshStandardMaterial({color:0x0e2630,emissive:0x3fa6c2,emissiveIntensity:.7}));win.position.set(-2.1+c*0.78,0.8+r*0.8,2.23);dc.add(win);}
  // 屋顶散热单元 + 风扇 + 冷却管
  for(let i=0;i<4;i++){const u=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.4,1.4),new THREE.MeshStandardMaterial({color:0x2b3d46,emissive:0x14262e,metalness:.6,roughness:.4}));u.position.set(-1.8+i*1.2,3.2,0);dc.add(u);
    const fan=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.1,16),new THREE.MeshStandardMaterial({color:0x3a4a52,emissive:0x16262e,metalness:.7,roughness:.3}));fan.position.set(-1.8+i*1.2,3.42,0);dc.add(fan);}
  const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,2.8,12),new THREE.MeshStandardMaterial({color:0x2c3942,emissive:0x101a20,metalness:.5,roughness:.5}));pipe.position.set(2.5,2,-1.2);dc.add(pipe);
  // 蓄水塔（玻璃柱，水位随抽水上升）
  const TANK_H=4.4,TANK_R=1.5;
  const tank=new THREE.Group();tank.position.set(-3.6,0,2.6);dc.add(tank);   // world ≈ (3.4,0,1.6)
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(TANK_R,TANK_R,TANK_H,32,1,true),new THREE.MeshStandardMaterial({color:0x9fdcec,transparent:true,opacity:.13,metalness:.1,roughness:.2,side:THREE.DoubleSide}));shell.position.y=TANK_H/2;tank.add(shell);
  [0.05,TANK_H].forEach(yy=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(TANK_R,0.05,10,40),new THREE.MeshBasicMaterial({color:0x7fd6ea,transparent:true,opacity:.5}));ring.rotation.x=Math.PI/2;ring.position.y=yy;tank.add(ring);});
  const wmat=new THREE.MeshStandardMaterial({color:0x3fb0cc,emissive:0x2f7d92,emissiveIntensity:.55,transparent:true,opacity:.88,metalness:.2,roughness:.3});
  const wcyl=new THREE.Mesh(new THREE.CylinderGeometry(TANK_R*0.93,TANK_R*0.93,1,28),wmat);tank.add(wcyl);   // 高度用 scale.y 控制
  const intakePos=new THREE.Vector3(7-3.6,TANK_H,-1+2.6);   // 塔顶进水口 world ≈ (3.4,4.4,1.6)

  // ===== 抽水粒子流：水源 → 蓄水塔顶；流量/速度随速率脉动 =====
  const NF=300,fg=new THREE.BufferGeometry(),fp=new Float32Array(NF*3),ft=new Float32Array(NF),fsx=new Float32Array(NF),fsz=new Float32Array(NF);
  function seedFlow(i){ft[i]=Math.random();fsx[i]=-6+(Math.random()-.5)*N*sp*0.9;fsz[i]=(Math.random()-.5)*N*sp*0.9;}
  for(let i=0;i<NF;i++)seedFlow(i);fg.setAttribute('position',new THREE.BufferAttribute(fp,3));
  const flow=new THREE.Points(fg,new THREE.PointsMaterial({color:0x9fe0ee,size:(.18)*PSCALE,transparent:true,opacity:0,depthWrite:false}));sc.add(flow);

  let P=0;ScrollTrigger.create({trigger:"#s1-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const bigV=document.getElementById('s1-drained'),subV=document.querySelector('#s1-hud .u');
  const cbs=[...stage.querySelectorAll('.cbox')];
  const vroot=document.getElementById('s1-track');
  const TOTAL=290;
  const wavy=p=>{p=cl(p);return cl(p-0.07*Math.sin(p*Math.PI*3));};   // 单调递增但斜率起伏→抽水有快慢
  let prevDr=0,flowStr=0;
  function animate(){requestAnimationFrame(animate);
    if(!vis(vroot,300))return;
    // 抽干波（front 速度非匀速→看得出快慢）
    const front=wavy(P)*1.4;
    let rem=0;
    for(const c of cols){const cp=sm(cl((front-c.delay)/0.28));
      const h=lerp(baseH,0.05,cp);c.m.scale.y=h;c.m.position.y=h/2;
      c.mat.opacity=lerp(.62,.12,cp);c.mat.emissiveIntensity=lerp(.5,.08,cp);
      rem+=(h-0.05)/(baseH-0.05);}
    const fill=1-rem/cols.length, drained=TOTAL*fill;
    // 守恒：蓄水塔水位 = 已抽走比例（源减多少，这边增多少）
    const wh=Math.max(0.001,TANK_H*fill);wcyl.scale.y=wh;wcyl.position.y=wh/2;
    // 速率 → 流强度（滚动越快抽越多；停下仍有微弱细流）
    const dD=Math.max(0,drained-prevDr);prevDr=drained;
    flowStr=flowStr*0.86+Math.min(1,dD*0.6+0.15)*0.14;
    flow.material.opacity=cl(flowStr*1.5)*0.9;flow.material.size=0.12+flowStr*0.18;
    const adv=0.006+flowStr*0.055;
    for(let i=0;i<NF;i++){ft[i]+=adv;if(ft[i]>1)seedFlow(i);const t=ft[i];
      fp[i*3]=lerp(fsx[i],intakePos.x,t);
      fp[i*3+1]=lerp(3,intakePos.y,t)+Math.sin(t*Math.PI)*2.3;
      fp[i*3+2]=lerp(fsz[i],intakePos.z,t);}
    fg.attributes.position.needsUpdate=true;
    // 相机：略微揭示，左右都在画面
    const camP=sm(cl(P/0.7)),r=lerp(25,29,camP),hgt=lerp(10,14,camP);
    cam.position.set(Math.sin(0.32)*r,hgt,Math.cos(0.32)*r);cam.lookAt(-1.2,2.2,0.6);
    field.rotation.y=Math.sin(P*0.5)*0.02;
    bigV.textContent=Math.round(drained);
    if(subV)subV.textContent="亿升已被抽进数据中心 · 水源仅剩 "+Math.round(TOTAL-drained)+" 亿升（一边减、一边增，和恒定 290）";
    slideBoxes(cbs,P);rdr.render(sc,cam);}
  animate();
  addEventListener('resize',()=>{cam.aspect=W()/H();fitFov(cam);rdr.setSize(W(),H());});
})();

/* ---------- ④ 不只是水：3D 冒烟电厂为持续舞台（厂房+3 烟囱+234 台柴油机阵列+棕烟越冒越浓），
   逐块换 HUD 读数；碳强度对比/碳排趋势这两块切到 2D 图表 overlay（盖在变暗的 3D 上） ---------- */
(function emitScene(){
  const stage=document.getElementById('s4-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.018);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:innerWidth>640,canvas:document.getElementById('s4-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?1.5:2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
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
  const smoke=new THREE.Points(sg,new THREE.PointsMaterial({color:0xb08a6a,size:(.32)*PSCALE,transparent:true,opacity:0,depthWrite:false}));sc.add(smoke);

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
  const vroot=document.getElementById('s4-track');
  function animate(){requestAnimationFrame(animate);
    if(!vis(vroot,300))return;
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
  addEventListener('resize',()=>{cam.aspect=W()/H();fitFov(cam);rdr.setSize(W(),H());});
})();

/* ---------- ⑦ 系统总览：3D 循环（水进/电进 → 蒸发/废水/碳 → 绕回取水） ---------- */
(function loopScene(){
  const stage=document.getElementById('s7-stage'), cv=document.getElementById('s7-canvas');
  if(!stage||!cv||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const COL={water:0x5fb6cf,energy:0xd2a24a,ember:0xe0664a,leaf:0x9aab6a,grey:0x9aa0a2};
  // 统一边线标准：亮而细
  const E_WATER=0x8fdcf0, E_ENERGY=0xeab873, E_NEUT=0x9fb6c2;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.012);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,500);
  cam.position.set(0,5.0,18.5); cam.lookAt(0,1.6,0);
  const rdr=new THREE.WebGLRenderer({antialias:innerWidth>640,canvas:cv});
  rdr.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?1.5:2)); rdr.setSize(W(),H()); rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x4a5a64,1)); const key=new THREE.DirectionalLight(0xcfe6ec,0.7); key.position.set(5,12,8); sc.add(key);
  const EDGE=(mesh,color,op)=>{const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:color,transparent:true,opacity:op==null?0.9:op})); mesh.add(e); return e;};
  const V=(x,y,z)=>({x:x,y:y,z:z});

  // 土地泛褐（仅取水口一小片）
  const drought=new THREE.Mesh(new THREE.PlaneGeometry(7.5,6.5),new THREE.MeshBasicMaterial({color:0x6f5c39,transparent:true,opacity:0,depthWrite:false}));
  drought.rotation.x=-Math.PI/2; drought.position.set(-6.5,-0.01,0); sc.add(drought);

  // 数据中心
  const dc=new THREE.Group(); sc.add(dc);
  const dcBox=new THREE.Mesh(new THREE.BoxGeometry(3.6,2.4,3.6),new THREE.MeshStandardMaterial({color:0x2c4a5a,emissive:0x205668,emissiveIntensity:0.65,metalness:0.4,roughness:0.5}));
  dcBox.position.y=1.2; dc.add(dcBox); EDGE(dcBox,E_WATER,0.95);
  const chips=[]; for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const c=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.18,0.62),new THREE.MeshStandardMaterial({color:0x3a4a44,emissive:COL.energy,emissiveIntensity:0.25})); c.position.set(i*0.95,2.5,j*0.95); dc.add(c); EDGE(c,E_ENERGY,0.7); chips.push(c);}
  dc.scale.setScalar(0.001);

  // 河 / 取水
  const river=new THREE.Group(); river.position.set(-7,0,0); sc.add(river);
  const waterMat=new THREE.MeshStandardMaterial({color:0x2f5060,emissive:COL.water,emissiveIntensity:0.5,transparent:true,opacity:0.92});
  const waterBlock=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.2,2.6),waterMat); waterBlock.position.y=1.2; river.add(waterBlock); EDGE(waterBlock,E_WATER,0.95);
  const bank=new THREE.Mesh(new THREE.BoxGeometry(2.9,0.2,2.9),new THREE.MeshStandardMaterial({color:0x35423a,emissive:0x35423a,emissiveIntensity:0.15})); bank.position.y=0.1; river.add(bank); EDGE(bank,E_NEUT,0.6);

  // 电厂（提亮 + 冷却塔 + 双烟囱 + 亮边线，一眼认得出）
  const plant=new THREE.Group(); plant.position.set(7,0,0); sc.add(plant);
  const pMat=()=>new THREE.MeshStandardMaterial({color:0x46535c,emissive:0x4a3a1e,emissiveIntensity:0.4,metalness:0.4,roughness:0.55});
  const pBox=new THREE.Mesh(new THREE.BoxGeometry(2.3,1.5,2.0),pMat()); pBox.position.set(-0.5,0.75,0.2); plant.add(pBox); EDGE(pBox,E_ENERGY,0.95);
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(0.85,1.05,2.3,22,1,true),pMat()); tower.position.set(1.15,1.15,-0.3); plant.add(tower); EDGE(tower,E_ENERGY,0.85);
  [[-1.0,1.9,0.7],[-0.2,2.2,-0.7]].forEach(a=>{const s=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.23,a[1],12),pMat()); s.position.set(a[0],0.75+a[1]/2,a[2]); plant.add(s); EDGE(s,E_ENERGY,0.9);});
  plant.scale.setScalar(0.001);

  // 流（vapor=升腾蒸汽；渐进：前沿从源头推进到目标）
  function stream(from,to,arc,color,count,size,rad,vapor){
    const g=new THREE.BufferGeometry(), pos=new Float32Array(count*3), t=new Float32Array(count);
    const ox=new Float32Array(count), oy=new Float32Array(count), oz=new Float32Array(count);
    for(let i=0;i<count;i++){ t[i]=Math.random(); const a=Math.random()*6.283, r=Math.sqrt(Math.random())*rad; ox[i]=Math.cos(a)*r; oy[i]=Math.sin(a)*r*0.7; oz[i]=Math.sin(a)*r; }
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const pts=new THREE.Points(g,new THREE.PointsMaterial({color:color,size:(size)*PSCALE,transparent:true,opacity:0,depthWrite:false})); sc.add(pts);
    return {pts:pts,g:g,pos:pos,t:t,ox:ox,oy:oy,oz:oz,from:from,to:to,arc:arc,vapor:!!vapor};
  }
  const ptOf=(s,k)=>{const a=s.from,b=s.to; return [a.x+(b.x-a.x)*k, a.y+(b.y-a.y)*k+Math.sin(k*Math.PI)*s.arc, a.z+(b.z-a.z)*k];};
  const sWater=stream(V(-5.4,1.4,0),V(-1.9,1.5,0),0.55,COL.water,170,0.24,0.4,false);
  const sPower=stream(V(5.4,1.3,0),V(1.9,1.5,0),0.55,COL.energy,170,0.24,0.4,false);
  const sEvap =stream(V(0,2.6,0),V(-1.2,7.2,2),0.9,COL.water,260,0.3,0.6,true);
  const sWaste=stream(V(0.5,0.5,0.4),V(3.6,-1.6,1.2),0.5,COL.ember,80,0.22,0.22,false);
  const sCO2  =stream(V(7.4,3.9,-0.5),V(6.0,7.6,-0.5),0.55,COL.grey,200,0.3,0.55,true);

  // 灰雾粒子云（局部）
  const NF=150, fg=new THREE.BufferGeometry(), fpos=new Float32Array(NF*3), fbx=new Float32Array(NF), fph=new Float32Array(NF);
  for(let i=0;i<NF;i++){ fbx[i]=-10+Math.random()*20; fpos[i*3]=fbx[i]; fpos[i*3+1]=6.4+Math.random()*2.2; fpos[i*3+2]=-4+Math.random()*4; fph[i]=Math.random()*6.283; }
  fg.setAttribute('position',new THREE.BufferAttribute(fpos,3));
  const fogPts=new THREE.Points(fg,new THREE.PointsMaterial({color:COL.grey,size:(0.9)*PSCALE,transparent:true,opacity:0,depthWrite:false})); sc.add(fogPts);

  // 闭环：亮曲线 + 多箭头 + 流动粒子
  const loopCurve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(2.4,7.2,-2),new THREE.Vector3(-8.4,9.0,0),new THREE.Vector3(-7,3.2,0));
  const loopLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(loopCurve.getPoints(64)),new THREE.LineBasicMaterial({color:COL.leaf,transparent:true,opacity:0}));
  sc.add(loopLine);
  const arrows=[]; [0.99].forEach(tt=>{
    const a=new THREE.Mesh(new THREE.ConeGeometry(0.28,0.74,12),new THREE.MeshBasicMaterial({color:COL.leaf,transparent:true,opacity:0}));
    const p=loopCurve.getPoint(tt), p2=loopCurve.getPoint(Math.min(1,tt+0.02));
    const dir=new THREE.Vector3().subVectors(p2,p).normalize();
    a.position.copy(p); a.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir); sc.add(a); arrows.push(a);
  });
  const NL=46, lg=new THREE.BufferGeometry(), lpos=new Float32Array(NL*3), lt=new Float32Array(NL);
  for(let i=0;i<NL;i++)lt[i]=i/NL; lg.setAttribute('position',new THREE.BufferAttribute(lpos,3));
  const loopPart=new THREE.Points(lg,new THREE.PointsMaterial({color:COL.leaf,size:(0.28)*PSCALE,transparent:true,opacity:0,depthWrite:false})); sc.add(loopPart);

  const S={dc:0,water:0,power:0,split:0,carbon:0,loop:0};
  let P=0;
  const DBG=new URLSearchParams(location.search).get('dbgp');
  const labels={}; stage.querySelectorAll('.s7lab').forEach(l=>labels[l.dataset.k]=l);
  const cbs=[...stage.querySelectorAll('.cbox')];
  const cntV=document.getElementById('s7-cnt');
  const vroot=document.getElementById('s7-track');

  // 相机编排：box3 讲 CO2→看右(电厂废气)，讲缺水→摇左(取水)，box4 拉回全景
  const C_WIDE={p:[0,5.0,18.5],l:[0,1.6,0]}, C_RIGHT={p:[5.0,5.6,11.5],l:[7,4.4,-0.3]}, C_LEFT={p:[-5.2,3.6,11.5],l:[-7,1.4,0]};
  const mix=(a,b,t)=>a+(b-a)*t;
  const lc=(A,B,t)=>({p:[mix(A.p[0],B.p[0],t),mix(A.p[1],B.p[1],t),mix(A.p[2],B.p[2],t)],l:[mix(A.l[0],B.l[0],t),mix(A.l[1],B.l[1],t),mix(A.l[2],B.l[2],t)]});
  function camFor(p){
    if(p<0.50) return C_WIDE;
    if(p<0.56) return lc(C_WIDE,C_RIGHT,sm((p-0.50)/0.06));
    if(p<0.66) return C_RIGHT;
    if(p<0.72) return lc(C_RIGHT,C_LEFT,sm((p-0.66)/0.06));
    if(p<0.82) return C_LEFT;
    if(p<0.88) return lc(C_LEFT,C_WIDE,sm((p-0.82)/0.06));
    return C_WIDE;
  }

  let fr=0;
  // 渐进：前沿=amt；t<amt 的粒子显示（流从源头长到目标），其余藏起来
  function setStream(s,amt){ s.pts.material.opacity=amt>0.02?0.92:0; const adv=0.005+amt*0.012;
    for(let i=0;i<s.t.length;i++){ s.t[i]+=adv; if(s.t[i]>1)s.t[i]-=1; const k=s.t[i];
      if(k>amt){ s.pos[i*3+1]=-999; continue; }
      const p=ptOf(s,k), spread=s.vapor?(0.25+k*1.8):1;
      s.pos[i*3]=p[0]+s.ox[i]*spread; s.pos[i*3+1]=p[1]+s.oy[i]*spread; s.pos[i*3+2]=p[2]+s.oz[i]*spread; }
    s.g.attributes.position.needsUpdate=true; }
  const lab=(k,v)=>{ if(labels[k]) labels[k].style.opacity=v; };
  function tick(){requestAnimationFrame(tick); fr++;
    if(DBG!==null){ P=parseFloat(DBG); }
    else { const rect=vroot.getBoundingClientRect(); P=Math.max(0,Math.min(1, -rect.top/(vroot.offsetHeight-innerHeight))); }
    // 各阶段在对应文字框"居中前"就播完→之后文字框停留(dwell)
    // 6 框节拍：water/power/split/carbon(CO2)/loop(缺水) 对齐 box 中心 0.083/0.25/0.417/0.583/0.75
    S.dc=sm(cl((P-0.00)/0.05)); S.water=sm(cl((P-0.01)/0.07)); S.power=sm(cl((P-0.17)/0.08));
    S.split=sm(cl((P-0.34)/0.08)); S.carbon=sm(cl((P-0.50)/0.08)); S.loop=sm(cl((P-0.67)/0.08));
    const cf=camFor(P); cam.position.set(cf.p[0],cf.p[1],cf.p[2]); cam.lookAt(cf.l[0],cf.l[1],cf.l[2]);
    // 镜头聚焦时(0.50~0.88)固定标注淡出，避免飘移；全景时显示
    let wide=1; if(P>=0.50&&P<0.56)wide=1-sm((P-0.50)/0.06); else if(P>=0.56&&P<0.82)wide=0; else if(P>=0.82&&P<0.88)wide=sm((P-0.82)/0.06);
    const r2=vroot.getBoundingClientRect(); if(DBG===null && (r2.bottom<-50 || r2.top>innerHeight+50)) return;
    dc.scale.setScalar(Math.max(0.001,S.dc));
    chips.forEach((c,i)=>c.material.emissiveIntensity=0.22+S.dc*(0.55+0.45*Math.sin(fr*0.06+i)));
    plant.scale.setScalar(Math.max(0.001,S.power));
    setStream(sWater,S.water); lab('water',S.water*wide);
    setStream(sPower,S.power); lab('power',S.power*wide);
    setStream(sEvap,S.split);  lab('evap',S.split*wide);
    setStream(sWaste,S.split); lab('waste',S.split*wide);
    setStream(sCO2,S.carbon);  lab('co2',S.carbon*wide);
    for(let i=0;i<NF;i++){ fpos[i*3]=fbx[i]+Math.sin(fr*0.01+fph[i])*0.8; fpos[i*3+1]=7.5+Math.sin(fr*0.012+fph[i])*0.6; }
    fg.attributes.position.needsUpdate=true; fogPts.material.opacity=S.carbon*0.5;
    waterBlock.position.y=1.2 - S.loop*0.6; waterBlock.scale.y=1 - S.loop*0.45;
    drought.material.opacity=S.loop*0.42;
    loopLine.material.opacity=S.loop*0.85; arrows.forEach(a=>a.material.opacity=S.loop); loopPart.material.opacity=S.loop*0.95;
    for(let i=0;i<NL;i++){ lt[i]+=0.006; if(lt[i]>1)lt[i]-=1; const v=loopCurve.getPoint(lt[i]); lpos[i*3]=v.x;lpos[i*3+1]=v.y;lpos[i*3+2]=v.z; }
    lg.attributes.position.needsUpdate=true; lab('loop',S.loop*wide);
    if(cntV) cntV.textContent=Math.round(Math.max(0,Math.min(1,P/0.78))*25);
    slideBoxes(cbs,P);
    rdr.render(sc,cam);
  }
  tick();
  addEventListener('resize',()=>{cam.aspect=W()/H();fitFov(cam);rdr.setSize(W(),H());});
})();

/* ---------- ⑥ 算不清：对数量级数轴——同一件事，不同口径，落点相差千倍且彼此对不上 ---------- */
(function s6Scene(){
  const stage=document.getElementById('s6-stage'), cv=document.getElementById('s6-canvas');
  if(!stage||!cv||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const COL={water:0x5fb6cf,energy:0xd2a24a,ember:0xe0664a};
  const E_WATER=0x8fdcf0, E_ENERGY=0xeab873;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.01);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,500);
  cam.position.set(0,4.0,17.5); cam.lookAt(0,3.4,0);
  const rdr=new THREE.WebGLRenderer({antialias:innerWidth>640,canvas:cv});
  rdr.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?1.5:2)); rdr.setSize(W(),H()); rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x4a5a64,1)); const key=new THREE.DirectionalLight(0xcfe6ec,0.7); key.position.set(5,12,8); sc.add(key);
  const EDGE=(mesh,color,op)=>{const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:color,transparent:true,opacity:op==null?0.9:op})); mesh.add(e); return e;};
  const mix=(a,b,t)=>a+(b-a)*t;

  // ===== 水的口径 · 玻璃量瓶（居中，序列前半段）=====
  const vx=0, vH=6.4, vR=1.5;
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(vR,vR,vH,30,1,true),new THREE.MeshStandardMaterial({color:0x2a3a44,emissive:0x18323c,emissiveIntensity:0.15,transparent:true,opacity:0.14,side:THREE.DoubleSide}));
  glass.position.set(vx,vH/2,0); sc.add(glass); const gEdge=EDGE(glass,E_WATER,0.85);
  const rings=[]; [0.03,vH].forEach(yy=>{const r=new THREE.Mesh(new THREE.TorusGeometry(vR,0.05,8,36),new THREE.MeshBasicMaterial({color:E_WATER,transparent:true,opacity:0.7})); r.rotation.x=Math.PI/2; r.position.set(vx,yy,0); sc.add(r); rings.push(r);});
  const water=new THREE.Mesh(new THREE.CylinderGeometry(vR*0.93,vR*0.93,1,30),new THREE.MeshStandardMaterial({color:0x357088,emissive:COL.water,emissiveIntensity:0.7,transparent:true,opacity:0.95}));
  sc.add(water);
  function setWater(level){ const h=Math.max(0.06,level*vH); water.scale.y=h; water.position.set(vx,h/2,0); }
  const NW=90, wg=new THREE.BufferGeometry(), wp=new Float32Array(NW*3), wt=new Float32Array(NW), wa=new Float32Array(NW);
  for(let i=0;i<NW;i++){wt[i]=Math.random(); wa[i]=Math.random()*6.283;}
  wg.setAttribute('position',new THREE.BufferAttribute(wp,3));
  const splash=new THREE.Points(wg,new THREE.PointsMaterial({color:0xbfe4ef,size:(0.16)*PSCALE,transparent:true,opacity:0,depthWrite:false})); sc.add(splash);

  // ===== 电的口径 · 电表(指针跳动)（居中，序列后半段）=====
  const mC=document.createElement('canvas'); mC.width=1240; mC.height=920; const mX=mC.getContext('2d');
  const mTex=new THREE.CanvasTexture(mC); mTex.anisotropy=8;
  const meter=new THREE.Mesh(new THREE.PlaneGeometry(10,7.42),new THREE.MeshBasicMaterial({map:mTex,transparent:true,depthWrite:false}));
  meter.position.set(0,2.3,0); meter.material.opacity=0; sc.add(meter);
  const SRC=[[415,'IEA'],[448,'UNU'],[485,'IEA']];
  const ang=v=>Math.PI - (v-400)/100*Math.PI;
  function drawMeter(val,op){
    const x=mX, cx=310, cy=330, R=206;
    x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,1240,920); x.setTransform(2,0,0,2,0,0);
    x.globalAlpha=op; x.textAlign='center';
    x.fillStyle='#aeb8bd'; x.font="22px 'Noto Sans SC',sans-serif"; x.fillText('全球数据中心 · 一年用多少电（太瓦时）',310,26);
    x.lineWidth=11; x.strokeStyle='rgba(120,140,150,.22)'; x.beginPath(); x.arc(cx,cy,R,Math.PI,0); x.stroke();
    x.strokeStyle='rgba(180,200,210,.32)'; x.lineWidth=2;
    for(let v=400;v<=500;v+=10){const a=ang(v); x.beginPath(); x.moveTo(cx+Math.cos(a)*(R-13),cy-Math.sin(a)*(R-13)); x.lineTo(cx+Math.cos(a)*(R+2),cy-Math.sin(a)*(R+2)); x.stroke();}
    SRC.forEach(s=>{const a=ang(s[0]); x.strokeStyle='#d2a24a'; x.lineWidth=4; x.beginPath(); x.moveTo(cx+Math.cos(a)*(R-17),cy-Math.sin(a)*(R-17)); x.lineTo(cx+Math.cos(a)*(R+11),cy-Math.sin(a)*(R+11)); x.stroke(); x.fillStyle='#d2a24a'; x.font="bold 23px 'Roboto Mono',monospace"; x.fillText(s[0], cx+Math.cos(a)*(R+40), cy-Math.sin(a)*(R+40)+7); x.fillStyle='#8a969c'; x.font="13px 'Noto Sans SC',sans-serif"; x.fillText(s[1], cx+Math.cos(a)*(R+40), cy-Math.sin(a)*(R+40)+26);});
    const a=ang(val); x.strokeStyle='#eab873'; x.lineWidth=6; x.lineCap='round'; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*(R-30),cy-Math.sin(a)*(R-30)); x.stroke();
    x.fillStyle='#eab873'; x.beginPath(); x.arc(cx,cy,11,0,7); x.fill();
    x.fillStyle='#fff'; x.font="bold 48px 'Roboto Mono',monospace"; x.fillText(Math.round(val),cx,cy+56);
    x.fillStyle='#e0664a'; x.font="17px 'Noto Sans SC',sans-serif"; x.fillText('三个版本 · 对不上',cx,cy+84);
    x.globalAlpha=1; mTex.needsUpdate=true;
  }
  let needle=448, target=448;

  const labels={}; stage.querySelectorAll('.s7lab').forEach(l=>labels[l.dataset.k]=l);
  const cbs=[...stage.querySelectorAll('.cbox')];
  const valEl=document.getElementById('s6-val');
  const hud=document.getElementById('s6-hud');
  const vroot=document.getElementById('s6-track');
  const lab=(k,v)=>{ if(labels[k]) labels[k].style.opacity=v; };
  const DBG=new URLSearchParams(location.search).get('dbgp');

  let fr=0, P=0;
  function tick(){requestAnimationFrame(tick); fr++;
    if(DBG!==null){P=parseFloat(DBG);} else {const r=vroot.getBoundingClientRect(); P=Math.max(0,Math.min(1,-r.top/(vroot.offsetHeight-innerHeight)));}
    const sFill=sm(cl((P-0.18)/0.16));   // box1 灌满
    const sElec=sm(cl((P-0.52)/0.12));   // box2 电表
    const vesShow=1-sm(cl((P-0.44)/0.08));   // 量瓶在切电表前淡出
    const r2=vroot.getBoundingClientRect(); if(DBG===null && (r2.bottom<-50||r2.top>innerHeight+50)) return;
    // 量瓶
    setWater(mix(0.012,1,sFill));
    glass.material.opacity=0.14*vesShow; gEdge.material.opacity=0.85*vesShow; water.material.opacity=0.95*vesShow;
    rings.forEach(r=>r.material.opacity=0.7*vesShow);
    const flowing=(sFill>0.03&&sFill<0.98)?1:0;
    splash.material.opacity=flowing*0.7*vesShow;
    for(let i=0;i<NW;i++){wt[i]+=0.035; if(wt[i]>1)wt[i]-=1; const top=mix(0.06,1,sFill)*vH; wp[i*3]=vx+Math.cos(wa[i])*vR*0.7; wp[i*3+1]=mix(0.1,top,wt[i]); wp[i*3+2]=Math.sin(wa[i])*vR*0.7;}
    wg.attributes.position.needsUpdate=true;
    const v=mix(0.32,519,sFill); if(valEl) valEl.textContent=(v<10?v.toFixed(2):Math.round(v));
    if(hud) hud.style.opacity=vesShow;
    // 电表
    if(sElec>0.01){ if(fr%9===0) target=SRC[Math.floor(Math.random()*3)][0]; needle+=(target-needle)*0.45+(Math.random()-0.5)*4; }
    drawMeter(needle, sElec); meter.material.opacity=sElec;
    // 标注
    lab('ent', sm(cl((P-0.02)/0.06))*(1-sFill)*vesShow); lab('aca', sFill*vesShow); lab('x16', sFill*vesShow); lab('elec', sElec);
    slideBoxes(cbs,P);
    rdr.render(sc,cam);
  }
  drawMeter(448,1);
  tick();
  addEventListener('resize',()=>{cam.aspect=W()/H();fitFov(cam);rdr.setSize(W(),H());});
})();

/* ---------- ③ 水分两路：3D 冷却塔（七八成蒸发升空 / 两三成废水沉出，比例贴合文案） ---------- */
(function splitScene(){
  const stage=document.getElementById('s3-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.02);
  const cam=new THREE.PerspectiveCamera(50,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:innerWidth>640,canvas:document.getElementById('s3-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?1.5:2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
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
  const inflow=new THREE.Points(ig,new THREE.PointsMaterial({color:0x5fb6cf,size:(.2)*PSCALE,transparent:true,opacity:0,depthWrite:false}));sc.add(inflow);
  // 蒸汽（多，70-80%，从塔顶升腾）
  const NE=520,eg=new THREE.BufferGeometry(),ep=new Float32Array(NE*3),est=new Float32Array(NE);
  function seedEvap(i){const a=Math.random()*6.28,rr=Math.random()*1.0;ep[i*3]=Math.cos(a)*rr;ep[i*3+1]=topY+Math.random()*0.4;ep[i*3+2]=Math.sin(a)*rr;est[i]=Math.random();}
  for(let i=0;i<NE;i++)seedEvap(i);eg.setAttribute('position',new THREE.BufferAttribute(ep,3));
  const evap=new THREE.Points(eg,new THREE.PointsMaterial({color:0xdce9ed,size:(.22)*PSCALE,transparent:true,opacity:0,depthWrite:false}));sc.add(evap);
  // 废水（少，20-30%，从塔底沉出，暗红）
  const NW=150,wg=new THREE.BufferGeometry(),wp=new Float32Array(NW*3),wst=new Float32Array(NW);
  function seedWaste(i){const a=Math.random()*6.28,rr=1.3+Math.random()*0.5;wp[i*3]=Math.cos(a)*rr;wp[i*3+1]=-0.2;wp[i*3+2]=Math.sin(a)*rr;wst[i]=Math.random();}
  for(let i=0;i<NW;i++)seedWaste(i);wg.setAttribute('position',new THREE.BufferAttribute(wp,3));
  const waste=new THREE.Points(wg,new THREE.PointsMaterial({color:0xc0432a,size:(.16)*PSCALE,transparent:true,opacity:0,depthWrite:false}));sc.add(waste);
  let P=0;ScrollTrigger.create({trigger:"#s3-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const cbs=[...stage.querySelectorAll('.cbox')];
  const vroot=document.getElementById('s3-track');
  function animate(){requestAnimationFrame(animate);
    if(!vis(vroot,300))return;
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
  addEventListener('resize',()=>{cam.aspect=W()/H();fitFov(cam);rdr.setSize(W(),H());});
})();

/* ---------- ② 芯片 Three.js（原 viz-chip-heat，原样保留） ---------- */
(function chipScene(){
  const stage=document.getElementById('chip-stage'); if(!stage||!window.THREE) return;
  const W=()=>innerWidth,H=()=>innerHeight;
  const sc=new THREE.Scene(); sc.fog=new THREE.FogExp2(0x1a2632,0.018);
  const cam=new THREE.PerspectiveCamera(52,W()/H(),0.1,400);
  const rdr=new THREE.WebGLRenderer({antialias:innerWidth>640,canvas:document.getElementById('chip-canvas')});
  rdr.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?1.5:2));rdr.setSize(W(),H());rdr.setClearColor(0x1a2632,1);
  sc.add(new THREE.AmbientLight(0x405058,0.9));const key=new THREE.DirectionalLight(0xcfe0e6,0.7);key.position.set(6,12,8);sc.add(key);
  const N=16,sp=1.18,geo=new THREE.BoxGeometry(0.92,0.22,0.92),COLD=new THREE.Color(0x16323b),HOT=new THREE.Color(0xd4502e),chips=[],grp=new THREE.Group();sc.add(grp);const cx=(N-1)/2;
  for(let x=0;x<N;x++)for(let z=0;z<N;z++){const mat=new THREE.MeshStandardMaterial({color:0x0e1c24,emissive:0x16323b,emissiveIntensity:.35,metalness:.3,roughness:.6});const m=new THREE.Mesh(geo,mat);m.position.set((x-cx)*sp,0,(z-cx)*sp);const ed=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x24424c}));m.add(ed);const d=Math.hypot(x-cx,z-cx)/Math.hypot(cx,cx);chips.push({m,mat,d});grp.add(m);}
  const ST=600,sg=new THREE.BufferGeometry(),spos=new Float32Array(ST*3),svel=new Float32Array(ST);
  for(let i=0;i<ST;i++){spos[i*3]=(Math.random()-.5)*N*sp;spos[i*3+1]=Math.random()*6;spos[i*3+2]=(Math.random()-.5)*N*sp;svel[i]=.01+Math.random()*.03;}
  sg.setAttribute('position',new THREE.BufferAttribute(spos,3));
  const steam=new THREE.Points(sg,new THREE.PointsMaterial({color:0xcfe6ec,size:(.14)*PSCALE,transparent:true,opacity:0,depthWrite:false}));sc.add(steam);
  let P=0;ScrollTrigger.create({trigger:"#chip-track",start:"top top",end:"bottom bottom",scrub:true,onUpdate:s=>P=s.progress});
  const tempV=document.getElementById('chip-temp'),waterV=document.getElementById('chip-water');
  const cbs=[...document.querySelectorAll('#chip-stage .cbox')];
  const vroot=document.getElementById('chip-track');
  let T=0;function animate(){requestAnimationFrame(animate);T++;
    if(!vis(vroot,300))return;
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
  addEventListener('resize',()=>{cam.aspect=W()/H();fitFov(cam);rdr.setSize(W(),H());});
})();


/* ---------- 尾声 · 回到聊天框 + 一滴水落下涟漪（滚动驱动，首尾呼应） ---------- */
(function closingScene(){
  const stage=document.getElementById('close-stage'); if(!stage) return;
  const cv=document.getElementById('close-canvas'); if(!cv) return;
  const ctx=cv.getContext('2d');
  const vroot=document.getElementById('close-track');
  const cbs=[...stage.querySelectorAll('.cbox')];
  const input=document.getElementById('closeInput');
  const userDrops=[];                                   // 每次回车发送 push 一帧号，触发一滴
  let W=0,Hh=0,DPR=Math.min(devicePixelRatio||1,2), fr=0;
  function rz(){W=innerWidth;Hh=innerHeight;cv.width=W*DPR;cv.height=Hh*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
  rz(); addEventListener('resize',rz);
  const DBG=new URLSearchParams(location.search).get('dbgp');
  const COLS=['#5fb6cf','#d2a24a','#e0664a','#9aab6a'];
  const CRGB=[[95,182,207],[210,162,74],[224,102,74],[154,171,106]];
  const NP=520, PARTS=[];
  for(let i=0;i<NP;i++){ PARTS.push({ ang0:i*2.399963, rad0:0.12+((i*83)%100)/100*1.02, spin:(((i*47)%100)/100-0.5)*1.7, col:COLS[i%4], sz:1.8+((i*53)%100)/100*3.2, delay:((i*0.61803)%1) }); }
  const MINI=[]; for(let i=0;i<14;i++){ MINI.push({ ang:i/14*Math.PI*2+i*0.7, col:COLS[i%4], sz:2+((i*37)%100)/100*2.5 }); }
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function drawDrop(x,y,s,a){ ctx.save(); ctx.globalAlpha=a;
    const g=ctx.createRadialGradient(x,y,0,x,y,s*2.8); g.addColorStop(0,'rgba(160,228,242,.5)'); g.addColorStop(1,'rgba(95,182,207,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,s*2.8,0,7); ctx.fill();
    ctx.fillStyle='#cdeef6'; ctx.beginPath(); ctx.moveTo(x,y-s*1.7); ctx.bezierCurveTo(x+s,y-s*0.2,x+s,y+s,x,y+s); ctx.bezierCurveTo(x-s,y+s,x-s,y-s*0.2,x,y-s*1.7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function rings(ox,oy,t,maxR,base,fade){ for(let k=0;k<8;k++){ const tt=cl(t*1.15-k*0.11,0,1); if(tt>0&&tt<1){ const rad=14+tt*maxR; const a=(1-tt)*base*fade; ctx.strokeStyle='rgba(125,205,225,'+a.toFixed(3)+')'; ctx.lineWidth=2.2-tt*1.4; ctx.beginPath(); ctx.ellipse(ox,oy,rad,rad*0.22,0,0,7); ctx.stroke(); } } }
  if(input){ input.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); const v=input.value.trim(); if(v!==''){ userDrops.push({f0:fr,len:v.length}); input.value=''; } } }); }
  function frame(){requestAnimationFrame(frame); fr++;
    let P; if(DBG!==null)P=parseFloat(DBG); else{const r=vroot.getBoundingClientRect(); P=Math.max(0,Math.min(1,-r.top/(vroot.offsetHeight-innerHeight)));}
    ctx.clearRect(0,0,W,Hh);
    const r2=vroot.getBoundingClientRect(); const visible=!(r2.bottom<-60||r2.top>innerHeight+60);
    if(DBG===null && !visible){ if(input) input.classList.remove('on'); return; }
    const cx=W*0.5, boxY=Hh*0.58, boxW=Math.min(560,W*0.74), boxH=66, boxTop=boxY-boxH/2;
    const srcY=Hh*0.42, waterY=Hh*0.82, maxDim=Math.hypot(W,Hh);
    const appear=sm(cl(P/0.06));
    const waterA=sm(cl((P-0.66)/0.09));
    const settle=sm(cl((P-0.72)/0.08));

    // —— 水面（锁定落点）——
    if(waterA>0){
      const wg=ctx.createLinearGradient(0,waterY,0,Hh); wg.addColorStop(0,'rgba(58,108,128,'+(0.30*waterA).toFixed(3)+')'); wg.addColorStop(1,'rgba(38,74,94,'+(0.10*waterA).toFixed(3)+')'); ctx.fillStyle=wg; ctx.fillRect(0,waterY-2,W,Hh-waterY+2);
      ctx.save();
      for(let i=0;i<4;i++){ const gx=W*(0.22+i*0.19)+Math.sin(fr*0.011+i*1.7)*36; const c=CRGB[i]; const gg=ctx.createRadialGradient(gx,waterY+16,0,gx,waterY+16,64); gg.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+','+(0.22*waterA).toFixed(3)+')'); gg.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+',0)'); ctx.fillStyle=gg; ctx.beginPath(); ctx.ellipse(gx,waterY+16,64,26,0,0,7); ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle='rgba(150,205,225,'+(0.42*waterA).toFixed(3)+')'; ctx.lineWidth=1.4; ctx.beginPath();
      for(let x=0;x<=W;x+=8){ const yy=waterY+Math.sin(x*0.018+fr*0.045)*2.6*waterA; if(x===0)ctx.moveTo(x,yy); else ctx.lineTo(x,yy); } ctx.stroke();
    }

    // —— 四色粒子风暴：涌现 → 全屏铺满 → 向心涡旋卷成一滴 ——
    ctx.save();
    for(const p of PARTS){
      const life=sm(cl((P-0.08-p.delay*0.42)/0.13)); if(life<=0) continue;
      const gin=sm(cl((P-0.55)/0.10));
      const shrink=0.30*sm(cl((P-0.12)/0.44));
      const r=p.rad0*maxDim*0.5*(1-shrink)*(1-gin);
      const ang=p.ang0 + P*p.spin*3.4 + life*0.6;
      const px=cx+Math.cos(ang)*r, py=srcY+Math.sin(ang)*r*0.8;
      const a=appear*cl(life*1.3)*(1-gin)*0.82; if(a<=0.01) continue;
      ctx.globalAlpha=a; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(px,py,p.sz*(0.5+0.6*life),0,7); ctx.fill();
    }
    ctx.restore();

    // —— 第一滴（入场自动，滴完静止；不再自动循环）——
    const coreGrow=sm(cl((P-0.50)/0.10)), firstFall=sm(cl((P-0.60)/0.10));
    if(P>0.46 && P<0.74){
      const dy=lerp(srcY,waterY,Math.pow(firstFall,1.7)), ds=4+coreGrow*13;
      const pulse=coreGrow*(1-sm(cl((P-0.62)/0.08)));
      if(pulse>0){ const pg=ctx.createRadialGradient(cx,srcY,0,cx,srcY,ds*3.6); pg.addColorStop(0,'rgba(195,240,250,'+(0.55*pulse*appear).toFixed(3)+')'); pg.addColorStop(1,'rgba(150,220,238,0)'); ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(cx,srcY,ds*3.6,0,7); ctx.fill(); }
      if(firstFall>0){ ctx.save(); ctx.globalAlpha=appear*0.28; const lg=ctx.createLinearGradient(cx,dy-80,cx,dy); lg.addColorStop(0,'rgba(160,228,242,0)'); lg.addColorStop(1,'rgba(160,228,242,.65)'); ctx.strokeStyle=lg; ctx.lineWidth=2.8; ctx.beginPath(); ctx.moveTo(cx,dy-80); ctx.lineTo(cx,dy); ctx.stroke(); ctx.restore(); }
      drawDrop(cx,dy,ds,appear*(1-sm(cl((firstFall-0.86)/0.14))));
    }
    const firstRip=cl((P-0.70)/0.16);
    if(firstRip>0 && firstRip<1){ rings(cx,waterY,firstRip,maxDim*0.5,0.5,1); }

    // —— 用户回车发送：小汇聚 → 滴落 → 涟漪（每句一滴）——
    const sY=boxY+40;                                   // 起滴点在输入框下方，不穿过输入框
    for(let di=userDrops.length-1; di>=0; di--){
      const d=userDrops[di], t=fr-d.f0;
      const sf=0.72+cl(d.len/32)*0.95;                  // 输入越长→水滴越大、涟漪越强、荡越久
      if(t>110+sf*55){ userDrops.splice(di,1); continue; }
      if(t<32){ const g=sm(cl(t/28));
        ctx.save();
        for(let i=0;i<14;i++){ const m=MINI[i], r0=(64+sf*36)*(1-g); const px=cx+Math.cos(m.ang)*r0, py=sY+Math.sin(m.ang)*r0*0.7; const al=(1-g)*0.9; if(al>0.01){ ctx.globalAlpha=al; ctx.fillStyle=m.col; ctx.beginPath(); ctx.arc(px,py,m.sz*(0.6+g*0.6)*sf,0,7); ctx.fill(); } }
        ctx.restore();
        const cg=sm(cl((t-14)/16)); if(cg>0) drawDrop(cx,sY,(3+cg*7)*sf,cg);
      }
      const fp=sm(cl((t-30)/22));
      if(t>=30 && t<56){ const dy=lerp(sY,waterY,Math.pow(fp,1.7));
        ctx.save(); ctx.globalAlpha=0.26; const lg=ctx.createLinearGradient(cx,dy-64,cx,dy); lg.addColorStop(0,'rgba(160,228,242,0)'); lg.addColorStop(1,'rgba(160,228,242,.6)'); ctx.strokeStyle=lg; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(cx,dy-64); ctx.lineTo(cx,dy); ctx.stroke(); ctx.restore();
        drawDrop(cx,dy,8.5*sf,1-sm(cl((fp-0.86)/0.14)));
      }
      const rp=cl((t-54)/(64+sf*40));
      if(rp>0&&rp<1){ rings(cx,waterY,rp,maxDim*(0.30+sf*0.16),0.30+sf*0.20,1); }
    }

    // —— 真输入框：定格态浮现、可交互 ——
    if(input){ if(settle>0.6) input.classList.add('on'); else input.classList.remove('on'); }

    slideBoxes(cbs,P);
  }
  frame();
})();

setTimeout(function(){try{dispatchEvent(new Event('resize'));}catch(e){}},80);

['s1-canvas','chip-canvas','s3-canvas','s4-canvas','s6-canvas','s7-canvas'].forEach(function(id){var c=document.getElementById(id);if(c)c.addEventListener('webglcontextlost',function(e){e.preventDefault();});});
