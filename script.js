const header=document.getElementById('header');
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',window.scrollY>30));

const burger=document.getElementById('burger'), mobile=document.getElementById('mobileNav');
burger.addEventListener('click',()=>mobile.style.display=mobile.style.display==='block'?'none':'block');
document.querySelectorAll('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>mobile.style.display='none'));

const cats=document.querySelectorAll('.cat'), cards=document.querySelectorAll('.food-card');
cats.forEach(cat=>cat.addEventListener('click',()=>{
  cats.forEach(x=>x.classList.remove('active')); cat.classList.add('active');
  const value=cat.dataset.cat;
  cards.forEach(card=>card.style.display=value==='all'||card.dataset.cat===value?'block':'none');
}));

const fullMenu=[
['Стартеры','Наггетсы','120 г',250,310,'17/19/18'],['Стартеры','Сырные палочки','порция',310,380,'16/24/25'],['Стартеры','Крылышки острые','3 шт.',210,330,'24/24/4'],['Стартеры','Крылышки острые','6 шт.',370,660,'48/48/8'],['Стартеры','Комбо','250 г',310,650,'23/35/62'],['Стартеры','Картофель фри','120 г',250,370,'4/18/49'],['Стартеры','Картофель по-деревенски','120 г',270,300,'4/14/38'],
['Гиро','Гиро в булочке — большое','520 г',420,1050,'45/55/95'],['Гиро','Гиро в булочке — маленькое','335 г',380,720,'30/38/62'],['Гиро','Гиро в пите','435 г',420,900,'38/45/85'],['Гиро','Гиро на тарелке','640 г',500,1250,'55/65/110'],
['Салаты','Цезарь с сёмгой','300 г',450,520,'25/34/27'],['Салаты','Цезарь с курицей','300 г',430,480,'31/27/25'],['Салаты','Греческий','400 г',410,430,'12/33/25'],
['Бургеры','Бургер с курицей','330 г',370,780,'35/42/68'],
['Сэндвич','Клаб с сёмгой','600 г',530,1150,'40/62/105'],['Сэндвич','Клаб с курицей','600 г',450,1200,'45/65/110'],
['Шаурма','Шаурма большая','380 г',420,850,'35/42/82'],['Шаурма','Шаурма маленькая','285 г',380,650,'27/32/59'],['Шаурма','Цезарь ролл','300 г',320,620,'24/29/57'],
['Напитки','Чай фирменный','350 мл',220,80,'0/0/20'],['Напитки','Фраппе','450 мл',200,280,'6/9/43']
];
const modal=document.getElementById('fullMenuModal');
document.getElementById('openFullMenu').onclick=()=>{
 document.getElementById('fullMenuContent').innerHTML=fullMenu.map(x=>`<div class="full-row"><div><h4>${x[1]}</h4><p>${x[0]} ${x[2]} · ≈ ${x[4]} ккал · Б/Ж/У ${x[5]} г</p></div><strong>${x[3]} ₽</strong></div>`).join('');
 modal.classList.add('open');
};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('.modal').classList.remove('open'));

const reviewModal=document.getElementById('reviewModal');
const reviewForm=document.getElementById('reviewForm');
const reviewList=document.querySelector('.review-list');
const reviewStatus=document.getElementById('formResult');
const reviewOpen=document.getElementById('reviewOpen');
const reviewListContainer=document.createElement('div');
reviewListContainer.id='reviewList';
reviewListContainer.className='review-list-data';
reviewList.insertBefore(reviewListContainer,reviewList.querySelector('.review-card'));
const reviewAdminButton=document.createElement('button');
reviewAdminButton.className='btn dark-btn';
reviewAdminButton.type='button';
reviewAdminButton.textContent='Админка отзывов';
reviewAdminButton.id='adminReviewsOpen';
reviewList.appendChild(reviewAdminButton);

const reviewConfig={
  url:'https://sassiymiyhybbbmucqdo.supabase.co',
  anonKey:'sb_publishable_k23BHyYcC8j_hPs44FDMoA_eVCfPqOX',
  adminEmails:['nera7am@gmail.com']
};

let supabaseClient=null;
let currentUser=null;
let isAdmin=false;
let reviewsPage=0;
const reviewsPerPage=10;

const setReviewStatus=(message,type='info')=>{
  if(!reviewStatus)return;
  reviewStatus.textContent=message;
  reviewStatus.style.color=type==='error'?'#b00000':'#1f7a45';
};

const openModal=modal=>{
  if(!modal)return;
  modal.classList.add('open');
  document.body.style.overflow='hidden';
};
const closeModal=modal=>{
  if(!modal)return;
  modal.classList.remove('open');
  document.body.style.overflow='';
};

