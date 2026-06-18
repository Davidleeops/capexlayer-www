(function(){
  const cities=[
    {n:"Portland",lat:45.52,lon:-122.68,a:1},{n:"Dallas",lat:32.78,lon:-96.8,a:.94},
    {n:"Chicago",lat:41.88,lon:-87.63,a:.88},{n:"Toronto",lat:43.65,lon:-79.38,a:.76},
    {n:"Mexico City",lat:19.43,lon:-99.13,a:.82},{n:"Sao Paulo",lat:-23.55,lon:-46.63,a:.8},
    {n:"Bogota",lat:4.71,lon:-74.07,a:.68},{n:"Santiago",lat:-33.45,lon:-70.66,a:.58},
    {n:"Lima",lat:-12.05,lon:-77.04,a:.62},{n:"Buenos Aires",lat:-34.6,lon:-58.38,a:.56},
    {n:"London",lat:51.5,lon:-.12,a:.68},{n:"Amsterdam",lat:52.37,lon:4.9,a:.56},
    {n:"Dubai",lat:25.2,lon:55.27,a:.52},{n:"Singapore",lat:1.35,lon:103.82,a:.5},
    {n:"Sydney",lat:-33.86,lon:151.2,a:.58},{n:"Auckland",lat:-36.85,lon:174.76,a:.5}
  ];
  function css(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim();}
  function mount(canvas){
    const ctx=canvas.getContext("2d");
    let w=0,h=0,dpr=1,t0=performance.now();
    const routes=[
      [0,1],[1,3],[3,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,8],[8,5],[5,7],[7,9],[9,4],[4,2],[2,0]
    ];
    const arcs=routes.slice(0,9).map((r,i)=>({a:r[0],b:r[1],born:-i*.32,life:3.4}));
    function resize(){
      const r=canvas.getBoundingClientRect();
      dpr=Math.min(window.devicePixelRatio||1,2);
      w=r.width;h=r.height;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function project(p,rot){
      const lat=p.lat*Math.PI/180,lon=(p.lon+rot)*Math.PI/180;
      const x=Math.cos(lat)*Math.sin(lon),y=Math.sin(lat),z=Math.cos(lat)*Math.cos(lon);
      const r=Math.min(w,h)*.36, cx=w*.5, cy=h*.5;
      return {x:cx+x*r,y:cy-y*r,z:z,a:p.a||.35,n:p.n};
    }
    function draw(now){
      const gold=css("--gold"),gold2=css("--gold-2"),hair=css("--hair"),body=css("--text-body"),panel=css("--panel");
      const dt=(now-t0)/1000,rot=-82+dt*7;
      ctx.clearRect(0,0,w,h);
      const r=Math.min(w,h)*.36,cx=w*.5,cy=h*.5;
      const grad=ctx.createRadialGradient(cx-r*.25,cy-r*.35,r*.1,cx,cy,r);
      grad.addColorStop(0,gold2);grad.addColorStop(.1,gold);grad.addColorStop(.48,panel);grad.addColorStop(1,css("--bg-nearblack"));
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=grad;ctx.globalAlpha=.34;ctx.fill();ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(cx,cy,r+1,0,Math.PI*2);ctx.strokeStyle=gold;ctx.globalAlpha=.52;ctx.lineWidth=1.5;ctx.stroke();
      ctx.strokeStyle=gold;ctx.lineWidth=1.25;ctx.globalAlpha=.34;
      for(let i=-60;i<=60;i+=20){ctx.beginPath();ctx.ellipse(cx,cy,r*Math.cos(i*Math.PI/180),r,0,0,Math.PI*2);ctx.stroke();}
      ctx.strokeStyle=hair;ctx.globalAlpha=1;ctx.lineWidth=1.2;
      for(let i=0;i<180;i+=18){ctx.beginPath();ctx.ellipse(cx,cy,r,r*.24,i*Math.PI/180,0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=1;
      while(arcs.length<12){
        const route=routes[(Math.floor((dt+arcs.length)*2))%routes.length];
        arcs.push({a:route[0],b:route[1],born:dt-Math.random()*1.2,life:3.4});
      }
      if(Math.random()<.16){
        const visibleRoutes=routes.filter(r=>project(cities[r[0]],rot).z>-.55||project(cities[r[1]],rot).z>-.55);
        const route=visibleRoutes[Math.floor(Math.random()*visibleRoutes.length)]||routes[0];
        arcs.push({a:route[0],b:route[1],born:dt,life:3.4});
      }
      for(let i=arcs.length-1;i>=0;i--){
        const ar=arcs[i],age=dt-ar.born;if(age>ar.life){arcs.splice(i,1);continue;}
        const A=project(cities[ar.a],rot),B=project(cities[ar.b],rot);if(A.z<-.7&&B.z<-.7)continue;
        const mx=(A.x+B.x)/2,my=(A.y+B.y)/2-r*.24;
        const facing=Math.max(.22,((A.z+B.z)/2+1)/2);
        ctx.globalAlpha=Math.sin((age/ar.life)*Math.PI)*facing;
        ctx.strokeStyle=gold;ctx.lineWidth=1.9+1.9*facing;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.quadraticCurveTo(mx,my,B.x,B.y);ctx.stroke();
        const q=age/ar.life, x=(1-q)*(1-q)*A.x+2*(1-q)*q*mx+q*q*B.x, y=(1-q)*(1-q)*A.y+2*(1-q)*q*my+q*q*B.y;
        ctx.fillStyle=gold2;ctx.beginPath();ctx.arc(x,y,3.2+2*facing,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
      cities.forEach(c=>{
        const p=project(c,rot);if(p.z<-.45)return;
        const a=Math.max(.12,(p.z+1)/2*c.a);
        ctx.globalAlpha=a;ctx.fillStyle=gold;ctx.beginPath();ctx.arc(p.x,p.y,3+c.a*2,0,Math.PI*2);ctx.fill();
        if(c.a>.55&&p.z>.2){ctx.fillStyle=body;ctx.font="10px "+css("--font-mono");ctx.fillText(c.n,p.x+8,p.y+3);}
        ctx.globalAlpha=1;
      });
      requestAnimationFrame(draw);
    }
    resize();window.addEventListener("resize",resize);requestAnimationFrame(draw);
  }
  document.querySelectorAll("canvas[data-cx-globe]").forEach(mount);
})();
