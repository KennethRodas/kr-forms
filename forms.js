/* Kenneth Rodas — Form Builder + Engine
   Form mode: completely replaces body (zero Webflow interference)
   Builder mode: fixed overlay inside #kr-builder                  */

document.addEventListener('DOMContentLoaded', function() {
'use strict';

var ID = new URLSearchParams(location.search).get('id');
var ROOT = document.getElementById('kr-builder');
if (!ROOT) return;

// ── SHARED UTILS ───────────────────────────────────────────────────────────
var uid = function() { return Math.random().toString(36).slice(2,8).toLowerCase(); };
var clone = function(o) { return JSON.parse(JSON.stringify(o)); };
var showToast = function(m) { var t = document.getElementById('kr-toast'); if (t) { t.textContent = m; t.classList.add('show'); setTimeout(function() { t.classList.remove('show'); }, 2200); } };
var copyText = function(t) { navigator.clipboard.writeText(t).then(function() { showToast('Copied!'); }); };
var getSettings = function() { try { return JSON.parse(localStorage.getItem('krd_settings') || '{}'); } catch(e) { return {}; } };
var el = function(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h) e.innerHTML = h; return e; };

// ── SHARED DATA ────────────────────────────────────────────────────────────
var PTAGS = ['Bold','Minimal','Playful','Elegant','Raw','Luxurious','Approachable','Authoritative','Warm','Cutting-edge','Timeless','Rebellious','Trustworthy','Energetic','Calm','Premium','Human','Innovative','Grounded','Edgy','Refined','Friendly','Serious','Aspirational'];
var STYLES = [{icon:'◻️',name:'Modern Minimal',desc:'Clean, white space, geometric.'},{icon:'🔥',name:'Bold & Expressive',desc:'Big type, strong contrast.'},{icon:'🏛️',name:'Classic & Timeless',desc:'Serif-led, heritage feel.'},{icon:'🎮',name:'Playful & Fun',desc:'Rounded, colorful, approachable.'},{icon:'💎',name:'Luxury & Premium',desc:'Refined, restrained, high-end.'},{icon:'⚡',name:'Raw & Edgy',desc:'Gritty, textured, unapologetic.'}];
var SWATCHES = [{name:'Black & White',c:['#111','#fff']},{name:'Earth Tones',c:['#8B6F47','#C4A882']},{name:'Pastels',c:['#F9C6C6','#C6E2F9']},{name:'Jewel Tones',c:['#1A237E','#6A0080']},{name:'Neons',c:['#00FF87','#FF006E']},{name:'Warm Neutrals',c:['#E8DCC8','#B8956A']},{name:'Cool Blues',c:['#0D47A1','#90CAF9']},{name:'Forest & Green',c:['#1B5E20','#A5D6A7']},{name:'Sunset',c:['#FF6B35','#FFD93D']},{name:'Monochrome',c:['#333','#999']}];
var SCOPE = [{icon:'✏️',name:'Logo Design',desc:'Primary mark, variations, favicon'},{icon:'🎨',name:'Full Brand Identity',desc:'Logo + colors, type, usage guide'},{icon:'📋',name:'Brand Guidelines',desc:'Documented system for consistency'},{icon:'📱',name:'Social Media Kit',desc:'Templates for posts and stories'},{icon:'🌐',name:'Website Design',desc:'UI design / Webflow build'},{icon:'🗂️',name:'Collateral & Print',desc:'Cards, letterhead, packaging'}];
var BUDGETS = [{val:'$500–$750',label:'Logo Only · Entry'},{val:'$750–$1,000',label:'Logo Only · Standard'},{val:'$1,000–$1,500',label:'Logo + Basic Assets'},{val:'$1,500–$2,500',label:'Logo Design · Starter'},{val:'$2,500–$4,000',label:'Brand Identity · Core'},{val:'$4,000–$6,000',label:'Brand Identity · Full'},{val:'$6,000–$8,000',label:'Brand Identity · Premium'},{val:'$8,000–$10,000',label:'Full Brand + Collateral'},{val:'$10,000–$15,000',label:'Complete Brand System'},{val:'$15,000–$25,000',label:'Agency-Level'},{val:'$25,000+',label:'Enterprise / Retainer'}];
var TM = {text:{l:'Short Text',i:'📝'},email:{l:'Email',i:'📧'},url:{l:'URL',i:'🌐'},textarea:{l:'Long Text',i:'📄'},select:{l:'Dropdown',i:'📋'},personality_tags:{l:'Tag Picker',i:'🏷️'},style_cards:{l:'Style Cards',i:'◻️'},swatch_grid:{l:'Color Swatches',i:'🎨'},color_picker:{l:'Color Picker',i:'🖌️'},budget_slider:{l:'Budget Slider',i:'💰'},scope_cards:{l:'Service Cards',i:'☑️'},upload:{l:'File Upload',i:'📎'},competitors:{l:'Competitor Rows',i:'👥'}};

// ── FIELD HTML ─────────────────────────────────────────────────────────────
function fld(f) {
  if (!f.enabled) return '';
  var lbl = '<label>' + f.label + (f.required ? ' <span class="req">*</span>' : '') + (f.hint ? '<span class="hint">' + f.hint + '</span>' : '') + '</label>';
  var err = f.required ? '<div class="field-error">Required.</div>' : '';
  var ml = f.maxLength || 400;
  switch (f.type) {
    case 'text': case 'email': case 'url':
      return '<div class="field-group">' + lbl + '<input type="' + f.type + '" name="' + f.id + '" placeholder="' + (f.placeholder||'') + '"' + (f.required?' required':'') + '>' + err + '</div>';
    case 'textarea':
      return '<div class="field-group">' + lbl + '<div class="textarea-wrap"><textarea name="' + f.id + '" placeholder="' + (f.placeholder||'') + '"' + (f.required?' required':'') + ' maxlength="' + ml + '" data-maxlength="' + ml + '"></textarea><div class="char-count">0 / ' + ml + '</div></div>' + err + '</div>';
    case 'select':
      return '<div class="field-group">' + lbl + '<select name="' + f.id + '"' + (f.required?' required':'') + '><option value="" disabled selected>Select one</option>' + (f.options||[]).map(function(o){return '<option>'+o+'</option>';}).join('') + '</select>' + err + '</div>';
    case 'competitors':
      return '<div class="field-group">' + lbl + [1,2,3].map(function(n){return '<div class="competitor-row"><input type="text" name="comp'+n+'_name" placeholder="Competitor name"><input type="url" name="comp'+n+'_url" placeholder="Website (optional)"></div>';}).join('') + '</div>';
    case 'personality_tags':
      return '<div class="field-group">' + lbl + '<div class="tag-grid" id="personalityTags"></div><div class="field-error" id="personalityError">Select at least 2 traits.</div></div>';
    case 'style_cards':
      return '<div class="field-group">' + lbl + '<div class="card-grid cols-3" id="styleCards"></div><div class="field-error" id="styleError">Please select a style direction.</div></div>';
    case 'swatch_grid':
      return '<div class="field-group">' + lbl + '<div class="swatch-grid" id="swatchGrid"></div><div class="field-error" id="swatchError">Please select at least one.</div></div>';
    case 'color_picker':
      return '<div class="field-group">' + lbl + '<div class="color-picker-row"><div class="color-input-wrap"><input type="color" id="colorPickerInput" value="#6ceda4"><div class="color-icon">＋</div></div><button type="button" class="add-color-btn" id="addColorBtn">Add Color</button><span style="font-size:11.5px;color:var(--text-muted)">Pick a shade, then click Add</span></div><div class="color-chips" id="colorChips"></div><input type="hidden" name="favorite_colors" id="favoriteColors"></div>';
    case 'budget_slider':
      return '<div class="field-group">' + lbl + '<div class="budget-display"><span id="budgetValue">$1,500–$2,500</span></div><div class="budget-sub" id="budgetLabel">Logo Design · Starter</div><div class="slider-wrap" ondragstart="return false"><input type="range" id="budgetSlider" name="budget_range" min="0" max="10" value="3" step="1" draggable="false"></div><div class="budget-labels"><span>$500</span><span>$5k</span><span>$10k+</span></div><input type="hidden" name="budget_display" id="budgetHidden"></div>';
    case 'scope_cards':
      return '<div class="field-group">' + lbl + '<div class="card-grid cols-2" id="scopeCards"></div><div class="field-error" id="scopeError">Please select at least one service.</div></div>';
    case 'upload':
      return '<div class="field-group">' + lbl + '<input type="hidden" role="uploadcare-uploader" name="' + f.id + '_files" data-multiple="true" data-multiple-max="' + (f.maxFiles||5) + '" data-max-local-file-size="10485760" data-images-only="false" data-preview-step="true"></div>';
    default: return '';
  }
}

function initWidgets(cfg) {
  // Char counts
  document.querySelectorAll('textarea[data-maxlength]').forEach(function(ta) {
    var max = parseInt(ta.dataset.maxlength), c = ta.parentElement.querySelector('.char-count');
    if (c) { var u = function(){ c.textContent = ta.value.length + ' / ' + max; }; ta.addEventListener('input', u); u(); }
  });
  // Personality tags
  var pt = document.getElementById('personalityTags');
  if (pt) {
    pt.innerHTML = PTAGS.map(function(t){ return '<label class="tag-choice"><input type="checkbox" name="personality[]" value="'+t+'"><div class="tag-face">'+t+'</div></label>'; }).join('');
    pt.querySelectorAll('input').forEach(function(cb){ cb.addEventListener('change', function(){ if (pt.querySelectorAll('input:checked').length > 4) cb.checked = false; }); });
  }
  // Style cards
  var sc = document.getElementById('styleCards');
  if (sc) sc.innerHTML = STYLES.map(function(c){ return '<label class="choice-card"><input type="radio" name="style_direction" value="'+c.name+'"><div class="card-face"><div class="card-icon">'+c.icon+'</div><div class="card-name">'+c.name+'</div><div class="card-desc">'+c.desc+'</div></div></label>'; }).join('');
  // Swatches
  var sg = document.getElementById('swatchGrid');
  if (sg) sg.innerHTML = SWATCHES.map(function(s){ var g = s.c.length===2 ? 'linear-gradient(135deg,'+s.c[0]+' 50%,'+s.c[1]+' 50%)' : s.c[0]; return '<div class="swatch-item"><label class="swatch-choice"><input type="checkbox" name="palette[]" value="'+s.name+'"><div class="swatch-face" style="background:'+g+'"></div></label><div class="swatch-label">'+s.name+'</div></div>'; }).join('');
  // Scope cards
  var sco = document.getElementById('scopeCards');
  if (sco) sco.innerHTML = SCOPE.map(function(c){ return '<label class="choice-card"><input type="checkbox" name="scope[]" value="'+c.name+'"><div class="card-face"><div class="card-icon">'+c.icon+'</div><div class="card-name">'+c.name+'</div><div class="card-desc">'+c.desc+'</div></div></label>'; }).join('');
  // Budget slider
  var sl = document.getElementById('budgetSlider');
  if (sl) {
    var vl = document.getElementById('budgetValue'), lb = document.getElementById('budgetLabel'), hd = document.getElementById('budgetHidden');
    var bu = function(){ var b = BUDGETS[parseInt(sl.value)]; vl.textContent = b.val; lb.textContent = b.label; hd.value = b.val; sl.style.setProperty('--val', (sl.value/(BUDGETS.length-1)*100)+'%'); };
    sl.max = BUDGETS.length - 1;
    sl.addEventListener('input', bu);
    sl.addEventListener('dragstart', function(e){ e.preventDefault(); });
    sl.addEventListener('mousedown', function(e){ e.stopPropagation(); });
    bu();
  }
  // Color picker
  var cp = document.getElementById('colorPickerInput');
  if (cp) {
    var cols = [], b2 = document.getElementById('addColorBtn'), ch = document.getElementById('colorChips'), hd2 = document.getElementById('favoriteColors');
    var rc = function(){ ch.innerHTML = cols.map(function(c,i){ return '<div class="color-chip"><div class="chip-dot" style="background:'+c+'"></div><span>'+c+'</span><button type="button" onclick="window._rc('+i+')">×</button></div>'; }).join(''); hd2.value = cols.join(', '); };
    window._rc = function(i){ cols.splice(i,1); rc(); };
    b2.addEventListener('click', function(){ var h = cp.value.toUpperCase(); if (!cols.includes(h) && cols.length < 8) { cols.push(h); rc(); } });
  }
  // Uploadcare
  if (cfg && cfg.uploadcareKey && !window.UPLOADCARE_PUBLIC_KEY) {
    var needs = cfg.sections && cfg.sections.some(function(s){ return s.enabled && s.fields.some(function(f){ return f.enabled && f.type==='upload'; }); });
    if (needs) { window.UPLOADCARE_PUBLIC_KEY = cfg.uploadcareKey; var sc2 = document.createElement('script'); sc2.src = 'https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js'; document.head.appendChild(sc2); }
  }
}

// ══ FORM MODE — completely replaces document.body ════════════════════════
if (ID) {
  var settings = getSettings();
  if (!settings.dbUrl) {
    document.body.innerHTML = '<style>body{font-family:Poppins,sans-serif;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style><div style="text-align:center;padding:40px"><h2 style="margin-bottom:12px">Setup required</h2><p style="color:rgba(255,255,255,.5)">Open the builder and configure Firebase in Settings.</p></div>';
    return;
  }
  // Show spinner immediately
  document.body.style.cssText = 'background:#050505;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Poppins,sans-serif';
  document.body.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:#6ceda4;animation:sp 1.4s ease-in-out infinite"></div><style>@keyframes sp{0%,100%{opacity:1}50%{opacity:.3}}body{font-family:Poppins,sans-serif;background:#050505;margin:0}</style>';

  fetch(settings.dbUrl.replace(/\/$/,'') + '/forms/' + ID + '.json')
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(cfg){
      if (!cfg) { document.body.innerHTML = '<style>body{font-family:Poppins,sans-serif;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style><div style="text-align:center"><h2>Form not found</h2><p style="color:rgba(255,255,255,.5);margin-top:12px">This link may be invalid or expired.</p></div>'; return; }

      var en = cfg.sections.filter(function(s){ return s.enabled; });
      var tot = en.length;

      // BUILD FORM HTML
      var stepsHTML = en.map(function(s, i){
        var fields = s.fields.filter(function(f){ return f.enabled; }).map(fld).join('');
        return '<div class="step-panel' + (i===0?' active':'') + '" data-step="'+(i+1)+'">' +
          '<div class="step-title">'+s.icon+' '+s.label+'</div>' +
          '<div class="step-desc">'+(s.desc||'')+'</div>' +
          fields + '</div>';
      }).join('');

      // COMPLETELY REPLACE BODY — zero Webflow interference
      document.body.innerHTML =
        '<link rel="preconnect" href="https://fonts.googleapis.com">' +
        '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
        '<div class="bg-grid"></div><div class="bg-glow"></div>' +
        '<div class="page">' +
          '<div class="form-header">' +
            '<div class="eyebrow">Brand Discovery</div>' +
            '<h1>'+(cfg.title||'Brand Discovery')+'<br><span>'+(cfg.subtitle||"Let's build something worth remembering.")+'</span></h1>' +
            '<p>'+(cfg.description||'')+'</p>' +
          '</div>' +
          '<div class="progress-wrap"><div class="progress-steps" id="PS"></div><div class="progress-bar-track"><div class="progress-bar-fill" id="PF"></div></div></div>' +
          '<form id="DF" action="https://formspree.io/f/'+(cfg.formspreeId||'')+'" method="POST" novalidate>' +
            '<input type="hidden" name="_form_id" value="'+(cfg.id||'')+'">' +
            stepsHTML +
            '<div class="form-nav">' +
              '<button type="button" class="btn btn-ghost" id="PB" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Back</button>' +
              '<span class="step-counter" id="SC"></span>' +
              '<button type="button" class="btn btn-primary" id="NB">Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>' +
            '</div>' +
          '</form>' +
          '<div id="success-screen"><div class="success-icon">🎉</div><h2>You\'re all set.</h2><p>I\'ll be in touch within 48 hours. Looking forward to building something great together.</p></div>' +
        '</div>';

      document.body.style.cssText = '';

      var cur = 1;
      var SV = en.map(function(s,i){ return {step:i+1, pt:s.fields.some(function(f){return f.enabled&&f.type==='personality_tags';}), st:s.fields.some(function(f){return f.enabled&&f.type==='style_cards';}), sw:s.fields.some(function(f){return f.enabled&&f.type==='swatch_grid';}), sc:s.fields.some(function(f){return f.enabled&&f.type==='scope_cards';})}; });

      function panel(s){ return document.querySelector('.step-panel[data-step="'+s+'"]'); }
      function bp(){
        var w = document.getElementById('PS'); w.innerHTML = '';
        en.forEach(function(s,i){ var n=i+1, d=document.createElement('div'); d.className='step-dot'+(n===cur?' active':n<cur?' done':''); d.innerHTML='<div class="dot"><span>'+n+'</span></div><div class="step-label">'+s.label+'</div>'; w.appendChild(d); if(i<en.length-1){var c=document.createElement('div');c.className='step-connector'+(n<cur?' done':'');w.appendChild(c);}});
        document.getElementById('PF').style.width=((cur/tot)*100)+'%';
        document.getElementById('SC').textContent='Step '+cur+' of '+tot;
      }
      function val(step){
        var ok=true;
        panel(step).querySelectorAll('[required]').forEach(function(e){ var err=e.closest('.field-group')&&e.closest('.field-group').querySelector('.field-error'); if(!e.value.trim()){e.classList.add('invalid');if(err)err.classList.add('show');ok=false;}else{e.classList.remove('invalid');if(err)err.classList.remove('show');}});
        var v=SV.find(function(x){return x.step===step;})||{};
        if(v.pt){var c=document.querySelectorAll('#personalityTags input:checked').length,e=document.getElementById('personalityError');if(c<2){e.classList.add('show');ok=false;}else e.classList.remove('show');}
        if(v.st){var c2=document.querySelector('input[name="style_direction"]:checked'),e2=document.getElementById('styleError');if(!c2){e2.classList.add('show');ok=false;}else e2.classList.remove('show');}
        if(v.sw){var c3=document.querySelectorAll('#swatchGrid input:checked').length,e3=document.getElementById('swatchError');if(c3===0){e3.classList.add('show');ok=false;}else e3.classList.remove('show');}
        if(v.sc){var c4=document.querySelectorAll('#scopeCards input:checked').length,e4=document.getElementById('scopeError');if(c4===0){e4.classList.add('show');ok=false;}else e4.classList.remove('show');}
        return ok;
      }
      function go(n){
        panel(cur).classList.remove('active'); cur=n; panel(cur).classList.add('active'); bp();
        document.getElementById('PB').style.display=cur>1?'flex':'none';
        var nb=document.getElementById('NB');
        nb.innerHTML=cur===tot?'Submit <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>':'Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        window.scrollTo({top:0,behavior:'smooth'});
      }
      document.getElementById('NB').addEventListener('click', function(){
        if (!val(cur)) return;
        if (cur < tot) { go(cur+1); } else {
          var btn=document.getElementById('NB'); btn.textContent='Sending…'; btn.disabled=true;
          fetch(document.getElementById('DF').action,{method:'POST',body:new FormData(document.getElementById('DF')),headers:{Accept:'application/json'}})
            .then(function(r){ if(r.ok){document.getElementById('DF').style.display='none';document.querySelector('.progress-wrap').style.display='none';document.getElementById('success-screen').style.display='block';}else{btn.textContent='Try Again';btn.disabled=false;}})
            .catch(function(){btn.textContent='Try Again';btn.disabled=false;});
        }
      });
      document.getElementById('PB').addEventListener('click', function(){ if(cur>1) go(cur-1); });
      initWidgets(cfg);
      bp();
    })
    .catch(function(){
      document.body.innerHTML = '<style>body{font-family:Poppins,sans-serif;background:#050505;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style><div style="text-align:center"><h2>Could not load form</h2><p style="color:rgba(255,255,255,.5);margin-top:12px">Check Firebase rules — set .read and .write to true.</p></div>';
    });
  return;
}

