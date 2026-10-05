'use strict';
(()=>{
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
const GAME_ID='game72',GAME_TITLE='フライングヒッポ';
const GAME_URL='https://afoolhippo.github.io/game72/';
const ARCADE_URL='https://afoolhippo.github.io/home/?skipTitle=1';
const kabaDb=window.supabase?window.supabase.createClient('https://gmncxnybsovlallxgnkd.supabase.co','sb_publishable_ly3h5OhL8HDSHhYdmJq_Fw_9pG3mhla'):null;
const resultButtons=$('resultButtons'),registerButton=$('registerButton');
let resultTimer=null,resultEpoch=0,lastScore=0,lastTitle='',scoreRegistered=false,registering=false;
function hideResultButtons(){clearTimeout(resultTimer);resultTimer=null;resultButtons.classList.add('hidden');resultButtons.inert=true;resultButtons.setAttribute('aria-hidden','true')}
function resetResult(){hideResultButtons();resultEpoch++;scoreRegistered=false;registering=false;registerButton.disabled=false;registerButton.textContent='記録を登録'}
function showResultButtonsLater(){hideResultButtons();const epoch=resultEpoch;resultTimer=setTimeout(()=>{if(state!=='result'||epoch!==resultEpoch)return;resultButtons.classList.remove('hidden');resultButtons.inert=false;resultButtons.setAttribute('aria-hidden','false');resultTimer=null},1500)}
function resultActionReady(){return state==='result'&&!resultButtons.classList.contains('hidden')}
function shareResult(){if(!resultActionReady())return;const text=`カバだって、空を飛べる🦛🪽\n${lastScore}m\n無料ブラウザゲーム「${GAME_TITLE}」\n${GAME_URL}\n#フライングヒッポ\n#カバゲーセン`;window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text),'_blank','noopener,noreferrer')}
async function registerResult(){
 if(!resultActionReady()||registering)return;
 if(scoreRegistered){alert('この記録は登録済みです');return}
 const input=prompt('ニックネームを入力してね','匿名カバ');if(input===null||!input.trim())return;
 const epoch=resultEpoch,score=lastScore;registering=true;registerButton.disabled=true;registerButton.textContent='登録中...';
 try{if(!kabaDb)throw new Error('記録登録サービスを読み込めませんでした');const {error}=await kabaDb.from('kaba_scores').insert({game_id:GAME_ID,game_title:GAME_TITLE,nickname:input.trim(),rank_title:lastTitle,score});if(error)throw error;if(epoch!==resultEpoch)return;scoreRegistered=true;registerButton.textContent='登録済み';alert('記録を登録しました！')}
 catch(error){console.error(error);if(epoch!==resultEpoch)return;registerButton.disabled=false;registerButton.textContent='記録を登録';alert('登録に失敗しました')}
 finally{if(epoch===resultEpoch)registering=false}
}
const W=360,H=576,INK='#4a230c';
const bgm=new Audio('bgm.mp3');bgm.loop=true;bgm.volume=.55;
let state='title',running=false,paused=false,y=H/2,vy=0,distance=0,lives=3,time=0,invincible=0,travel=0,obstacles=[],last=0,flash=0;
let sprites=[],assetReady=false;
function music(){bgm.play().catch(()=>{})}
function show(name){for(const n of ['title','play','result'])$(n).hidden=n!==name;state=name}
// Generated PNGs may contain an opaque black backdrop. Remove only near-black
// pixels on an in-memory copy; original image files remain unchanged.
async function loadSprite(src){const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const pixels=x.getImageData(0,0,c.width,c.height);let minX=c.width,minY=c.height,maxX=0,maxY=0;for(let i=0;i<pixels.data.length;i+=4){const d=pixels.data;if(d[i]<24&&d[i+1]<24&&d[i+2]<24)d[i+3]=0;if(d[i+3]>80){const p=i/4,px=p%c.width,py=Math.floor(p/c.width);minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py)}}x.putImageData(pixels,0,0);return {canvas:c,bounds:{minX,minY,maxX,maxY}}}
Promise.all(['hippo1.png','hippo2.png','hippo3.png'].map(loadSprite)).then(a=>{sprites=a;assetReady=true}).catch(()=>{console.warn('飛行画像を読み込めません。代替のカバを表示します。')});
function reset(){resetResult();show('play');running=false;paused=false;y=H/2;vy=0;distance=0;lives=3;time=0;invincible=0;travel=0;obstacles=[];flash=0;last=0;$('hint').hidden=false;updateHud();bgm.pause();bgm.currentTime=0;draw()}
function flap(){if(state!=='play'||paused)return;if(!running){running=true;$('hint').hidden=true;music()}vy=-205}
function updateHud(){$('distance').textContent=`${Math.floor(distance)} m`;$('lives').textContent='♥'.repeat(lives)+'♡'.repeat(3-lives);$('lives').setAttribute('aria-label',`残りライフ${lives}`)}
function finish(){running=false;bgm.pause();const score=Math.floor(distance);resetResult();lastScore=score;const rank=getRank(score);lastTitle=rank.title;show('result');$('rank-stars').textContent=rank.stars;$('rank-stars').setAttribute('aria-label',`ランク${rank.level} / 3`);$('rank-title').textContent=rank.title;$('final-distance').textContent=`${score} m`;$('comment').textContent=score<100?'小さな羽で、また飛び立とう！':score<300?'空のおさんぽ、いい感じ！':score<600?'ずいぶん遠くまで飛んできたね！':'空の旅は、まだまだ続く！';showResultButtonsLater();}
function getRank(score){return score<500?{level:1,stars:'★☆☆',title:'ひよっこヒッポ'}:score<1200?{level:2,stars:'★★☆',title:'はばたきヒッポ'}:{level:3,stars:'★★★',title:'そらたかくヒッポ'}}
// Continuous difficulty ramp; keep a traversable gap even on long flights.
function difficulty(m){const t=1-Math.exp(-Math.max(0,m-300)/850);return {speed:90+125*t,gap:198-86*t,shift:80+65*t,spacing:235-30*t}}
function spawn(){const d=difficulty(distance),prev=obstacles.at(-1)?.center??H/2;const center=Math.max(115,Math.min(H-115,prev+(Math.random()*2-1)*d.shift));obstacles.push({x:W+45,center,gap:d.gap,hit:false})}
function tick(dt){time+=dt;invincible=Math.max(0,invincible-dt);flash=Math.max(0,flash-dt);const speed=difficulty(distance).speed;const dx=speed*dt;travel+=dx;distance+=dx/10;vy=Math.min(270,vy+510*dt);y+=vy*dt;if(y<42){y=42;vy=Math.max(0,vy)}if(y>H-56){y=H-56;vy=Math.min(0,vy)}if(!obstacles.length||obstacles.at(-1).x<W+45-difficulty(distance).spacing)spawn();for(const o of obstacles){o.x-=dx;const horizontal=100+27>o.x&&100-27<o.x+44;const vertical=y-19<o.center-o.gap/2||y+19>o.center+o.gap/2;if(horizontal&&vertical&&!o.hit&&invincible<=0){o.hit=true;lives--;invincible=1.5;flash=.18;if(lives<=0){updateHud();finish();return}}}obstacles=obstacles.filter(o=>o.x>-60);updateHud()}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function cloud(x,y,s){rect(x,y,48*s,12*s,'#fffbe0');rect(x+8*s,y-9*s,29*s,12*s,'#fffbe0');rect(x+17*s,y-16*s,13*s,12*s,'#fffbe0')}
function trunk(x,top,bottom){const h=bottom-top;if(h<=0)return;rect(x,top,44,h,INK);rect(x+4,top+4,36,Math.max(0,h-8),'#936332');rect(x+9,top+4,7,Math.max(0,h-8),'#b47d43');for(let yy=top+18;yy<bottom-6;yy+=25)rect(x+27,yy,8,4,'#67411f');rect(x-3,top,50,7,INK);rect(x+1,top+3,42,4,'#a4d55b');rect(x-3,bottom-7,50,7,INK);rect(x+1,bottom-7,42,4,'#a4d55b')}
function hippo(){if(invincible>0&&Math.floor(time*12)%2===0)return;ctx.save();ctx.translate(100,y);ctx.rotate(Math.max(-.24,Math.min(.45,vy/650)));ctx.imageSmoothingEnabled=false;if(assetReady){const frame=[0,1,2,1][Math.floor(time/.12)%4],s=sprites[frame];const b=sprites[0].bounds;const width=b.maxX-b.minX+1,height=b.maxY-b.minY+1;ctx.drawImage(s.canvas,b.minX,b.minY,width,height,-39,-height/width*39,78,height/width*78)}else{rect(-26,-15,40,30,INK);rect(-23,-12,34,24,'#87bbea');rect(2,-11,33,25,INK);rect(5,-8,27,19,'#87bbea');rect(-18,-10,21,22,'#80bf55');rect(-19,-25,12,15,'#fffbe0');rect(11,-7,4,5,INK)}ctx.restore()}
function draw(){rect(0,0,W,H,'#60cdf2');for(let i=0;i<5;i++){let x=((i*99-travel*.18)%(W+100)+W+100)%(W+100)-65;cloud(x,80+(i%3)*118,1+(i%2)*.3)}for(let i=0;i<12;i++){let x=((i*40-travel*.3)%480+480)%480-40;rect(x,H-48-(i%3)*8,42,70,'#43a585');rect(x,H-20,42,22,'#96d750')}for(const o of obstacles){trunk(o.x,-8,o.center-o.gap/2);trunk(o.x,o.center+o.gap/2,H-20)}rect(0,H-20,W,20,'#90ce4b');rect(0,H-20,W,4,'#4c923c');hippo();if(flash>0){ctx.fillStyle='#ff779344';ctx.fillRect(0,0,W,H)}}
function loop(stamp){const dt=last?Math.min(.035,(stamp-last)/1000):0;last=stamp;if(state==='play'&&!paused){if(running)tick(dt);if(state==='play')draw()}requestAnimationFrame(loop)}
function backToTitle(){resetResult();running=false;paused=false;last=0;bgm.pause();bgm.currentTime=0;show('title');}
$('start').onclick=reset;$('retry').onclick=()=>{if(resultActionReady())backToTitle()};$('shareButton').onclick=shareResult;registerButton.onclick=registerResult;$('arcadeButton').onclick=()=>{if(resultActionReady())window.location.href=ARCADE_URL};$('back-title').onclick=backToTitle;
canvas.addEventListener('pointerdown',e=>{e.preventDefault();flap()});document.addEventListener('keydown',e=>{if(['Space','ArrowUp'].includes(e.code)&&state==='play'&&!paused&&!e.repeat){e.preventDefault();flap()}if(e.code==='Escape'&&state==='play')backToTitle()});document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;bgm.pause()}else{paused=false;last=0;if(state==='play'&&running)music()}});window.addEventListener('pagehide',()=>bgm.pause());requestAnimationFrame(loop);
})();
