const input=document.querySelector('#resource-search');
const cards=Array.from(document.querySelectorAll('.resource'));
const filters=Array.from(document.querySelectorAll('[data-filter]'));
let category='all';
function update(){
 const query=input.value.trim().toLocaleLowerCase();
 let visible=0;
 for(const card of cards){
  const show=(category==='all'||card.dataset.category===category)&&card.dataset.search.includes(query);
  card.hidden=!show;if(show)visible++;
 }
 document.querySelector('#result-count').textContent=visible+' resource'+(visible===1?'':'s');
 document.querySelector('#empty-state').hidden=visible!==0;
 for(const button of filters)button.setAttribute('aria-pressed',String(button.dataset.filter===category));
}
input.addEventListener('input',update);
for(const button of filters)button.addEventListener('click',()=>{category=button.dataset.filter;update();});
document.querySelector('#clear-filters').addEventListener('click',()=>{input.value='';category='all';update();input.focus();});
update();
