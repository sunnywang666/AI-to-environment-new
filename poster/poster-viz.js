/* ===================================================================
   云的身体 · 海报可视化（全新原创设计，数据取自项目数据集/文案）
   废土为底 + 故障点缀。D3 + SVG，供截图直出 JPG，并可导出 SVG 进 AI。
   =================================================================== */
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const C = {
    ink:'#F4F2EC', dim:'#A39A8C', dim2:'#7C746A',
    energy:'#C2925A', water:'#86B2C2', ember:'#C2603F', leaf:'#9CAA7C',
    earth:'#3a2e22', earthLine:'#5d4a36', arid:'#6b4527',
    glR:'#ff2e5e', glC:'#36e8ff',
    mono:'Consolas,"Roboto Mono",monospace',
    sans:'"Noto Sans SC",sans-serif', serif:'"Noto Serif SC",serif'
  };

  function mk(id){
    const el=$('#'+id); if(!el) return null;
    el.innerHTML='';
    const w=Math.round(el.clientWidth)||1000, h=Math.round(el.clientHeight)||400;
    const svg=d3.select(el).append('svg')
      .attr('viewBox',`0 0 ${w} ${h}`).attr('width','100%').attr('height','100%')
      .attr('preserveAspectRatio','xMidYMid meet');
    return {el,w,h,svg};
  }
  // 故障节点：主方块 + 红/青错位 + 外环
  function glitchNode(g,x,y,size,color){
    const s=size;
    g.append('rect').attr('x',x-s/2-5).attr('y',y-s/2).attr('width',s).attr('height',s).attr('fill',C.glR).attr('opacity',.7).style('mix-blend-mode','screen');
    g.append('rect').attr('x',x-s/2+5).attr('y',y-s/2).attr('width',s).attr('height',s).attr('fill',C.glC).attr('opacity',.7).style('mix-blend-mode','screen');
    g.append('rect').attr('x',x-s/2).attr('y',y-s/2).attr('width',s).attr('height',s).attr('fill',color);
    g.append('circle').attr('cx',x).attr('cy',y).attr('r',s*1.5).attr('fill','none').attr('stroke',color).attr('stroke-width',3).attr('opacity',.55);
    g.append('circle').attr('cx',x).attr('cy',y).attr('r',s*2.4).attr('fill','none').attr('stroke',color).attr('stroke-width',2).attr('opacity',.28);
  }
  function txt(sel,x,y,s,fill,t,opt={}){
    return sel.append('text').attr('x',x).attr('y',y).attr('font-size',s).attr('fill',fill)
      .attr('font-family',opt.font||C.sans).attr('font-weight',opt.w||400)
      .attr('text-anchor',opt.anchor||'start').attr('letter-spacing',opt.ls||0)
      .style('mix-blend-mode',opt.blend||'normal').text(t);
  }

  /* ============ 1. 中美缺水地图 + 数据中心集群（重做） ============ */
  const AR_BASE='#3d3023', AR_MED='#604528', AR_SEV='#7c4c21', AR_LINE='#7a6149';
  // 辉光 + 故障方块节点
  function mapNode(g,x,y,big,color){
    const r=big?15:8;
    g.append('circle').attr('cx',x).attr('cy',y).attr('r',r*3.0).attr('fill',color).attr('opacity',.10);
    g.append('circle').attr('cx',x).attr('cy',y).attr('r',r*1.8).attr('fill',color).attr('opacity',.16);
    glitchNode(g,x,y,big?24:14,color);
  }
  function mapTitle(svg,x,name,note){
    txt(svg,x,52,52,C.water,name,{w:900});
    svg.append('rect').attr('x',x).attr('y',70).attr('width',96).attr('height',7).attr('fill',C.water);
    txt(svg,x,118,30,C.dim,note,{font:C.mono});
  }
  async function renderMap(){
    const o=mk('viz-map'); if(!o) return;
    const {svg,w,h}=o;
    const gap=110, halfW=(w-gap)/2;
    const top=150, mapH=h-top-60, pad=44;
    mapTitle(svg,0,'中国','数据中心顺着「东数西算」扎堆西部干旱省区');
    mapTitle(svg,halfW+gap,'美国','约 2/3 新建数据中心落在缺水区，弗州走廊最密集');
    const gCN=svg.append('g').attr('transform',`translate(0,${top})`);
    const gUS=svg.append('g').attr('transform',`translate(${halfW+gap},${top})`);
    let cn,us;
    try{ cn=await d3.json('../data/china-provinces.json'); }catch(e){ cn=null; }
    try{ us=await d3.json('../data/us-states.json'); }catch(e){ us=null; }

    function bigLabel(g,x,y,dir,t1,t2){
      const lx=x+dir*46, ty=y-70;
      g.append('line').attr('x1',x).attr('y1',y).attr('x2',lx).attr('y2',ty+30).attr('stroke',C.energy).attr('stroke-width',2).attr('opacity',.8);
      const a=dir>0?'start':'end';
      txt(g,lx,ty,38,C.ink,t1,{w:900,anchor:a});
      txt(g,lx,ty+40,30,C.energy,t2,{font:C.mono,anchor:a});
    }

    // ---- 中国 ----
    if(cn && cn.features){
      const proj=d3.geoMercator().fitExtent([[pad,pad],[halfW-pad,mapH-pad]],cn);
      const path=d3.geoPath(proj);
      const sev=/新疆|内蒙古|甘肃|宁夏|青海/, med=/陕西|山西|河北|北京|天津|云南/;
      gCN.selectAll('path').data(cn.features).join('path').attr('d',path)
        .attr('fill',d=>{const nm=(d.properties&&(d.properties.name_zh||d.properties.name))||''; return sev.test(nm)?AR_SEV:med.test(nm)?AR_MED:AR_BASE;})
        .attr('stroke',AR_LINE).attr('stroke-width',1.1).attr('stroke-linejoin','round');
      const nodes=[
        {lon:105.19,lat:37.5,big:true},{lon:111.7,lat:40.8},{lon:107.6,lat:35.7},
        {lon:106.6,lat:26.4},{lon:113.6,lat:24.8},{lon:118.4,lat:31.3},{lon:116.7,lat:39.5}
      ];
      nodes.forEach(n=>{const p=proj([n.lon,n.lat]); if(!p) return; mapNode(gCN,p[0],p[1],n.big,n.big?C.energy:C.ember);});
      const bp=proj([105.19,37.5]); if(bp) bigLabel(gCN,bp[0],bp[1],1,'宁夏·中卫','年降水200mm｜约65万台服务器');
    } else { txt(gCN,40,mapH/2,30,C.dim,'[china geojson 加载失败]',{font:C.mono}); }

    // ---- 美国：1479 个真实数据中心坐标做密度散点 ----
    if(us && us.features){
      const proj=(d3.geoAlbersUsa?d3.geoAlbersUsa():d3.geoMercator()).fitExtent([[pad,pad],[halfW-pad,mapH-pad]],us);
      const path=d3.geoPath(proj);
      // 统一低对比陆地 + 西南极淡干旱暗示（避免方块感）
      const sev=/^(04|32|49|35|48)$/, med=/^(06|08|16|56|41)$/;
      gUS.selectAll('path').data(us.features).join('path').attr('d',path)
        .attr('fill',d=>{const id=d.id||''; return sev.test(id)?'#3a2c1c':med.test(id)?'#332a1b':'#2c2418';})
        .attr('stroke','#4a3c2c').attr('stroke-width',1).attr('stroke-linejoin','round');
      // 真实数据中心点
      const dots=[]; (window.US_DC||[]).forEach(d=>{const p=proj(d); if(p) dots.push(p);});
      gUS.append('g').attr('class','dcpts').selectAll('circle').data(dots).join('circle')
        .attr('cx',d=>d[0]).attr('cy',d=>d[1]).attr('r',4.5).attr('fill',C.energy).attr('opacity',.42);
      // 弗吉尼亚走廊高亮 + 标注
      const bp=proj([-77.5,39.0]);
      if(bp){ mapNode(gUS,bp[0],bp[1],true,C.ember); bigLabel(gUS,bp[0],bp[1],-1,'弗吉尼亚·数据中心走廊','约600座｜占全州40%用电'); }
      txt(gUS,pad,mapH-8,28,C.energy,'● '+dots.length+' 处数据中心（实际坐标）',{font:C.mono});
    } else { txt(gUS,40,mapH/2,30,C.dim,'[us geojson 加载失败]',{font:C.mono}); }

    // ---- 图例 ----
    const ly=h-26, lx=0;
    const defs=svg.append('defs'); const lg=defs.append('linearGradient').attr('id','aridleg');
    lg.append('stop').attr('offset','0%').attr('stop-color',AR_BASE);
    lg.append('stop').attr('offset','100%').attr('stop-color',AR_SEV);
    svg.append('rect').attr('x',lx).attr('y',ly-26).attr('width',320).attr('height',24).attr('fill','url(#aridleg)').attr('stroke',AR_LINE);
    txt(svg,lx,ly+12,27,C.dim,'湿',{font:C.mono}); txt(svg,lx+296,ly+12,27,C.dim,'越缺水',{font:C.mono});
    glitchNode(svg,lx+560,ly-14,26,C.energy);
    txt(svg,lx+600,ly-4,29,C.dim,'数据中心集群（越密＝越扎堆）',{font:C.mono});
  }

  /* ============ 2. 各国年用电天际线（数据中心 448TWh 故障高亮） ============ */
  function renderSkyline(){
    const o=mk('viz-skyline'); if(!o) return;
    const {svg,w,h}=o;
    const data=[
      {n:'中国',v:10564},{n:'美国',v:4536},{n:'印度',v:2083},{n:'俄罗斯',v:1176},
      {n:'日本',v:1030},{n:'巴西',v:762},{n:'加拿大',v:646},{n:'韩国',v:625},
      {n:'德国',v:520},{n:'法国',v:477},{n:'沙特阿拉伯',v:455},
      {n:'全球数据中心',v:448,hl:true},{n:'伊朗',v:396}
    ];
    const padL=560, padR=260, top=8, bot=18;
    const x=d3.scaleSqrt().domain([0,10564]).range([0,w-padL-padR]);
    const rowH=(h-top-bot)/data.length;
    const g=svg.append('g').attr('transform',`translate(${padL},${top})`);
    data.forEach((d,i)=>{
      const y=i*rowH, bh=rowH*0.62, bw=x(d.v);
      const fill=d.hl?C.energy:'#5a3a24';
      if(d.hl){ // 故障高亮条
        g.append('rect').attr('x',-6).attr('y',y).attr('width',bw).attr('height',bh).attr('fill',C.glR).attr('opacity',.55).style('mix-blend-mode','screen');
        g.append('rect').attr('x',6).attr('y',y).attr('width',bw).attr('height',bh).attr('fill',C.glC).attr('opacity',.55).style('mix-blend-mode','screen');
      }
      g.append('rect').attr('x',0).attr('y',y).attr('width',bw).attr('height',bh).attr('fill',fill);
      // 排名 + 国名
      txt(g,-padL+30,y+bh*0.78,30,d.hl?C.energy:C.dim,String(i+1).padStart(2,'0'),{font:C.mono,w:700});
      txt(g,-padL+120,y+bh*0.78,d.hl?40:34,d.hl?C.ink:'#D8D2C6',d.n,{w:d.hl?900:500});
      // 数值
      txt(g,bw+24,y+bh*0.78,d.hl?40:32,d.hl?C.energy:C.dim,d.v.toLocaleString()+' TWh',{font:C.mono,w:d.hl?900:400});
    });
    // 数据中心说明牌
    const hlY=top+11*rowH;
    txt(svg,padL+x(448)+360,hlY+rowH*0.30,30,C.energy,'≈ 法国全国用电 · 当成国家排全球第 12',{font:C.mono,w:700});
  }

  /* ============ 3. 水的两条路（蒸发 / 化学废水） ============ */
  function renderSplit(){
    const o=mk('viz-split'); if(!o) return;
    const {svg,w,h}=o;
    const inX=40, splitX=w*0.40, midY=h*0.5, inW=h*0.34;
    // 入流
    svg.append('rect').attr('x',inX).attr('y',midY-inW/2).attr('width',splitX-inX).attr('height',inW).attr('fill',C.water).attr('opacity',.85);
    txt(svg,inX+20,midY-inW/2-22,34,C.water,'抽来的清洁淡水',{w:900});
    // 上路：蒸发 75%（变淡、虚化）
    const upW=inW*0.77, dnW=inW*0.23;
    const upY=h*0.16, dnY=h*0.82;
    const up=d3.path();
    up.moveTo(splitX,midY-inW/2); up.bezierCurveTo(splitX+260,midY-inW/2,w*0.62-260,upY-upW/2,w*0.62,upY-upW/2);
    up.lineTo(w*0.62,upY+upW/2); up.bezierCurveTo(w*0.62-260,upY+upW/2,splitX+260,midY-inW/2+upW,splitX,midY-inW/2+upW);
    up.closePath();
    svg.append('path').attr('d',up.toString()).attr('fill',C.water).attr('opacity',.42);
    // 蒸发雾点
    for(let i=0;i<28;i++){ const px=w*0.62+40+Math.abs(((i*89)%520)); const py=upY-upW/2+((i*53)%upW); svg.append('circle').attr('cx',px).attr('cy',py).attr('r',(i%4)+3).attr('fill',C.water).attr('opacity',.25);}
    txt(svg,w*0.64,upY-upW/2-18,46,C.water,'7–8 成 · 蒸发升空',{w:900});
    txt(svg,w*0.64,upY+18,30,C.dim,'多半不回到原来那条河 —— 对当地是净损失',{font:C.mono});
    // 下路：化学废水 25%（锈红 + 故障）
    const dn=d3.path();
    dn.moveTo(splitX,midY+inW/2); dn.bezierCurveTo(splitX+260,midY+inW/2,w*0.62-260,dnY+dnW/2,w*0.62,dnY+dnW/2);
    dn.lineTo(w*0.62,dnY-dnW/2); dn.bezierCurveTo(w*0.62-260,dnY-dnW/2,splitX+260,midY+inW/2-dnW,splitX,midY+inW/2-dnW);
    dn.closePath();
    svg.append('path').attr('d',dn.toString()).attr('fill',C.ember).attr('opacity',.32).attr('filter','url(#warp)');
    txt(svg,w*0.64,dnY+10,46,C.ember,'2–3 成 · 化学废水',{w:900});
    txt(svg,w*0.64,dnY+50,30,C.dim,'浓缩盐与矿物，加杀菌剂、含磷缓蚀剂排出 —— 真正回不去的',{font:C.mono});
  }

  /* ============ 4. 电网碳强度：挪威25 vs 波兰716（烟柱） ============ */
  function renderCarbon(){
    const o=mk('viz-carbon'); if(!o) return;
    const {svg,w,h}=o;
    const base=h-70, maxH=h-110;
    const y=d3.scaleLinear().domain([0,716]).range([0,maxH]);
    const items=[
      {n:'挪威',v:25,c:C.leaf,x:w*0.22,dirty:false},
      {n:'波兰',v:716,c:C.ember,x:w*0.62,dirty:true}
    ];
    // 参考线
    [{v:467,t:'世界均值 467'},{v:555,t:'中国 555'}].forEach(r=>{
      const yy=base-y(r.v);
      svg.append('line').attr('x1',w*0.12).attr('x2',w*0.78).attr('y1',yy).attr('y2',yy).attr('stroke',C.dim2).attr('stroke-width',1.5).attr('stroke-dasharray','10 10').attr('opacity',.6);
      txt(svg,w*0.79,yy+10,26,C.dim,r.t,{font:C.mono});
    });
    const bw=180;
    items.forEach(it=>{
      const bh=y(it.v);
      svg.append('rect').attr('x',it.x-bw/2).attr('y',base-bh).attr('width',bw).attr('height',bh).attr('fill',it.c);
      txt(svg,it.x,base+44,40,it.c,it.n,{anchor:'middle',w:900});
      txt(svg,it.x,base-bh-22,46,it.c,it.v+' g',{anchor:'middle',w:900,font:C.mono});
      if(it.dirty){ for(let i=0;i<22;i++){ const px=it.x-60+((i*71)%120); const py=base-bh-50-((i*37)%150); svg.append('circle').attr('cx',px).attr('cy',py).attr('r',(i%5)+5).attr('fill',C.ember).attr('opacity',.18);} }
    });
    // 倍数
    txt(svg,w*0.42,h*0.36,120,C.ink,'28×',{anchor:'middle',w:900,font:C.mono});
    txt(svg,w*0.42,h*0.36+54,28,C.dim,'同一度电的碳差距',{anchor:'middle',font:C.mono});
    txt(svg,w*0.12,40,30,C.dim,'克 CO₂ / 千瓦时',{font:C.mono});
  }

  /* ============ 5. 账单票据（保持干净·情感锚点） ============ */
  function renderBills(){
    const o=mk('viz-bills'); if(!o) return;
    const {svg,w,h}=o;
    const cards=[
      {big:'$940.08',cap:['丽贝卡 2 月电费，','超过她当月全部收入'],c:C.ember},
      {big:'$1,000',cap:['詹妮弗冬季月水电，','高于 $798 房贷'],c:C.ember},
      {big:'+73%',cap:['西弗吉尼亚居民','电价十年涨幅'],c:C.energy},
      {big:'10万户',cap:['一座 600MW 数据中心','的用电当量'],c:C.water}
    ];
    const gap=60, cw=(w-gap*3)/4, ch=h-60;
    const rot=[-1.6,1.2,-1.0,1.5];
    cards.forEach((d,i)=>{
      const cx=i*(cw+gap)+cw/2, cy=h/2;
      const g=svg.append('g').attr('transform',`translate(${cx},${cy}) rotate(${rot[i]})`);
      // 票据纸
      g.append('rect').attr('x',-cw/2).attr('y',-ch/2).attr('width',cw).attr('height',ch).attr('fill','#E4DAC6').attr('stroke','#b9ac90').attr('stroke-width',2);
      // 锯齿穿孔（上下边）
      const teeth=Math.floor(cw/26);
      for(let t=0;t<=teeth;t++){ const tx=-cw/2+t*(cw/teeth); g.append('circle').attr('cx',tx).attr('cy',-ch/2).attr('r',7).attr('fill','#2b1c12'); g.append('circle').attr('cx',tx).attr('cy',ch/2).attr('r',7).attr('fill','#2b1c12'); }
      txt(g,-cw/2+34,-ch/2+58,26,'#8a7a5c','ELECTRIC BILL',{font:C.mono,ls:2});
      g.append('line').attr('x1',-cw/2+34).attr('x2',cw/2-34).attr('y1',-ch/2+82).attr('y2',-ch/2+82).attr('stroke','#b9ac90').attr('stroke-dasharray','6 6');
      txt(g,0,-30,d.big.length>5?96:120,'#241a10',d.big,{anchor:'middle',w:900,font:C.mono});
      d.cap.forEach((line,li)=> txt(g,0,70+li*44,36,'#3a2c1a',line,{anchor:'middle',w:500}));
      // 色条
      g.append('rect').attr('x',-cw/2).attr('y',ch/2-16).attr('width',cw).attr('height',16).attr('fill',d.c);
    });
  }

  /* ============ 6. 对数刻度故障条：0.32 → 519（千倍） ============ */
  function renderScale(){
    const o=mk('viz-scale'); if(!o) return;
    const {svg,w,h}=o;
    const padL=200, padR=200, axisY=h*0.55;
    const x=d3.scaleLog().domain([0.1,1000]).range([padL,w-padR]);
    // 轴
    svg.append('line').attr('x1',padL).attr('x2',w-padR).attr('y1',axisY).attr('y2',axisY).attr('stroke',C.dim).attr('stroke-width',3);
    [0.1,1,10,100,1000].forEach(t=>{ const xx=x(t); svg.append('line').attr('x1',xx).attr('x2',xx).attr('y1',axisY-14).attr('y2',axisY+14).attr('stroke',C.dim).attr('stroke-width',2); txt(svg,xx,axisY+52,28,C.dim,t+' ml',{anchor:'middle',font:C.mono}); });
    // 企业口径 0.32 / 0.26
    const ex=x(0.32);
    svg.append('circle').attr('cx',ex).attr('cy',axisY).attr('r',16).attr('fill',C.water);
    txt(svg,ex,axisY-90,40,C.water,'企业口径',{anchor:'middle',w:900});
    txt(svg,ex,axisY-46,34,C.ink,'0.32 / 0.26 毫升',{anchor:'middle',font:C.mono,w:700});
    txt(svg,ex,axisY-12,24,C.dim,'只算机房直接蒸发',{anchor:'middle',font:C.mono});
    // 学术口径 519（大水滴 + 故障）
    const ax=x(519);
    const dg=svg.append('g');
    dg.append('circle').attr('cx',ax-6).attr('cy',axisY).attr('r',40).attr('fill',C.glR).attr('opacity',.6).style('mix-blend-mode','screen');
    dg.append('circle').attr('cx',ax+6).attr('cy',axisY).attr('r',40).attr('fill',C.glC).attr('opacity',.6).style('mix-blend-mode','screen');
    dg.append('circle').attr('cx',ax).attr('cy',axisY).attr('r',40).attr('fill',C.ember);
    txt(svg,ax,axisY-104,40,C.ember,'学术口径',{anchor:'middle',w:900});
    txt(svg,ax,axisY-60,40,C.ink,'≈ 519 毫升',{anchor:'middle',font:C.mono,w:900});
    txt(svg,ax,axisY+92,24,C.dim,'含发电环节耗水（一瓶矿泉水）',{anchor:'middle',font:C.mono});
    // 千倍故障撕裂带
    const mx=(ex+ax)/2;
    txt(svg,mx,axisY-150,90,C.energy,'× 1000+',{anchor:'middle',w:900,font:C.mono,blend:'normal'}).attr('filter','url(#rgbsplit)');
    // 锯齿连线
    let dpath='M'+ex+','+axisY; const seg=14; for(let i=1;i<=seg;i++){ const xx=ex+(ax-ex)*i/seg; const yy=axisY-((i%2)?28:-28); dpath+=' L'+xx+','+yy; }
    svg.append('path').attr('d',dpath).attr('fill','none').attr('stroke',C.energy).attr('stroke-width',2.5).attr('opacity',.5);
  }

  /* ============ 7. 杰文斯：总用电 448→945 上升 vs 单次效率 100→11 下降 ============ */
  function renderJevons(){
    const o=mk('viz-jevons'); if(!o) return;
    const {svg,w,h}=o;
    const padL=130,padR=130,padT=70,padB=90;
    const years=[2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030];
    const total=[200,225,255,290,330,370,415,448,540,640,740,840,945];
    const eff=[100,82,66,52,41,33,27,22,18,15,13,12,11];
    const x=d3.scalePoint().domain(years).range([padL,w-padR]);
    const yT=d3.scaleLinear().domain([0,1000]).range([h-padB,padT]);
    const yE=d3.scaleLinear().domain([0,100]).range([h-padB,padT]);
    // 基线
    svg.append('line').attr('x1',padL).attr('x2',w-padR).attr('y1',h-padB).attr('y2',h-padB).attr('stroke',C.dim2).attr('stroke-width',2);
    years.filter((y,i)=>i%2===0||y===2025).forEach(y=> txt(svg,x(y),h-padB+44,26,C.dim,y,{anchor:'middle',font:C.mono}));
    // 2025 分界（实测/预测）
    svg.append('line').attr('x1',x(2025)).attr('x2',x(2025)).attr('y1',padT-10).attr('y2',h-padB).attr('stroke',C.dim2).attr('stroke-width',1.5).attr('stroke-dasharray','8 8').attr('opacity',.6);
    txt(svg,x(2025),padT-22,24,C.dim,'2025 实测｜往后为预测',{anchor:'middle',font:C.mono});
    const split=years.indexOf(2025);
    const lineT=d3.line().x((d,i)=>x(years[i])).y(d=>yT(d));
    const lineE=d3.line().x((d,i)=>x(years[i])).y(d=>yE(d));
    // 总用电（赭金，实线→虚线）
    svg.append('path').datum(total.slice(0,split+1)).attr('d',lineT).attr('fill','none').attr('stroke',C.energy).attr('stroke-width',7);
    svg.append('path').datum(total.slice(split)).attr('d',d3.line().x((d,i)=>x(years[split+i])).y(d=>yT(d))).attr('fill','none').attr('stroke',C.energy).attr('stroke-width',7).attr('stroke-dasharray','14 12');
    // 效率（灰蓝，下降）
    svg.append('path').datum(eff).attr('d',lineE).attr('fill','none').attr('stroke',C.water).attr('stroke-width',6).attr('opacity',.9);
    // 端点标注
    txt(svg,x(2018)-10,yT(200)-24,30,C.energy,'总用电',{anchor:'end',w:900});
    txt(svg,x(2030),yT(945)-26,46,C.energy,'945 TWh',{anchor:'end',w:900,font:C.mono});
    txt(svg,x(2025),yT(448)+50,32,C.energy,'448',{anchor:'middle',w:900,font:C.mono});
    txt(svg,x(2018)-10,yE(100)+10,30,C.water,'单次效率指数',{anchor:'end',w:900});
    txt(svg,x(2030),yE(11)-20,40,C.water,'100→11',{anchor:'end',w:900,font:C.mono});
    txt(svg,w/2,h-20,30,C.ink,'效率年年在提升，总用电却被使用量暴涨吞没 —— 杰文斯悖论',{anchor:'middle',w:500});
  }

  /* ============ 真二维码（离线生成，指向线上网站） ============ */
  function renderQR(){
    const el=$('#qr'); if(!el) return;
    if(window.QR_IMG){ el.innerHTML='<img src="'+window.QR_IMG+'" alt="QR" style="width:100%;height:100%;object-fit:contain;display:block;background:#fff">'; return; }
    const d=window.QR_DATA;
    if(!d){ el.innerHTML='<svg viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" fill="#fff"/><text x="50" y="54" text-anchor="middle" font-size="11" fill="#111" font-family="monospace">QR?</text></svg>'; return; }
    const n=d.size, q=4, N=n+q*2;
    let s=`<svg viewBox="0 0 ${N} ${N}" width="100%" height="100%" shape-rendering="crispEdges"><rect width="${N}" height="${N}" fill="#ffffff"/>`;
    let path='';
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(d.matrix[r][c]) path+=`M${c+q},${r+q}h1v1h-1z`;
    s+=`<path d="${path}" fill="#141414"/></svg>`;
    el.innerHTML=s;
  }

  /* ----- band 切片 ----- */
  function applyBandMode(){
    const params=new URLSearchParams(location.search);
    const bands=[...document.querySelectorAll('.band')];
    const poster=$('#poster');
    window.__BANDS__=bands.map(b=>({h:b.offsetHeight,top:b.offsetTop,cls:b.className}));
    if(params.has('band')){
      const i=Math.max(0,Math.min(bands.length-1,parseInt(params.get('band'),10)||0));
      const b=bands[i], off=b.offsetTop, hh=b.offsetHeight;
      poster.style.transform=`translateY(${-off}px)`;
      document.documentElement.style.height=hh+'px'; document.body.style.height=hh+'px';
      document.documentElement.style.overflow='hidden'; document.body.style.overflow='hidden';
    }
  }

  function boot(){
    try{renderSkyline();}catch(e){console.error('skyline',e);}
    try{renderSplit();}catch(e){console.error('split',e);}
    try{renderCarbon();}catch(e){console.error('carbon',e);}
    try{renderBills();}catch(e){console.error('bills',e);}
    try{renderScale();}catch(e){console.error('scale',e);}
    try{renderJevons();}catch(e){console.error('jevons',e);}
    try{renderQR();}catch(e){console.error('qr',e);}
    renderMap().catch(e=>console.error('map',e));
    applyBandMode();
  }
  if(document.readyState!=='loading') boot();
  else document.addEventListener('DOMContentLoaded',boot);
})();