// ══ BUILDER MODE ════════════════════════════════════════════════════════════
ROOT.className = 'kr-builder-active'; // just marks it as active

function F(id,type,label,opts){ opts=opts||{}; return {id:id,type:type,label:label,enabled:true,required:!!opts.required,placeholder:opts.placeholder||'',hint:opts.hint||'',options:opts.options||[],maxLength:opts.maxLength||400,maxFiles:opts.maxFiles||5}; }

var DEFS = {title:'Brand Discovery',subtitle:"Let's build something worth remembering.",description:'Before we dive in, I need to understand your world. This takes about 8 minutes.',formspreeId:'xojrrbqy',uploadcareKey:'97bb5d2cd5884f84dda0',sections:[
  {id:'contact',label:'You',icon:'👋',enabled:true,desc:'Tell me who you are and what brought you here.',fields:[F('name','text','Your Name',{placeholder:'Jane Doe',required:true}),F('email','email','Email Address',{placeholder:'hello@brand.com',required:true}),F('bname','text','Business / Brand Name',{placeholder:'Acme Co.',required:true}),F('industry','text','Industry / Niche',{placeholder:'e.g. Health & Wellness',required:true}),F('website','url','Website URL',{placeholder:'https://yourbrand.com'}),F('referral','select','How did you find me?',{required:true,options:['Instagram','TikTok','LinkedIn','Google / Search','Word of mouth / Referral','Behance / Portfolio','Other']})]},
  {id:'business',label:'Business',icon:'🏢',enabled:true,desc:'Help me understand what you do and what makes you different.',fields:[F('biz_desc','textarea','What does your business do?',{required:true,placeholder:'We help small businesses...'}),F('brand_story','textarea','Story behind the brand?',{placeholder:'I started this because...'}),F('tagline','text','Tagline / Motto',{placeholder:'e.g. Built different.'}),F('years','select','Years in business',{options:['Just starting out','Less than 1 year','1–3 years','3–7 years','7+ years']}),F('socials','text','Social media handles',{placeholder:'@yourbrand (IG), @yourbrand (TT)'})]},
  {id:'audience',label:'Audience',icon:'🎯',enabled:true,desc:'Great branding speaks directly to one person.',fields:[F('ideal_client','textarea','Who is your ideal client?',{required:true,placeholder:'My ideal client is...'}),F('problem','textarea','What problem do you solve?',{required:true,placeholder:'They struggle to...'}),F('trust','textarea','Why should they trust you?',{placeholder:'10 years of experience...'})]},
  {id:'competition',label:'Competition',icon:'🔍',enabled:true,desc:'Know the landscape so we can make you stand out.',fields:[F('competitors','competitors','Top 3 Competitors'),F('comp_s','textarea','What do competitors do well?',{placeholder:'Strong social presence...'}),F('comp_w','textarea','What do competitors get wrong?',{placeholder:'They feel cold...'}),F('diff','textarea','What makes you genuinely different?',{required:true,placeholder:"We're the only ones..."})]},
  {id:'personality',label:'Personality',icon:'✨',enabled:true,desc:'Brands are like people — voice, vibe, character.',fields:[F('ptags','personality_tags','Brand personality words (pick up to 4)'),F('feeling','textarea','What should people FEEL?',{required:true,placeholder:'Inspired. Like dealing with a pro...'}),F('person','text','If your brand were a person, who?',{placeholder:'e.g. A young Steve Jobs...'}),F('goal','textarea','One year from now, success looks like?',{placeholder:'20k followers...'})]},
  {id:'visual',label:'Visual',icon:'🎨',enabled:true,desc:'Now we get into aesthetics.',fields:[F('style','style_cards','Pick a style direction'),F('palette','swatch_grid','Color palette mood'),F('fav_c','color_picker','Favorite specific colors'),F('c_notes','textarea','Colors to include or avoid?',{placeholder:'Love deep greens...'}),F('brands','textarea','Brands you admire visually',{placeholder:'Notion, Glossier...'}),F('moodboard','upload','Upload moodboard / inspiration')]},
  {id:'scope',label:'Scope',icon:'💼',enabled:true,desc:"Let's align on what you need.",fields:[F('services','scope_cards','What do you need from me?'),F('budget','budget_slider','Your investment range'),F('timeline','select','Desired timeline',{required:true,options:['ASAP (Rush — under 2 weeks)','2–4 weeks','1–2 months','2–3 months','Flexible — quality over speed']}),F('existing','select','Do you have an existing brand?',{options:['No — starting fresh','Yes — full rebrand needed','Yes — light refresh only','Partial — have some assets']}),F('assets','upload','Upload existing brand assets'),F('notes','textarea','Anything else I should know?',{placeholder:'Specific requirements...'})]}
]};

