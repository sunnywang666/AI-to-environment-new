/* charts.js · 全部图表（注册表）。每个函数把图渲染进一个 .panel 容器。
   依赖 d3。数据取自 素材总表_v1，可溯源。 */
(function () {
  const C={water:"#5fb6cf",energy:"#d2a24a",ember:"#e0664a",leaf:"#9aab6a",dim:"#8a969c",grey:"rgba(200,215,225,.16)",text:"#e7eef0"};
  const D=window.d3;
  const head=(el,t,s)=>{el.innerHTML=`<div class="fig"><div class="fig__title">${t}</div><div class="fig__sub">${s}</div><div class="fig__svg"></div></div>`;return el.querySelector(".fig__svg");};
  const svg=(mount,vb)=>D.select(mount).append("svg").attr("viewBox",vb);

  // 通用横向条形
  function hbar(el,{title,sub,data,unit,fmt=(v)=>v}){
    const m=head(el,title,sub),W=560,rowH=30,h=data.length*rowH+8,padL=110,padR=70;
    const x=D.scaleLinear().domain([0,D.max(data,d=>d.v)]).range([0,W-padL-padR]);
    const s=svg(m,`0 0 ${W} ${h}`),g=s.append("g").attr("transform",`translate(${padL},4)`);
    const r=g.selectAll("g").data(data).join("g").attr("transform",(d,i)=>`translate(0,${i*rowH})`);
    r.append("text").attr("x",-10).attr("y",rowH/2).attr("dy",".35em").attr("text-anchor","end").attr("class","bar-label")
      .style("font-weight",d=>d.hl?700:400).style("fill",d=>d.hl?d.c||C.energy:C.text).text(d=>d.name);
    r.append("rect").attr("y",5).attr("height",rowH-10).attr("rx",2).attr("width",d=>Math.max(1,x(d.v))).attr("fill",d=>d.hl?(d.c||C.energy):C.grey);
    r.append("text").attr("x",d=>x(d.v)+7).attr("y",rowH/2).attr("dy",".35em").attr("class","bar-label num")
      .style("fill",d=>d.hl?(d.c||C.energy):C.dim).style("font-weight",d=>d.hl?700:400).text(d=>fmt(d.v));
  }
  // 通用竖向条形
  function vbar(el,{title,sub,data,ymax,hlNames=[],color=C.leaf}){
    const m=head(el,title,sub),W=560,h=280,p={t:10,r:14,b:38,l:42};
    const x=D.scaleBand().domain(data.map(d=>d.n)).range([p.l,W-p.r]).padding(.32);
    const y=D.scaleLinear().domain([0,ymax]).range([h-p.b,p.t]);
    const s=svg(m,`0 0 ${W} ${h}`);
    s.append("g").attr("class","axis").attr("transform",`translate(0,${h-p.b})`).call(D.axisBottom(x).tickSize(0)).select(".domain").remove();
    s.append("g").attr("class","axis").attr("transform",`translate(${p.l},0)`).call(D.axisLeft(y).ticks(4).tickSize(-(W-p.l-p.r))).call(g=>g.select(".domain").remove());
    s.selectAll(".b").data(data).join("rect").attr("x",d=>x(d.n)).attr("y",d=>y(d.v)).attr("width",x.bandwidth())
      .attr("height",d=>h-p.b-y(d.v)).attr("rx",2).attr("fill",d=>hlNames.includes(d.n)?color:C.grey);
    s.selectAll(".v").data(data).join("text").attr("x",d=>x(d.n)+x.bandwidth()/2).attr("y",d=>y(d.v)-6)
      .attr("text-anchor","middle").attr("class","bar-label num").style("font-size","11px").text(d=>d.v);
  }
  // 通用折线
  function line(el,{title,sub,series,xdom,ydom,xticks,color=C.energy,note}){
    const m=head(el,title,sub),W=560,h=290,p={t:14,r:20,b:34,l:44};
    const x=D.scaleLinear().domain(xdom).range([p.l,W-p.r]),y=D.scaleLinear().domain(ydom).range([h-p.b,p.t]);
    const s=svg(m,`0 0 ${W} ${h}`);
    s.append("g").attr("class","axis").attr("transform",`translate(0,${h-p.b})`).call(D.axisBottom(x).tickValues(xticks).tickFormat(D.format("d")).tickSize(0)).select(".domain").remove();
    s.append("g").attr("class","axis").attr("transform",`translate(${p.l},0)`).call(D.axisLeft(y).ticks(4).tickSize(-(W-p.l-p.r))).call(g=>g.select(".domain").remove());
    const ln=D.line().x(d=>x(d[0])).y(d=>y(d[1]));
    series.forEach(se=>{
      s.append("path").datum(se.pts).attr("fill","none").attr("stroke",se.color||color).attr("stroke-width",2.4)
        .attr("stroke-dasharray",se.dash?"5 4":null).attr("d",ln);
      const last=se.pts[se.pts.length-1];
      s.append("text").attr("x",x(last[0])-4).attr("y",y(last[1])-8).attr("text-anchor","end").attr("class","bar-label").style("fill",se.color||color).style("font-weight",700).text(se.label);
    });
    if(note)s.append("text").attr("x",p.l+6).attr("y",p.t+14).attr("class","bar-label").style("fill",C.dim).style("font-size","12px").text(note);
  }
  // 大数字组
  function bignums(el,{title,sub,items}){
    const m=head(el,title,sub);
    m.parentElement.querySelector(".fig__svg").outerHTML=
      '<div class="kpi-grid">'+items.map(i=>`<div class="kpi"><div class="kpi__big num" style="color:${i.c||C.ember}">${i.big}</div><div class="kpi__cap">${i.cap}</div></div>`).join("")+'</div>';
  }
  // 占比环
  function donut(el,{title,sub,pct,label,sub2,color=C.water}){
    const m=head(el,title,sub),r=78,c=2*Math.PI*r;
    const s=svg(m,"0 0 300 220");const g=s.append("g").attr("transform","translate(150,110)");
    g.append("circle").attr("r",r).attr("fill","none").attr("stroke","rgba(200,215,225,.14)").attr("stroke-width",20);
    g.append("circle").attr("r",r).attr("fill","none").attr("stroke",color).attr("stroke-width",20).attr("stroke-dasharray",`${c*pct} 999`).attr("transform","rotate(-90)");
    g.append("text").attr("y",-2).attr("text-anchor","middle").style("font-size","30px").style("font-weight",900).style("fill",color).text(label);
    g.append("text").attr("y",22).attr("text-anchor","middle").attr("class","bar-label").style("font-size","12px").text(sub2);
  }

  const reg={
    /* ① 取水 */
    waterstress(el){ const m=head(el,"机器最渴时，恰恰是最缺水的地方","年均降水对比。来源：宁夏枢纽、Fortune (2026)");
      const s=svg(m,"0 0 320 260");const g=s.append("g").attr("transform","translate(40,24)");
      [["宁夏",200,C.water,0],["全国均值",630,C.grey,150]].forEach(([n,v,col,dx])=>{const hh=v/630*180;
        g.append("rect").attr("x",dx).attr("y",200-hh).attr("width",70).attr("height",hh).attr("rx",3).attr("fill",col);
        g.append("text").attr("x",dx+35).attr("y",-6).attr("text-anchor","middle").attr("class","bar-label").text(n);
        g.append("text").attr("x",dx+35).attr("y",218).attr("text-anchor","middle").attr("class","bar-label num").style("fill",col===C.water?C.water:C.dim).text(v+" mm");}); },
    regional(el){ hbar(el,{title:"同一次查询，在不同地方用水差近 7 倍",sub:"几次问答 ≈ 一瓶 500ml 水（数字越小越费水）。来源：UC Riverside CACM (2025)",
      data:[{name:"华盛顿州",v:10.5,hl:true,c:C.ember},{name:"美国均值",v:30},{name:"爱尔兰",v:70.4,hl:true,c:C.water}],fmt:v=>v+" 次"}); },
    /* ② 进机房 */
    ranking(el){ hbar(el,{title:'把"数据中心"插进全球用电排行',sub:"2025 年各国年用电（太瓦时）；数据中心约 448 TWh。来源：Ember/OWID (2026)、UNU (2025)",
      data:[{name:"中国",v:10564},{name:"美国",v:4536},{name:"印度",v:2083},{name:"俄罗斯",v:1176},{name:"日本",v:1030},{name:"德国",v:520},{name:"法国",v:477},{name:"沙特",v:455},{name:"数据中心",v:448,hl:true},{name:"伊朗",v:396}],fmt:v=>v.toLocaleString()}); },
    growth(el){ line(el,{title:"数据中心用电：一条还在加速的曲线",sub:"全球数据中心年用电（太瓦时）。实线=实测，虚线=预测。来源：IEA (2025)",
      xdom:[2020,2030],ydom:[0,1000],xticks:[2020,2024,2027,2030],color:C.energy,note:"年增约 12%，是全球电力增速的 4 倍",
      series:[{label:"实测",color:C.energy,pts:[[2020,250],[2022,300],[2024,415],[2025,448]]},{label:"预测 945",color:C.energy,dash:true,pts:[[2025,448],[2027,640],[2030,945]]}]}); },
    /* ③ 水分两条路 */
    split(el){ const m=head(el,"用完之后，水分成两条路","现场冷却水去向（典型比例）。来源：UC Riverside CACM (2025)");
      const s=svg(m,"0 0 600 360");
      s.append("line").attr("x1",60).attr("y1",180).attr("x2",150).attr("y2",180).attr("stroke","rgba(200,215,225,.4)").attr("stroke-width",10);
      s.append("text").attr("x",55).attr("y",165).attr("text-anchor","end").attr("class","bar-label").style("font-size","12px").text("扛完热的水");
      s.append("path").attr("d","M160,178 C 300,168 380,90 540,70").attr("fill","none").attr("stroke",C.water).attr("stroke-width",40).attr("stroke-linecap","round").attr("opacity",.85);
      s.append("path").attr("d","M160,182 C 300,200 380,290 540,310").attr("fill","none").attr("stroke",C.ember).attr("stroke-width",14).attr("stroke-linecap","round").attr("opacity",.85);
      s.append("text").attr("x",540).attr("y",50).attr("text-anchor","end").attr("class","bar-label num").style("font-size","20px").style("font-weight",900).style("fill",C.water).text("70–80%");
      s.append("text").attr("x",540).attr("y",92).attr("text-anchor","end").attr("class","bar-label").style("font-size","12px").text("蒸发升空 · 别处降雨，本地净损失");
      s.append("text").attr("x",540).attr("y",335).attr("text-anchor","end").attr("class","bar-label num").style("font-size","16px").style("font-weight",900).style("fill",C.ember).text("20–30%");
      s.append("text").attr("x",540).attr("y",353).attr("text-anchor","end").attr("class","bar-label").style("font-size","12px").style("fill",C.ember).text("化学废水 · 回不去了"); },
    /* ④ 污染 */
    diesel(el){ bignums(el,{title:"给芯片供电、备电，正在污染空气",sub:"来源：SELC/田纳西大学 (2025)、《The Unpaid Toll》(2024)",
      items:[{big:"+79%",cap:"xAI 数据中心投运后，紧邻厂区二氧化氮峰值上升"},{big:"234 台",cap:"亚马逊一处园区许可证上的柴油发电机"},{big:"$200 亿",cap:"2030 年美国数据中心空气污染年健康损失"},{big:"~1300 人",cap:"由此每年最多导致的过早死亡"}]}); },
    carbonbar(el){ vbar(el,{title:"同样一度电，建在哪里碳排差近 30 倍",sub:"各国电网每度电碳强度（克 CO₂/千瓦时，2024）。来源：Ember/OWID",
      data:[{n:"挪威",v:25},{n:"法国",v:40},{n:"德国",v:336},{n:"美国",v:386},{n:"中国",v:555},{n:"印度",v:705},{n:"波兰",v:716}],ymax:760,hlNames:["挪威","波兰"],color:C.leaf}); },
    carbontrend(el){ line(el,{title:"数据中心碳排放，六年翻一倍",sub:"数据中心相关 CO₂（亿吨）。虚线=预测。来源：IEA / UNU-INWEH",
      xdom:[2024,2030],ydom:[0,4.5],xticks:[2024,2026,2028,2030],color:C.leaf,
      series:[{label:"≈4 亿吨",color:C.leaf,dash:true,pts:[[2024,1.8],[2027,2.8],[2030,4.0]]}]}); },
    fossil(el){ bignums(el,{title:"为供电，退役煤电厂被留下待命",sub:"来源：美国能源部 / 《The Unpaid Toll》(2024)",
      items:[{big:"5 座",cap:"被下令保留待命的原定退役燃煤电厂",c:C.energy},{big:"3,240 MW",cap:"这些电厂合计装机容量",c:C.energy},{big:"0.5%",cap:"宾州一座电厂实际负荷，几乎不发电"},{big:"居民电费",cap:"维持它待命的费用，由当地分摊"}]}); },
    taiwan(el){ donut(el,{title:"造芯片也在抢水",sub:"2021 台湾大旱：约 7.4 万公顷农田停灌，水优先供工厂。来源：Reuters (2021)",
      pct:0.1,label:"~10%",sub2:"半导体占全台用水",color:C.water}); },
    /* ⑤ 账单 */
    bills(el){ bignums(el,{title:"代价，落到具体的人身上",sub:"来源：PBS/AP (2026)、EIA、Grid Strategies (2025)",
      items:[{big:"$940",cap:"丽贝卡 2 月电费，超过当月全部收入"},{big:"$1,000",cap:"詹妮弗冬季月水电费，高于 $798 房贷"},{big:"+73%",cap:"西弗居民电价十年涨幅",c:C.energy},{big:"10 万户",cap:"一座 600MW 数据中心用电当量",c:C.water}]}); },
    priceline(el){ line(el,{title:"西弗吉尼亚电价，一路爬升",sub:"居民电价（美分/千瓦时）。来源：EIA",
      xdom:[2000,2020],ydom:[0,14],xticks:[2000,2008,2014,2020],
      series:[{label:"西弗",color:C.ember,pts:[[2000,6.27],[2008,7.06],[2014,9.34],[2020,11.8]]},{label:"全美",color:C.dim,pts:[[2000,8.24],[2008,11.26],[2014,12.52],[2020,13.15]]}]}); },
    loadshare(el){ const m=head(el,"未来五年新增电力，一半来自数据中心","美国五年负荷增长预测（吉瓦）。来源：Grid Strategies (2025)");
      const s=svg(m,"0 0 460 130");const x=D.scaleLinear().domain([0,166]).range([0,440]);
      s.append("rect").attr("x",0).attr("y",40).attr("width",x(90)).attr("height",40).attr("fill",C.energy);
      s.append("rect").attr("x",x(90)).attr("y",40).attr("width",x(76)).attr("height",40).attr("fill",C.grey);
      s.append("text").attr("x",x(45)).attr("y",64).attr("text-anchor","middle").attr("fill","#fff").attr("class","bar-label num").text("数据中心 90");
      s.append("text").attr("x",x(90)+x(38)).attr("y",64).attr("text-anchor","middle").attr("class","bar-label num").style("fill",C.text).text("其他 76");
      s.append("text").attr("x",0).attr("y",26).attr("class","bar-label").text("总新增 166 吉瓦"); },
    /* ⑥ 算不清 */
    slider(el){ el.innerHTML=`<div class="fig"><div class="fig__title">同一次查询，按口径算差一千倍</div><div class="fig__sub">拖动：把边界从"只算机房"扩到"算上发电"。来源：Altman / UC Riverside (2025)</div>
      <div class="slider-wrap"><div class="slider-readout"><span class="num" id="sl-num">0.32</span> 毫升</div>
      <div class="slider-note" id="sl-note">只算机房直接蒸发（企业口径）</div>
      <input type="range" id="sl-range" min="0" max="100" value="0"><div class="slider-ticks"><span>只算冷却</span><span>加上发电</span></div></div></div>`;
      const r=el.querySelector("#sl-range"),num=el.querySelector("#sl-num"),note=el.querySelector("#sl-note"),lo=Math.log(.32),hi=Math.log(519);
      r.addEventListener("input",()=>{const t=+r.value/100,v=Math.exp(lo+(hi-lo)*t);num.textContent=v<10?v.toFixed(2):Math.round(v);
        note.textContent=t<.5?"只算机房直接蒸发（企业口径）":"加上发电环节耗水（学术口径，UC Riverside）";num.style.color=t>.5?C.water:C.text;}); },
    three(el){ vbar(el,{title:'连"全球一年用多少电"都对不上',sub:"全球数据中心年用电的三个口径（太瓦时）。来源：IEA / UNU",
      data:[{n:"IEA 2024",v:415},{n:"UNU 2025",v:448},{n:"IEA 2025",v:485}],ymax:560,hlNames:["IEA 2024","UNU 2025","IEA 2025"],color:C.water}); },
    /* ⑦ 结尾 · 系统流向图（会动 + 闭环） */
    flow(el){
      const m=head(el,"这套系统：水电进来，污染出去，绕成一个圈","数据中心物质流向示意。来源：综合 UC Riverside / IEA / UNU / IPCC AR6");
      const s=svg(m,"0 0 760 480").attr("class","flowdiag");
      const defs=s.append("defs");
      defs.append("marker").attr("id","fah").attr("viewBox","0 0 10 10").attr("refX",8).attr("refY",5)
        .attr("markerWidth",7).attr("markerHeight",7).attr("orient","auto-start-reverse")
        .append("path").attr("d","M0,0 L10,5 L0,10 z").attr("fill",C.dim);
      const lg=defs.append("linearGradient").attr("id","ffog").attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",1);
      lg.append("stop").attr("offset","0").attr("stop-color","rgba(110,106,98,.6)");
      lg.append("stop").attr("offset","1").attr("stop-color","rgba(110,106,98,0)");
      const txt=(x,y,t,col,sz,anc,w)=>s.append("text").attr("x",x).attr("y",y).attr("text-anchor",anc||"start")
        .style("font-size",(sz||11)+"px").style("font-weight",w||400).style("fill",col||C.dim).text(t);

      // 顶部灰雾（碳累积）
      const fog=s.append("rect").attr("x",0).attr("y",0).attr("width",760).attr("height",72).attr("fill","url(#ffog)").attr("opacity",0);
      const fogT=txt(380,24,"二氧化碳累积成温室气体 · 推高气温",C.text,11,"middle",500).attr("opacity",0);

      // 左：取水口（水位会下降）+ 土地（会变黄）
      const land=s.append("rect").attr("x",18).attr("y",338).attr("width",206).attr("height",22).attr("rx",3).attr("fill",C.leaf).attr("opacity",.7);
      s.append("rect").attr("x",78).attr("y",244).attr("width",64).attr("height",94).attr("fill","none").attr("stroke",C.dim).attr("stroke-width",1.5).attr("opacity",.6);
      const riverW=s.append("rect").attr("x",80).attr("y",252).attr("width",60).attr("height",84).attr("fill",C.water).attr("opacity",.85);
      txt(110,232,"取水口",C.dim,11,"middle");
      txt(120,376,"河 / 地下水",C.dim,11,"middle");

      // 中：数据中心 + 芯片（脉冲）
      s.append("rect").attr("x",320).attr("y",200).attr("width",140).attr("height",120).attr("rx",8).attr("fill","rgba(38,52,60,.96)").attr("stroke","rgba(180,205,215,.25)").attr("stroke-width",1);
      txt(390,250,"数据中心","#fff",15,"middle",700);
      txt(390,272,"芯片烧电 · 水扛热","#cfc9bf",11,"middle");
      [[342,288],[372,288],[402,288],[432,288]].forEach(([cx,cy])=>{
        s.append("rect").attr("class","chip").attr("x",cx).attr("y",cy).attr("width",16).attr("height",14).attr("rx",2).attr("fill",C.energy);});

      // 右：电厂 + 烟囱
      s.append("rect").attr("x",600).attr("y",234).attr("width",120).attr("height",96).attr("rx",4).attr("fill","rgba(200,215,225,.05)").attr("stroke",C.dim).attr("stroke-width",1).attr("opacity",.8);
      s.append("rect").attr("x",624).attr("y",152).attr("width",26).attr("height",84).attr("fill","rgba(200,215,225,.12)");
      txt(660,352,"电厂(煤/气)",C.dim,11,"middle");

      // 管道（持续流动：粗管 + 流动虚线）
      const pipe=(d,col,w)=>s.append("path").attr("class","pipe flow").attr("d",d).attr("stroke",col).attr("stroke-width",w).attr("fill","none").attr("opacity",.85);
      pipe("M140,288 C 220,288 250,256 320,252",C.water,18);   // 水进
      pipe("M600,262 C 540,262 520,260 460,260",C.energy,18);  // 电进
      pipe("M386,200 C 430,150 500,112 582,94",C.water,24);    // 蒸发(粗)
      pipe("M404,320 C 470,348 520,360 590,366",C.ember,9);    // 废水(细)
      pipe("M637,152 C 637,116 637,94 637,74",C.leaf,11);      // CO₂

      // 标注
      txt(178,312,"多是饮用水 · 约 2/3 建在缺水区",C.water,11);
      txt(540,248,"≈448 太瓦时/年",C.energy,11,"end",700);
      txt(586,86,"蒸发 70–80%",C.water,12,"start",700);
      txt(586,102,"升空，多在别处降雨",C.dim,10.5);
      txt(596,360,"废水 20–30%",C.ember,12,"start",700);
      txt(596,376,"含盐 / 杀菌剂 / 缓蚀剂",C.dim,10.5);
      txt(660,138,"≈1.89 亿吨 CO₂/年 + NOx",C.leaf,11,"end",700);

      // 闭环箭头：灰雾 → 取水口（play 时淡入）
      const loop=s.append("path").attr("d","M210,56 C 96,82 80,168 112,240").attr("fill","none")
        .attr("stroke",C.dim).attr("stroke-width",2).attr("stroke-dasharray","6 6").attr("marker-end","url(#fah)").attr("opacity",0);
      const loopT1=txt(30,150,"气候变暖→干旱加重",C.dim,10.5,"start",500).attr("opacity",0);
      const loopT2=txt(30,166,"→下一座机房取水更紧",C.dim,10.5).attr("opacity",0);

      // 底部总括
      const cap=txt(380,466,"这套流动，每天约 25 亿次",C.text,15,"middle",900).attr("opacity",0);

      // play：进入视口且该 panel 被点亮时，依序点亮"后果"
      let played=false;
      const play=()=>{ if(played)return; played=true;
        fog.transition().duration(900).attr("opacity",1);
        fogT.transition().delay(300).duration(700).attr("opacity",1);
        riverW.transition().delay(700).duration(1200).attr("y",292).attr("height",44).attr("opacity",.55);
        land.transition().delay(700).duration(1200).attr("fill","#A98B3C").attr("opacity",.85);
        loop.transition().delay(1200).duration(900).attr("opacity",1);
        loopT1.transition().delay(1500).duration(600).attr("opacity",1);
        loopT2.transition().delay(1700).duration(600).attr("opacity",1);
        cap.transition().delay(2300).duration(700).attr("opacity",1);
      };
      const g=el.closest(".scrolly__graphic");
      if(g)g.addEventListener("chartchange",(e)=>{if(e.detail==="flow")play();});
      const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting&&el.classList.contains("is-on"))play();}),{threshold:.3});
      io.observe(s.node());
    },
    futurefan(el){ line(el,{title:"用电翻倍：未来取决于现在的选择",sub:"全球数据中心用电四情景（太瓦时）。来源：IEA (2025)",
      xdom:[2025,2035],ydom:[0,1800],xticks:[2025,2030,2035],color:C.energy,
      series:[{label:"更高 1720",color:C.ember,dash:true,pts:[[2025,448],[2030,1100],[2035,1720]]},{label:"基准 1200",color:C.energy,dash:true,pts:[[2025,448],[2030,945],[2035,1200]]},{label:"高效率 970",color:C.water,dash:true,pts:[[2025,448],[2030,800],[2035,970]]}]}); },
    jevons(el){ line(el,{title:"单次更省，总量却在飙升",sub:"单次能耗下降，但用量爆发，总量反升（指数化示意）。来源：IEA / MIT TR",
      xdom:[2022,2025],ydom:[0,100],xticks:[2022,2023,2024,2025],
      series:[{label:"总用电↑",color:C.ember,pts:[[2022,40],[2023,55],[2024,75],[2025,95]]},{label:"单次能耗↓",color:C.water,pts:[[2022,90],[2023,60],[2024,40],[2025,28]]}]}); },
  };

  function init(){ document.querySelectorAll(".panel[data-chart]").forEach((p)=>{const fn=reg[p.dataset.chart]; if(fn) try{fn(p);}catch(e){console.error("chart",p.dataset.chart,e);} }); }
  if(document.readyState!=="loading") init(); else document.addEventListener("DOMContentLoaded",init);
})();
