import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';

// A temporary, pointer-transparent top-layer canvas stays above native dialogs.
// It celebrates the acknowledged submission, then removes itself completely.
export function PartyBurst() {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current;
    if(!canvas||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const context=canvas.getContext('2d');if(!context)return;
    const width=innerWidth,height=innerHeight,ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=width*ratio;canvas.height=height*ratio;context.scale(ratio,ratio);
    const colors=['#12386b','#315c93','#91b2dc','#d5e3f4','#e7b953','#f3d987','#72bea6'];
    const particles=Array.from({length:150},(_,i)=>{
      const side=i%2===0?1:-1,angle=(26+(i*29%46))*Math.PI/180,speed=650+i*47%550;
      return {x:side===1?width*.12:width*.88,y:height*.8,
        vx:Math.cos(angle)*speed*side,vy:-Math.sin(angle)*speed,
        rotation:i*.8,spin:(i%2?1:-1)*(3+i%7),size:5+i%6,color:colors[i%colors.length],delay:(i%12)*.013};
    });
    let frame,start=null,active=true;
    const finish=()=>{canvas.hidden=true;if(canvas.matches(':popover-open'))canvas.hidePopover();};
    function draw(now) {
      if(!active)return;
      // Open after the parent dialog's effect so the burst is last in the top layer.
      if(start===null){start=now;if(canvas.showPopover)canvas.showPopover();}
      const elapsed=(now-start)/1000;
      context.clearRect(0,0,width,height);
      for(const p of particles){
        const t=elapsed-p.delay;if(t<0)continue;
        const drag=(1-Math.exp(-1.5*t))/1.5;
        const x=p.x+p.vx*drag,y=p.y+p.vy*drag+270*t*t;
        context.save();context.globalAlpha=Math.max(0,Math.min(1,(3.2-t)/.65));context.fillStyle=p.color;
        context.translate(x,y);context.rotate(p.rotation+p.spin*t);context.scale(1,Math.cos(p.rotation+t*8)*.65+.35);
        if(p.size%3===0){context.beginPath();context.arc(0,0,p.size*.45,0,Math.PI*2);context.fill();}
        else context.fillRect(-p.size/2,-p.size/3,p.size,p.size*.65);
        context.restore();
      }
      if(elapsed<3.5)frame=requestAnimationFrame(draw);else finish();
    }
    frame=requestAnimationFrame(draw);
    return()=>{active=false;cancelAnimationFrame(frame);if(canvas.matches(':popover-open'))canvas.hidePopover();};
  },[]);
  return createPortal(<canvas ref={ref} popover="manual" className="party-burst" aria-hidden="true"/>,document.body);
}