var cfg = Object.assign(clone(DEFS), {id: uid()});
var activeSecId = cfg.sections[0].id;
var activeFieldId = null;
var showTP = false;

var activeSec = function(){ return cfg.sections.find(function(s){ return s.id===activeSecId; }); };

function saveForm(){ try{ localStorage.setItem('krd_form_'+cfg.id,JSON.stringify(cfg)); var idx=JSON.parse(localStorage.getItem('krd_forms')||'[]'); var e={id:cfg.id,title:cfg.title,savedAt:new Date().toLocaleString(),steps:cfg.sections.filter(function(s){return s.enabled;}).length}; localStorage.setItem('krd_forms',JSON.stringify([e].concat(idx.filter(function(i){return i.id!==cfg.id;})).slice(0,30))); showToast('Saved ✓'); }catch(e){ showToast('Save failed'); } }
function loadForm(id){ try{ var d=localStorage.getItem('krd_form_'+id); if(d){ cfg=JSON.parse(d); activeSecId=cfg.sections[0].id; activeFieldId=null; render(); closeModal(); showToast('Loaded ✓'); } }catch(e){ showToast('Failed'); } }
function getSaved(){ try{ return JSON.parse(localStorage.getItem('krd_forms')||'[]'); }catch(e){ return []; } }
function fbSave(dbUrl,id,data){ return fetch(dbUrl.replace(/\/$/,'')+'/forms/'+id+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){ if(!r.ok) throw new Error('Firebase write failed: '+r.status); }); }

