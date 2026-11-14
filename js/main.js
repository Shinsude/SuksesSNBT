document.addEventListener("DOMContentLoaded", () => {
  const header=document.getElementById("header");
  const navToggle=document.getElementById("navToggle");
  const nav=document.getElementById("nav");
  if(navToggle&&nav){
    nav.setAttribute("aria-label",nav.getAttribute("aria-label")||"Navigasi utama");
    navToggle.setAttribute("aria-controls",nav.id||"nav");
    const setMenu=(open)=>{nav.classList.toggle("nav--open",open);navToggle.setAttribute("aria-expanded",String(open));navToggle.setAttribute("aria-label",open?"Tutup menu":"Buka menu");};
    navToggle.addEventListener("click",()=>setMenu(!nav.classList.contains("nav--open")));
    nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>setMenu(false)));
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&nav.classList.contains("nav--open")){setMenu(false);navToggle.focus();}});
  }
  const mainContent=document.querySelector("main");
  if(mainContent&&!mainContent.id)mainContent.id="main-content";
  if(!document.querySelector(".skip-link")&&mainContent){const link=document.createElement("a");link.className="skip-link";link.href=`#${mainContent.id}`;link.textContent="Lewati ke konten utama";document.body.prepend(link);}
  const onScroll=()=>{if(header)header.classList.toggle("header--scrolled",window.scrollY>10);};
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();
  if("serviceWorker"in navigator&&window.location.protocol==="https:"){navigator.serviceWorker.register("/service-worker.js",{scope:"/"}).catch(()=>{});}
  const installButton=document.getElementById("install-app");
  if(installButton){
    let deferredInstallPrompt=null;
    window.addEventListener("beforeinstallprompt",event=>{
      event.preventDefault();
      deferredInstallPrompt=event;
      installButton.hidden=false;
    });
    installButton.addEventListener("click",async()=>{
      if(!deferredInstallPrompt)return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt=null;
      installButton.hidden=true;
    });
    window.addEventListener("appinstalled",()=>{
      deferredInstallPrompt=null;
      installButton.hidden=true;
    });
  }
  const targets=document.querySelectorAll(".card-subtes,.feature,.section__head");
  if("IntersectionObserver"in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}}),{threshold:.12});targets.forEach(el=>{el.classList.add("reveal");observer.observe(el);});}
  else targets.forEach(el=>el.classList.add("is-visible"));
});