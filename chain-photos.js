(()=>{
'use strict';
const BUILD='20260724-photo1';
const DATA_URL=`chain-images.json?v=${BUILD}`;
let photos={};
const decorated=new WeakSet();
async function loadPhotos(){
 const response=await fetch(DATA_URL,{cache:'no-store'});
 if(!response.ok)throw new Error(`写真データを取得できません（${response.status}）`);
 return response.json();
}
function brandOf(card){
 const brand=card.querySelector('.chain-brand,.chain-store-top .chain-chip,.chain-compare-card>.chain-chip');
 return brand?.textContent?.trim()||'';
}
function mediaFor(brand,photo){
 const figure=document.createElement('figure');figure.className='chain-photo';
 const fallback=document.createElement('div');fallback.className='chain-photo-fallback';fallback.textContent=photo.emoji||'📷';fallback.setAttribute('aria-hidden','true');
 const img=document.createElement('img');img.src=photo.url;img.alt=photo.alt||`${brand}のイメージ写真`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.style.objectPosition=photo.position||'center';
 const label=document.createElement('span');label.className='chain-photo-label';label.textContent='イメージ写真';
 const caption=document.createElement('figcaption');caption.className='chain-photo-credit';
 const source=document.createElement('a');source.href=photo.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';source.textContent=`写真: ${photo.credit} / ${photo.license}`;
 caption.append(source);
 img.addEventListener('load',()=>figure.dataset.loaded='true',{once:true});
 img.addEventListener('error',()=>{img.remove();figure.dataset.failed='true'},{once:true});
 figure.append(fallback,img,label,caption);return figure;
}
function decorate(card){
 if(decorated.has(card))return;
 const brand=brandOf(card),photo=photos[brand];if(!photo)return;
 const media=mediaFor(brand,photo);
 if(card.classList.contains('chain-offer-card'))card.prepend(media);
 else if(card.classList.contains('chain-store-card'))card.prepend(media);
 else if(card.classList.contains('chain-compare-card'))card.prepend(media);
 else return;
 decorated.add(card);
}
function scan(root=document){
 root.querySelectorAll?.('.chain-offer-card,.chain-store-card,.chain-compare-card').forEach(decorate);
}
async function init(){
 try{photos=await loadPhotos()}catch(error){console.warn('チェーン写真の読み込みに失敗',error);return}
 scan();
 const target=document.querySelector('#chain-discovery')||document.body;
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches?.('.chain-offer-card,.chain-store-card,.chain-compare-card'))decorate(node);scan(node)}}).observe(target,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