function moveSection(id,dir){ var i=cfg.sections.findIndex(function(s){return s.id===id;}); var j=i+dir; if(j<0||j>=cfg.sections.length)return; var tmp=cfg.sections[i]; cfg.sections[i]=cfg.sections[j]; cfg.sections[j]=tmp; render(); }
function deleteSection(id){ if(cfg.sections.length<=1){showToast('Need at least one section');return;} cfg.sections=cfg.sections.filter(function(s){return s.id!==id;}); if(activeSecId===id) activeSecId=cfg.sections[0].id; render(); }
function addSection(){ var s={id:uid(),label:'New Section',icon:'📋',enabled:true,desc:'',fields:[F(uid(),'text','Field 1',{})]}; cfg.sections.push(s); activeSecId=s.id; activeFieldId=null; render(); }
function moveField(fid,dir){ var sec=activeSec(); if(!sec)return; var i=sec.fields.findIndex(function(f){return f.id===fid;}); var j=i+dir; if(j<0||j>=sec.fields.length)return; var tmp=sec.fields[i]; sec.fields[i]=sec.fields[j]; sec.fields[j]=tmp; render(); }
function deleteField(fid){ var sec=activeSec(); if(!sec)return; sec.fields=sec.fields.filter(function(f){return f.id!==fid;}); if(activeFieldId===fid) activeFieldId=null; render(); }
function addField(type){ var sec=activeSec(); if(!sec)return; var opts={}; if(type==='select') opts.options=['Option 1','Option 2']; var f=F(uid(),type,(TM[type]?TM[type].l:'New Field'),opts); sec.fields.push(f); activeFieldId=f.id; showTP=false; render(); }