const createReviewCard=review=>{
  const card=document.createElement('article');
  card.className='review-card reveal visible';
  card.innerHTML=`
    <span>${'★'.repeat(Math.max(0,Math.min(5,Number(review.rating)||0)))}${'☆'.repeat(Math.max(0,5-Math.min(5,Number(review.rating)||0)))}</span>
    <p>«${escapeHtml(review.text)}»</p>
    <b>${escapeHtml(review.name)} · ${formatDate(review.created_at)}</b>
  `;
  return card;
};

const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
}[char]));
const formatDate=value=>{
  if(!value)return'недавно';
  return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));
};

const renderReviews=reviews=>{
  reviewListContainer.innerHTML='';
  if(!reviews.length){
    reviewListContainer.innerHTML='<p class="review-empty">Отзывы пока не опубликованы.</p>';
    return;
  }
  reviews.forEach(review=>reviewListContainer.appendChild(createReviewCard(review)));
};

const loadPublishedReviews=async()=>{
  if(!supabaseClient)return;
  try{
    const {data,error}=await supabaseClient.from('reviews').select('id,name,rating,text,created_at,status').eq('status','published').order('created_at',{ascending:false});
    if(error)throw error;
    renderReviews(data||[]);
  }catch(error){
    console.error('Ошибка загрузки отзывов:',error);
    renderReviews([]);
  }
};

