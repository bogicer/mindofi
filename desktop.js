document.addEventListener('DOMContentLoaded',()=>{
  const input=document.querySelector('.bottom input');
  const send=document.querySelector('.send');
  const chat=document.querySelector('.chat');
  if(input&&send&&chat){
    const sendMessage=()=>{const t=input.value.trim(); if(!t)return; const el=document.createElement('div'); el.className='msg right'; el.textContent=t; chat.appendChild(el); input.value=''; chat.scrollTop=chat.scrollHeight;};
    send.addEventListener('click',sendMessage); input.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});
  }
});