function buildEditor(f){
  var wrap=el('div','kr-fe');
  var hasPh=['text','email','url','textarea'].indexOf(f.type)>=0;
  var hasOpts=f.type==='select', hasMl=f.type==='textarea', hasMf=f.type==='upload';
  var h='<div class="kr-fe-full"><span class="kr-fe-lbl">Field Type</span><select class="kr-fe-sel" id="fe-type">';
  Object.keys(TM).forEach(function(k){ h+='<option value="'+k+'"'+(f.type===k?' selected':'')+'>'+TM[k].i+' '+TM[k].l+'</option>'; });
  h+='</select></div>';
  h+='<div class="kr-fe-grid"><div><span class="kr-fe-lbl">Label</span><input class="kr-fe-inp" id="fe-lbl" value="'+(f.label||'')+'" placeholder="Field label"></div>';
  h+='<div><span class="kr-fe-lbl">Placeholder</span><input class="kr-fe-inp" id="fe-ph" value="'+(f.placeholder||'')+'" placeholder="Placeholder text"'+(hasPh?'':' disabled style="opacity:.4"')+'></div></div>';
  h+='<div class="kr-fe-full"><span class="kr-fe-lbl">Hint text</span><input class="kr-fe-inp" id="fe-hint" value="'+(f.hint||'')+'" placeholder="Optional helper text below label"></div>';
  h+='<div class="kr-fe-row"><span class="kr-fe-row-lbl">Required</span><div class="kr-tog'+(f.required?' on':'')+'" id="fe-req"><div class="kr-tog-dot"></div></div></div>';
  if(hasMl) h+='<div class="kr-fe-row"><span class="kr-fe-row-lbl">Max characters</span><input class="kr-fe-num" id="fe-ml" type="number" value="'+(f.maxLength||400)+'"></div>';
  if(hasMf) h+='<div class="kr-fe-row"><span class="kr-fe-row-lbl">Max files</span><input class="kr-fe-num" id="fe-mf" type="number" value="'+(f.maxFiles||5)+'" min="1" max="10"></div>';
  if(hasOpts) h+='<div class="kr-fe-full"><span class="kr-fe-lbl">Options</span><div id="fe-opts"></div><button class="kr-add-opt" id="fe-add-opt">+ Add Option</button></div>';
  h+='<div style="display:flex;justify-content:flex-end;gap:6px;margin-top:10px"><button class="kr-btn ghost" id="fe-del" style="padding:6px 12px;font-size:11.5px;flex:none;color:#ff6b6b;border-color:rgba(255,107,107,.2)">Delete</button><button class="kr-btn ghost" id="fe-done" style="padding:6px 12px;font-size:11.5px;flex:none">Done ▲</button></div>';
  wrap.innerHTML=h;

  var upd=function(k,v){ var sf=activeSec()&&activeSec().fields.find(function(x){return x.id===f.id;}); if(sf) sf[k]=v; };
  wrap.querySelector('#fe-type').onchange=function(e){ var sf=activeSec()&&activeSec().fields.find(function(x){return x.id===f.id;}); if(sf){sf.type=e.target.value;if(e.target.value==='select'&&(!sf.options||!sf.options.length))sf.options=['Option 1'];render();} };
  wrap.querySelector('#fe-lbl').oninput=function(e){ upd('label',e.target.value); };
  if(hasPh) wrap.querySelector('#fe-ph').oninput=function(e){ upd('placeholder',e.target.value); };
  wrap.querySelector('#fe-hint').oninput=function(e){ upd('hint',e.target.value); };
  wrap.querySelector('#fe-req').onclick=function(){ var sf=activeSec()&&activeSec().fields.find(function(x){return x.id===f.id;}); if(sf){sf.required=!sf.required;var t=wrap.querySelector('#fe-req');t.classList.toggle('on',sf.required);t.querySelector('.kr-tog-dot').style.left=sf.required?'14px':'2px';} };
  if(hasMl) wrap.querySelector('#fe-ml').oninput=function(e){ upd('maxLength',parseInt(e.target.value)||400); };
  if(hasMf) wrap.querySelector('#fe-mf').oninput=function(e){ upd('maxFiles',parseInt(e.target.value)||5); };
  if(hasOpts){
    var renderOpts=function(){ var sf=activeSec()&&activeSec().fields.find(function(x){return x.id===f.id;}); if(!sf)return; var ol=wrap.querySelector('#fe-opts'); ol.innerHTML=(sf.options||[]).map(function(o,i){return'<div class="kr-opt-row"><input class="kr-opt-inp" value="'+o+'" data-i="'+i+'"><button class="kr-opt-del" data-i="'+i+'">×</button></div>';}).join(''); ol.querySelectorAll('.kr-opt-inp').forEach(function(inp){inp.oninput=function(e){var sf2=activeSec()&&activeSec().fields.find(function(x){return x.id===f.id;});if(sf2)sf2.options[parseInt(inp.dataset.i)]=e.target.value;};}); ol.querySelectorAll('.kr-opt-del').forEach(function(btn){btn.onclick=function(){var sf2=activeSec()&&activeSec().fields.find(function(x){return x.id===f.id;});if(sf2){sf2.options.splice(parseInt(btn.dataset.i),1);renderOpts();}};});};
    wrap.querySelector('#fe-add-opt').onclick=function(){ var sf=activeSec()&&activeSec().fields.find(function(x){return x.id===f.id;}); if(sf){if(!sf.options)sf.options=[];sf.options.push('New option');renderOpts();} };
    renderOpts();
  }
  wrap.querySelector('#fe-del').onclick=function(){ deleteField(f.id); };
  wrap.querySelector('#fe-done').onclick=function(){ activeFieldId=null; render(); };
  return wrap;
}