const createAdminPanel=()=>{
  const panel=document.createElement('div');
  panel.className='admin-review-panel';
  panel.id='adminReviewPanel';
  panel.innerHTML=`
    <div class="admin-review-panel__box">
      <button class="close admin-close" type="button" aria-label="Закрыть">×</button>
      <h2>Админка отзывов</h2>
      <div class="admin-login" id="adminLoginBox">
        <h3>Войти как администратор</h3>
        <form id="adminLoginForm">
          <input id="adminEmail" type="email" required autocomplete="email" placeholder="Email админстратора">
          <input id="adminPassword" type="password" required autocomplete="current-password" placeholder="Пароль">
          <button class="btn red-btn" type="submit">Войти</button>
          <p id="adminLoginMessage" class="admin-message"></p>
        </form>
      </div>
      <div class="admin-content" id="adminContent" hidden>
        <p id="adminUserLabel"></p>
        <button class="btn dark-btn" id="adminSignOut" type="button">Выйти</button>
        <div id="adminReviewList"></div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
};

const adminPanel=createAdminPanel();
const adminLoginForm=document.getElementById('adminLoginForm');
const adminLoginBox=document.getElementById('adminLoginBox');
const adminContent=document.getElementById('adminContent');
const adminReviewList=document.getElementById('adminReviewList');
const adminUserLabel=document.getElementById('adminUserLabel');
const adminLoginMessage=document.getElementById('adminLoginMessage');

const showAdminMessage=(message)=>{adminLoginMessage.textContent=message;};
reviewAdminButton.onclick=()=>openModal(adminPanel);
adminPanel.querySelector('.admin-close').onclick=()=>closeModal(adminPanel);
adminPanel.addEventListener('click',event=>{if(event.target===adminPanel)closeModal(adminPanel);});

adminLoginForm.onsubmit=async event=>{
  event.preventDefault();
  if(!supabaseClient){
    showAdminMessage('Supabase ещё не подключён.');
    return;
  }
  const email=document.getElementById('adminEmail').value.trim().toLowerCase();
  const password=document.getElementById('adminPassword').value;
  if(!reviewConfig.adminEmails.includes(email)){
    showAdminMessage('Доступ запрещён. Этот email не является администратором.');
    return;
  }
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){
    showAdminMessage(error.message);
    return;
  }
  showAdminMessage('');
};

document.getElementById('adminSignOut').onclick=async()=>{
  if(supabaseClient)await supabaseClient.auth.signOut();
  await setAdminSession(null);
};

const renderAdminReviews=async()=>{
  if(!supabaseClient||!isAdmin)return;
  try{
    const {data,error}=await supabaseClient.from('reviews').select('id,name,rating,text,created_at,status').order('created_at',{ascending:false});
    if(error)throw error;
    adminReviewList.innerHTML='';
    if(!data.length){adminReviewList.innerHTML='<p>Отзывы не найдены.</p>';return;}
    data.forEach(review=>{
      const item=document.createElement('article');
      item.className='admin-review-item';
      item.innerHTML=`<div><strong>${escapeHtml(review.name)}</strong><span>${escapeHtml(review.text)}</span><small>${formatDate(review.created_at)} · ${review.status}</small></div>`;
      const actions=document.createElement('div');
      actions.innerHTML=`<button data-review-id="${review.id}" data-status="published">Опубликовать</button><button data-review-id="${review.id}" data-status="rejected">Отказать</button><button data-review-id="${review.id}" data-status="pending">Отправить на модерацию</button>`;
      item.appendChild(actions);
      adminReviewList.appendChild(item);
    });
    adminReviewList.querySelectorAll('button').forEach(button=>button.addEventListener('click',async()=>{
      const id=button.dataset.reviewId;
      const status=button.dataset.status;
      const {error}=await supabaseClient.from('reviews').update({status}).eq('id',id);
      if(error){showAdminMessage(error.message);return;}
      renderAdminReviews();
    }));
  }catch(error){showAdminMessage(error.message);}
};

const setAdminSession=async user=>{
  currentUser=user;
  isAdmin=Boolean(user&&reviewConfig.adminEmails.includes((user.email||'').toLowerCase()));
  adminLoginBox.hidden=isAdmin;
  adminContent.hidden=!isAdmin;
  if(isAdmin){
    adminUserLabel.textContent=`${user.email} · администратор`;
    await renderAdminReviews();
  }else if(user){
    adminLoginBox.hidden=false;
    adminContent.hidden=true;
    showAdminMessage('Доступ запрещён. Email не включён в список администраторов.');
  }
};

const initSupabase=async()=>{
  if(!reviewConfig.url||!reviewConfig.anonKey){
    setReviewStatus('Не настроено: заполните URL и anonKey в reviewConfig.', 'error');
    return;
  }
  const supabaseModule=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const createClient=supabaseModule.createClient||supabaseModule.default?.createClient||supabaseModule.default;
  if(typeof createClient!=='function'){
    throw new Error('Supabase SDK не экспортировал createClient');
  }
  supabaseClient=createClient(reviewConfig.url,reviewConfig.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});
  supabaseClient.auth.onAuthStateChange((_event,session)=>setAdminSession(session?.user||null));
  const {data:{session}}=await supabaseClient.auth.getSession();
  await setAdminSession(session?.user||null);
  await loadPublishedReviews();
};

reviewOpen.onclick=()=>openModal(reviewModal);

const reviewNameInput=reviewForm.querySelector('input[placeholder="Ваше имя"]');
const reviewRatingSelect=reviewForm.querySelector('select');
const reviewTextInput=reviewForm.querySelector('textarea[placeholder="Ваш отзыв или предложение"]');
reviewNameInput.name='name';
reviewRatingSelect.name='rating';
reviewTextInput.name='text';
reviewRatingSelect.querySelectorAll('option').forEach((option,index)=>{
  option.value=String(5-index);
});

reviewForm.onsubmit=async event=>{
  event.preventDefault();
  if(!supabaseClient){
    setReviewStatus('Supabase ещё не подключён. Повторите попытку через несколько секунд.', 'error');
    return;
  }
  const name=reviewNameInput.value.trim();
  const rating=Number(reviewRatingSelect.value);
  const text=reviewTextInput.value.trim();
  if(!name||!text||!Number.isInteger(rating)){ 
    setReviewStatus('Заполните имя, рейтинг и отзыв.', 'error');
    return;
  }
  const button=reviewForm.querySelector('button[type="submit"]');
  if(!button){
    throw new Error('Кнопка отправки формы не найдена');
  }
  button.disabled=true;
  button.textContent='Отправляется…';
  try{
    const {error}=await supabaseClient.from('reviews').insert({
      name,
      rating,
      text,
      status:'pending',
      user_id:currentUser?.id||null
    });
    if(error)throw error;
    setReviewStatus('Спасибо! Отзыв отправлен на модерацию.');
    reviewForm.reset();
  }catch(error){
    console.error('Ошибка сохранения отзыва:',error);
    setReviewStatus(error.message||'Не удалось сохранить отзыв.', 'error');
  }finally{
    button.disabled=false;
    button.textContent='Отправить';
  }
};

const lightbox=document.getElementById('lightbox');
const lbImg=document.getElementById('lightboxImg');
document.querySelectorAll('.poster').forEach(img=>{
  img.onclick=()=>{
    lbImg.src=img.src;
    lightbox.classList.add('open');
  };
});
lightbox.querySelector('.close').onclick=()=>lightbox.classList.remove('open');
lightbox.onclick=e=>{if(e.target===lightbox)lightbox.classList.remove('open');};

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

initSupabase().catch(error=>{
  console.error('Ошибка подключения Supabase:',error);
  setReviewStatus('Не удалось подключиться к Supabase. Проверьте интернет-соединение и ключи.', 'error');
});

