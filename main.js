class s{constructor(t){this.status="idle",this.element=t.element,this.duration=t.duration,this.remaining=t.duration}start(){this.status!=="running"&&(this.status="running",this.interval=window.setInterval(()=>{this.remaining-=1e3,this.updateDisplay(),this.remaining<=0&&this.stop()},1e3))}stop(){this.interval&&clearInterval(this.interval),this.status="ended"}updateDisplay(){const t=Math.floor(this.remaining/6e4),n=Math.floor(this.remaining%6e4/1e3);this.element.textContent=`${t}:${n.toString().padStart(2,"0")}`}}document.addEventListener("DOMContentLoaded",()=>{const e=document.createElement("div");e.className="fixed top-4 right-4 bg-white p-4 rounded shadow",e.innerHTML=`
        <h3 class="text-lg font-bold mb-2">Timer de Teste (TypeScript)</h3>
        <div id="test-timer" class="text-2xl mb-2">5:00</div>
        <button id="test-start" class="bg-blue-500 text-white px-4 py-2 rounded">
            Iniciar Teste
        </button>
    `,document.body.appendChild(e);const t=document.getElementById("test-timer"),n=document.getElementById("test-start"),i=new s({duration:5*60*1e3,element:t});n.addEventListener("click",()=>i.start())});