function buildTP(){
  var wrap=el('div','kr-tp');
  var h='<div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:10px">Choose field type</div><div class="kr-tp-grid">';
  Object.keys(TM).forEach(function(k){ h+='<div class="kr-tp-opt" data-t="'+k+'"><div class="kr-tp-icon">'+TM[k].i+'</div><div class="kr-tp-name">'+TM[k].l+'</div></div>'; });
  h+='</div><div style="margin-top:10px;text-align:right"><button class="kr-btn ghost" id="tp-cancel" style="padding:5px 12px;font-size:11.5px;flex:none">Cancel</button></div>';
  wrap.innerHTML=h;
  wrap.querySelectorAll('.kr-tp-opt').forEach(function(o){ o.onclick=function(){ addField(o.dataset.t); }; });
  wrap.querySelector('#tp-cancel').onclick=function(){ showTP=false; render(); };
  return wrap;
}

function render(){
  ROOT.innerHTML='';

  // Sidebar
  var side=el('div','kr-side');
  side.innerHTML='<div class="kr-side-head"><div class="kr-brand">Form Builder</div><div class="kr-brand-title">Discovery</div></div>';
  var list=el('div','kr-section-list');
  cfg.sections.forEach(function(s){
    var row=el('div','kr-sec-row'+(s.id===activeSecId?' active':'')+(s.enabled?'':' disabled'));
    var iconInp=document.createElement('input'); iconInp.className='kr-sec-icon-inp'; iconInp.value=s.icon||''; iconInp.maxLength=2;
    iconInp.addEventListener('click',function(e){e.stopPropagation();activeSecId=s.id;render();});
    iconInp.addEventListener('input',function(e){s.icon=e.target.value;});
    var lblInp=document.createElement('input'); lblInp.className='kr-sec-lbl'; lblInp.value=s.label; lblInp.type='text';
    lblInp.addEventListener('click',function(e){e.stopPropagation();activeSecId=s.id;render();});
    lblInp.addEventListener('input',function(e){s.label=e.target.value;});
    lblInp.addEventListener('keydown',function(e){e.stopPropagation();});
    var tog=el('div','kr-tog'+(s.enabled?' on':''));tog.innerHTML='<div class="kr-tog-dot"></div>';
    tog.addEventListener('click',function(e){e.stopPropagation();s.enabled=!s.enabled;render();});
    var btns=el('div','kr-sec-btns');
    function mkSB(t,cls,fn){ var b=document.createElement('button'); b.className='kr-sec-btn'+(cls?' '+cls:''); b.textContent=t; b.addEventListener('click',function(e){e.stopPropagation();fn();}); return b; }
    btns.appendChild(mkSB('↑','',function(){moveSection(s.id,-1);}));
    btns.appendChild(mkSB('↓','',function(){moveSection(s.id,1);}));
    btns.appendChild(mkSB('✕','del',function(){if(confirm('Delete "'+s.label+'"?'))deleteSection(s.id);}));
    row.appendChild(iconInp); row.appendChild(lblInp); row.appendChild(tog); row.appendChild(btns);
    row.addEventListener('click',function(){activeSecId=s.id;activeFieldId=null;render();});
    list.appendChild(row);
  });
  side.appendChild(list);
  var addS=document.createElement('button'); addS.className='kr-add-sec'; addS.textContent='+ New Section'; addS.addEventListener('click',addSection);
  side.appendChild(addS);
  ROOT.appendChild(side);

  // Main
  var main=el('div','kr-main');
  var top=el('div','kr-topbar');
  function mkI(v,ph,w,fn){ var i=document.createElement('input'); i.className='kr-inp'; i.value=v; i.placeholder=ph; i.style.width=w; i.addEventListener('input',function(e){fn(e.target.value);}); return i; }
  top.appendChild(mkI(cfg.title,'Title','140px',function(v){cfg.title=v;}));
  top.appendChild(mkI(cfg.formspreeId,'Formspree ID','110px',function(v){cfg.formspreeId=v;}));
  var bid=el('div','kr-badge-id','slug: '+cfg.id); top.appendChild(bid);
  var ri=document.createElement('button'); ri.className='kr-ico'; ri.textContent='↺'; ri.title='New slug'; ri.addEventListener('click',function(){cfg.id=uid();render();});
  var si=document.createElement('button'); si.className='kr-ico'; si.textContent='⚙'; si.title='Settings'; si.addEventListener('click',function(){openModal('settings');});
  top.appendChild(ri); top.appendChild(si);
  main.appendChild(top);

  var content=el('div','kr-content');
  var sec=activeSec();
  if(sec){
    var meta=el('div','kr-sec-meta');
    var tr=el('div','kr-sec-title-row');
    var bigIcon=document.createElement('input'); bigIcon.className='kr-sec-icon-inp'; bigIcon.value=sec.icon||''; bigIcon.maxLength=2; bigIcon.style.cssText='font-size:20px;width:28px;';
    bigIcon.addEventListener('input',function(e){sec.icon=e.target.value;});
    var bigTitle=document.createElement('input'); bigTitle.className='kr-sec-big-title'; bigTitle.value=sec.label;
    bigTitle.addEventListener('input',function(e){sec.label=e.target.value;});
    var cnt=el('span','kr-sec-count',sec.fields.filter(function(f){return f.enabled;}).length+'/'+sec.fields.length+' enabled');
    tr.appendChild(bigIcon); tr.appendChild(bigTitle); tr.appendChild(cnt); meta.appendChild(tr);
    var di=document.createElement('input'); di.className='kr-desc-inp'; di.value=sec.desc||''; di.placeholder='Step description shown to client...';
    di.addEventListener('input',function(e){sec.desc=e.target.value;});
    meta.appendChild(di); content.appendChild(meta);

    sec.fields.forEach(function(f){
      var frow=el('div','kr-field-row'+(f.enabled?'':' disabled')+(activeFieldId===f.id?' selected':''));
      var tog2=el('div','kr-tog'+(f.enabled?' on':'')); tog2.innerHTML='<div class="kr-tog-dot"></div>'; tog2.style.marginTop='2px';
      tog2.addEventListener('click',function(e){e.stopPropagation();f.enabled=!f.enabled;render();});
      frow.appendChild(tog2);
      var fm=el('div','kr-field-main');
      fm.appendChild(el('div','kr-field-lbl',f.label));
      var tm=TM[f.type]||{l:f.type,i:'?'};
      fm.appendChild(el('div','kr-field-meta','<span class="kr-badge">'+tm.i+' '+tm.l+'</span>'+(f.required?'<span class="kr-badge req">Required</span>':'')));
      frow.appendChild(fm);
      var acts=el('div','kr-field-actions');
      function mkFB(t,cls,fn){ var b=document.createElement('button'); b.className='kr-fa-btn'+(cls?' '+cls:''); b.textContent=t; b.addEventListener('click',function(e){e.stopPropagation();fn();}); return b; }
      acts.appendChild(mkFB('↑','',function(){moveField(f.id,-1);}));
      acts.appendChild(mkFB('↓','',function(){moveField(f.id,1);}));
      acts.appendChild(mkFB(activeFieldId===f.id?'▲':'▼','',function(){activeFieldId=activeFieldId===f.id?null:f.id;render();}));
      acts.appendChild(mkFB('✕','del',function(){deleteField(f.id);}));
      frow.appendChild(acts);
      frow.addEventListener('click',function(){if(!f.enabled)return;activeFieldId=activeFieldId===f.id?null:f.id;render();});
      content.appendChild(frow);
      if(activeFieldId===f.id) content.appendChild(buildEditor(f));
    });
    if(showTP){ content.appendChild(buildTP()); }
    else{ var ab=document.createElement('button'); ab.className='kr-add-field'; ab.textContent='+ Add Field'; ab.addEventListener('click',function(){showTP=true;activeFieldId=null;render();}); content.appendChild(ab); }
  }
  main.appendChild(content);

  var bot=el('div','kr-bot');
  function mkBtn(t,cls,fn){ var b=document.createElement('button'); b.className='kr-btn '+cls; b.textContent=t; b.addEventListener('click',fn); return b; }
  bot.appendChild(mkBtn('💾 Save','ghost',saveForm));
  bot.appendChild(mkBtn('📁 Saved','ghost',function(){openModal('saved');}));
  bot.appendChild(mkBtn('⚡ Generate','primary',function(){openModal('generate');}));
  main.appendChild(bot);
  ROOT.appendChild(main);

  var toast=el('div','kr-toast'); toast.id='kr-toast'; ROOT.appendChild(toast);
}

function closeModal(){ var m=document.getElementById('kr-modal-overlay'); if(m) m.remove(); }
function openModal(type){
  closeModal();
  var ov=el('div','kr-ov'); ov.id='kr-modal-overlay'; ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});
  var modal=el('div','kr-modal'); ov.appendChild(modal);

  if(type==='generate'){
    var s=getSettings();
    if(!s.dbUrl||!s.siteUrl){ modal.innerHTML='<div class="kr-mh"><div class="kr-mt">Setup Required</div><button class="kr-mx" id="km-x">×</button></div><div class="kr-mb"><div class="kr-mhint" style="color:rgba(255,180,100,.9)">Firebase URL and Site URL must be set first. Click the ⚙ gear icon in the builder toolbar.</div></div>'; document.body.appendChild(ov); document.getElementById('km-x').addEventListener('click',closeModal); return; }
    var pageSlug=s.pageSlug||'forms';
    var shortUrl=s.siteUrl+'/'+pageSlug+'?id='+cfg.id;
    modal.innerHTML='<div class="kr-mh"><div><div class="kr-mt">⚡ Generate Form</div><div class="kr-ms">ID: '+cfg.id+' · '+cfg.sections.filter(function(s){return s.enabled;}).length+' steps</div></div><button class="kr-mx" id="km-x">×</button></div><div class="kr-mb"><div id="gen-s" style="text-align:center;padding:24px"><div style="width:10px;height:10px;border-radius:50%;background:#6ceda4;animation:sp 1.2s ease-in-out infinite;margin:0 auto 12px"></div><div style="font-size:13px;color:rgba(255,255,255,.5)">Saving to Firebase…</div></div></div><style>@keyframes sp{0%,100%{opacity:1}50%{opacity:.3}}</style>';
    document.body.appendChild(ov); document.getElementById('km-x').addEventListener('click',closeModal);
    fbSave(s.dbUrl,cfg.id,Object.assign({},cfg,{savedAt:new Date().toISOString()})).then(function(){
      var gs=document.getElementById('gen-s'); if(!gs) return;
      gs.innerHTML='<div class="kr-ml">🔗 Client Link — Share This</div><div style="padding:14px 16px;background:#080808;border:1px solid rgba(108,237,164,.25);border-radius:10px;margin-bottom:10px;word-break:break-all"><span style="font-size:14px;font-weight:700;color:#6ceda4">'+shortUrl+'</span></div><button class="kr-cpbtn" id="gen-cp" style="width:100%;text-align:center">Copy Link</button><div class="kr-mdiv"></div><div style="font-size:12px;color:rgba(255,255,255,.4);line-height:2">✓ Saved to Firebase &nbsp;·&nbsp; ✓ Link is live &nbsp;·&nbsp; ✓ Submissions → Formspree inbox</div>';
      document.getElementById('gen-cp').addEventListener('click',function(){copyText(shortUrl);document.getElementById('gen-cp').textContent='✓ Copied!';});
    }).catch(function(err){ var gs=document.getElementById('gen-s'); if(gs) gs.innerHTML='<div style="color:#ff6b6b;font-size:13px;text-align:center">Failed: '+err.message+'<br><small style="color:rgba(255,255,255,.4)">Check Firebase rules — set .read and .write to true</small></div>'; });
  }

  if(type==='settings'){
    var s2=getSettings();
    modal.innerHTML='<div class="kr-mh"><div><div class="kr-mt">⚙️ Settings</div><div class="kr-ms">Configure once, use forever</div></div><button class="kr-mx" id="km-x">×</button></div><div class="kr-mb"><span class="kr-ml">Form Title &amp; Copy</span><input id="s-t" class="kr-minp" placeholder="Form title" value="'+(cfg.title||'')+'"><input id="s-sub" class="kr-minp" placeholder="Subtitle (shown under h1)" value="'+(cfg.subtitle||'')+'"><input id="s-desc" class="kr-minp" placeholder="Description paragraph" value="'+(cfg.description||'')+'"><div class="kr-mdiv"></div><span class="kr-ml">🔥 Firebase Database URL</span><div class="kr-mhint">1. <a href="https://console.firebase.google.com" target="_blank" style="color:#6ceda4">console.firebase.google.com</a> → New project<br>2. Build → Realtime Database → Create → Test mode<br>3. Copy URL ending in .firebaseio.com<br>4. Rules tab: set .read and .write to true → Publish</div><input id="s-db" class="kr-minp" placeholder="https://your-project-rtdb.firebaseio.com" value="'+(s2.dbUrl||'')+'"><div class="kr-mdiv"></div><span class="kr-ml">🌐 Site URL &amp; Page Slug</span><input id="s-site" class="kr-minp" placeholder="https://kennethrodas.com" value="'+(s2.siteUrl||'https://kennethrodas.com')+'"><input id="s-slug" class="kr-minp" placeholder="forms" value="'+(s2.pageSlug||'forms')+'"><div class="kr-mdiv"></div><button class="kr-btn primary" id="s-save" style="width:100%;justify-content:center">Save Settings</button></div>';
    document.body.appendChild(ov); document.getElementById('km-x').addEventListener('click',closeModal);
    document.getElementById('s-save').addEventListener('click',function(){
      cfg.title=document.getElementById('s-t').value.trim()||cfg.title;
      cfg.subtitle=document.getElementById('s-sub').value.trim()||cfg.subtitle;
      cfg.description=document.getElementById('s-desc').value.trim()||cfg.description;
      var db=document.getElementById('s-db').value.trim();
      var site=document.getElementById('s-site').value.trim().replace(/\/$/,'');
      var slug=document.getElementById('s-slug').value.trim().replace(/^\//,'');
      if(db&&site) localStorage.setItem('krd_settings',JSON.stringify({dbUrl:db,siteUrl:site,pageSlug:slug||'forms'}));
      showToast('Settings saved ✓'); closeModal(); render();
    });
  }

  if(type==='saved'){
    var saved=getSaved();
    var h2='<div class="kr-mh"><div class="kr-mt">📁 Saved Forms</div><button class="kr-mx" id="km-x">×</button></div><div class="kr-mb">';
    if(saved.length===0){ h2+='<div class="kr-empty">No saved forms yet.<br>Click Save to store this variant.</div>'; }
    else{ saved.forEach(function(s){ h2+='<div class="kr-saved" data-id="'+s.id+'"><div><div class="kr-s-name">'+s.title+'</div><div class="kr-s-meta">slug: '+s.id+' · '+s.steps+' steps · '+s.savedAt+'</div></div><div class="kr-s-arrow">Load →</div></div>'; }); }
    h2+='<button class="kr-btn ghost" id="kr-new" style="width:100%;justify-content:center;margin-top:12px">+ New Form from Default</button></div>';
    modal.innerHTML=h2;
    document.body.appendChild(ov); document.getElementById('km-x').addEventListener('click',closeModal);
    document.getElementById('kr-new').addEventListener('click',function(){cfg=Object.assign(clone(DEFS),{id:uid()});activeSecId=cfg.sections[0].id;activeFieldId=null;render();closeModal();});
    ov.querySelectorAll('.kr-saved').forEach(function(item){ item.addEventListener('click',function(){loadForm(item.dataset.id);}); });
  }
}

render();
}); // end DOMContentLoaded
