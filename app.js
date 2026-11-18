'use strict';
const $=id=>document.getElementById(id);
const TYPES=['Đại lý chi trả ngoại tệ','Đơn vị trực tiếp chi trả ngoại tệ','Đại lý đổi ngoại tệ','Đại lý đổi tiền biên giới','Ngân hàng'];
const COLORS=['#197cb2','#855bc3','#078a69','#e79a34','#264e86'];
const FEED='https://script.google.com/macros/s/AKfycbz3J8MDCs1sCrkKe3buWd-X_luX82Q5n77ffBBG8rRvBnibIpUSvFeaKNZcI6LnVEtg/exec';
let selected=new Set(TYPES),records=[],map,ready=false,showWards=true,showHeat=false,popup,userMarker,addressMarker,addressResults=[],userMoved=false,toastTimer,feedLoading=false,lastFeed=0;
const markers=new Map();
function toast(text){$('toast').textContent=text;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),6500);}
function located(r){return r.lat!==null&&r.lng!==null&&r.lat!==''&&r.lng!==''&&Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lng));}
function searchText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
}

function sameProvince(a, b) {
  const key = value => searchText(value).replace(/^(?:tinh|thanh pho|tp)(?: |$)/, '').replace(/ /g, '');
  return key(a) === key(b);
}

function matchingRecords() {
  const query = searchText($('q').value);
  const terms = query ? query.split(' ') : [];
  const province = $('province').value;
  const status = $('status').value;
  const showClosed = $('showClosed').checked;
  return records.filter(record =>
    (showClosed || record.status !== 'Chấm dứt') &&
    (!province || sameProvince(record.province, province)) &&
    (!status || record.status === status) &&
    terms.every(term => record.searchText.includes(term))
  );
}
function icon(type,status,size=26){if(status==='Chấm dứt')return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" role="img" aria-label="Đã chấm dứt"><circle cx="16" cy="16" r="14" fill="#dc2626" stroke="white" stroke-width="2"/><rect x="7" y="13" width="18" height="6" rx="1" fill="white"/></svg>`;const i=Math.max(0,TYPES.indexOf(type)),paths=['<circle cx="16" cy="16" r="12"/>','<polygon points="16,3 30,28 2,28"/>','<rect x="4" y="4" width="24" height="24"/>','<polygon points="16,2 28,9 28,23 16,30 4,23 4,9"/>','<path d="M2 11 16 3 30 11ZM4 27h24v3H4ZM5 15h4v9H5ZM14 15h4v9h-4ZM23 15h4v9h-4Z"/>'];return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" role="img" aria-label="${type}"><g fill="${COLORS[i]}" stroke="white" stroke-width="2" stroke-linejoin="round">${paths[i]}</g></svg>`;}
function closePopup(){if(popup)popup.remove();popup=null;}
function showPoint(r){if(!map||!located(r))return;closePopup();const el=document.createElement('div');el.className='popup';const title=document.createElement('h3'),type=document.createElement('p'),address=document.createElement('p'),status=document.createElement('p'),route=document.createElement('a');title.textContent=r.name;type.textContent=r.type;address.textContent=[r.address,r.ward,r.province].filter(Boolean).join(' · ');status.textContent=r.status;status.className='status'+(r.status==='Chấm dứt'?' closed':'');route.textContent='Chỉ đường bằng Google Maps';route.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(r.lat+','+r.lng);route.target='_blank';route.rel='noopener noreferrer';el.append(title,type,address,status,route);if(r.expires){const expires=document.createElement('p');expires.className='hint';expires.textContent='Ngày hết hạn theo dữ liệu: '+r.expires;el.insertBefore(expires,route);}popup=new maplibregl.Popup({offset:18}).setLngLat([r.lng,r.lat]).setDOMContent(el).addTo(map);}
function render(){const matches=matchingRecords(),rows=matches.filter(r=>selected.has(r.type));$('networks').innerHTML='';for(const t of TYPES){const label=document.createElement('label');label.className='network'+(selected.has(t)?'':' off');const input=document.createElement('input');input.type='checkbox';input.checked=selected.has(t);input.setAttribute('aria-label',t);input.onchange=()=>{if(input.checked)selected.add(t);else selected.delete(t);render();};const symbol=document.createElement('span');symbol.innerHTML=icon(t,'',22);const name=document.createElement('span');name.className='label';name.textContent=t;const count=document.createElement('b');count.textContent=matches.filter(r=>r.type===t).length;label.append(input,symbol,name,count);$('networks').append(label);}const points=rows.filter(located);$('coverage').textContent=points.length+' điểm có vị trí · '+(rows.length-points.length)+' điểm chưa có tọa độ';$('resultCount').textContent='Danh sách kết quả ('+rows.length+')';$('resultList').innerHTML='';rows.forEach(r=>{const b=document.createElement('button');b.className='result';const n=document.createElement('strong'),a=document.createElement('small');n.textContent=r.name;a.textContent=r.address+(located(r)?'':' · Chưa có tọa độ');b.append(n,a);b.onclick=()=>{if(!located(r)){toast('Điểm này chưa có tọa độ xác nhận.');return;}userMoved=true;map.flyTo({center:[r.lng,r.lat],zoom:15,pitch:40});showPoint(r);};$('resultList').append(b);});closePopup();if(!ready)return;const wanted=new Set(points.map(r=>r.id));for(const [id,entry]of markers)if(!wanted.has(id)){entry.marker.remove();markers.delete(id);}for(const r of points){let entry=markers.get(r.id);if(!entry){const el=document.createElement('button');el.type='button';el.className='marker';const marker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([r.lng,r.lat]).addTo(map);entry={marker,el,record:r};el.onclick=e=>{e.stopPropagation();showPoint(entry.record);};markers.set(r.id,entry);}entry.record=r;entry.el.innerHTML=icon(r.type,r.status,30);entry.el.title=r.name+' · '+r.type+' · '+r.status;entry.el.dataset.pointId=r.id;entry.el.dataset.shape=r.status==='Chấm dứt'?'no-entry':TYPES.indexOf(r.type)===4?'bank':['circle','triangle','square','hexagon'][TYPES.indexOf(r.type)];entry.marker.setLngLat([r.lng,r.lat]);}map.getSource('points').setData({type:'FeatureCollection',features:points.map(r=>({type:'Feature',geometry:{type:'Point',coordinates:[r.lng,r.lat]},properties:{}}))});}
function normalizePublic(data){if(!data||data.schema!==1||!Array.isArray(data.records))throw Error('Dữ liệu công khai không hợp lệ.');const seen=new Set();return data.records.slice(0,10000).filter(r=>{if(!r||typeof r.id!=='string'||seen.has(r.id)||!TYPES.includes(r.type)||!['Đang hoạt động','Tạm ngừng','Chấm dứt'].includes(r.status))return false;seen.add(r.id);return true;}).map(r=>{const o={};for(const key of ['id','name','type','province','ward','address','status','expires'])o[key]=String(r[key]??'').slice(0,700);const valid=r.lat!==null&&r.lng!==null&&Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lng))&&+r.lat>=8&&+r.lat<=24&&+r.lng>=102&&+r.lng<=118;o.lat=valid?+r.lat:null;o.lng=valid?+r.lng:null;o.searchText=searchText([o.name,o.address,o.ward,o.province].join(' '));return o;});}
function loadFeed(){if(feedLoading||Date.now()-lastFeed<5000)return;feedLoading=true;lastFeed=Date.now();$('refresh').disabled=true;$('dataStatus').textContent='Đang tải dữ liệu…';const script=document.createElement('script');let done=false;function finish(){if(done)return;done=true;clearTimeout(timer);script.remove();feedLoading=false;$('refresh').disabled=false;window.fxMapReceive=()=>{};}const timer=setTimeout(()=>{finish();$('dataStatus').textContent='Chưa kết nối được nguồn dữ liệu. Bấm Tải lại để thử.';},25000);window.fxMapReceive=data=>{try{records=normalizePublic(data);$('dataStatus').textContent='Đã cập nhật '+new Date(data.generatedAt).toLocaleString('vi-VN');render();}catch(e){$('dataStatus').textContent=e.message;}finish();};script.onerror=()=>{finish();$('dataStatus').textContent='Không tải được nguồn dữ liệu. Vui lòng thử lại.';};script.src=FEED+'?action=publicMap&callback=fxMapReceive&_='+Date.now();document.head.append(script);}
const locateButton = $('locate');
const locateLabel = locateButton.textContent;

function visibleLocationOffset() {
  const container = map.getContainer();
  const toolbar = locateButton.parentElement;
  const viewportHeight = document.documentElement.clientHeight;
  let rect = container.getBoundingClientRect();
  if (Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0) < 180) {
    container.scrollIntoView({block: 'start', behavior: 'instant'});
    rect = container.getBoundingClientRect();
  }
  const top = Math.max(rect.top, toolbar.getBoundingClientRect().bottom, 0);
  const bottom = Math.min(rect.bottom, viewportHeight);
  return [0, bottom > top ? (top + bottom) / 2 - (rect.top + rect.height / 2) : 0];
}

async function focusLocation(manual = false) {
  if (manual && locateButton.disabled) return;
  if (!map || !navigator.geolocation) {
    if (manual) toast(map ? 'Trình duyệt này không hỗ trợ định vị. Hãy thử tìm bằng địa chỉ.' : 'Bản đồ đang tải. Anh/chị thử lại sau vài giây.');
    return;
  }

  if (!manual) {
    try {
      const permission = await navigator.permissions?.query({name: 'geolocation'});
      if (permission?.state !== 'granted' || userMoved || locateButton.disabled) return;
    } catch {
      return;
    }
  } else {
    userMoved = true;
    locateButton.disabled = true;
    locateButton.textContent = '⌖ Đang định vị…';
    locateButton.setAttribute('aria-busy', 'true');
  }

  let settled = false;
  const timer = manual ? setTimeout(() => fail({code: 3}), 22000) : null;

  function finish() {
    settled = true;
    clearTimeout(timer);
    if (!manual) return;
    locateButton.disabled = false;
    locateButton.textContent = locateLabel;
    locateButton.removeAttribute('aria-busy');
  }

  function fail(error) {
    if (settled) return;
    finish();
    if (!manual) return;
    const message = {
      1: 'Trình duyệt chặn vị trí. Hãy kiểm tra quyền Vị trí của trang. Nếu mở từ Facebook, hãy mở bằng Chrome hoặc Safari.',
      2: 'Thiết bị chưa trả về vị trí. Hãy bật Dịch vụ vị trí trên thiết bị rồi thử lại.',
      3: 'Chưa nhận được vị trí. Nếu trình duyệt đang hỏi quyền, hãy chọn Cho phép rồi thử lại.'
    }[error.code];
    toast(message || 'Chưa lấy được vị trí. Hãy thử tìm bằng địa chỉ.');
  }

  function showPosition({coords}) {
    if (settled) return;
    finish();
    if (!map || (!manual && userMoved)) return;
    const {latitude, longitude, accuracy} = coords;
    const position = [longitude, latitude];
    if (userMarker) userMarker.remove();
    const element = document.createElement('div');
    element.className = 'user-location';
    element.title = 'Vị trí của bạn · sai số khoảng ' + Math.round(accuracy) + ' m';
    userMarker = new maplibregl.Marker({element}).setLngLat(position).addTo(map);
    map.flyTo({
      center: position,
      offset: manual ? visibleLocationOffset() : [0, 0],
      zoom: accuracy > 1000 ? 11 : 13,
      pitch: 25
    });
    if (manual) toast(element.title);
  }

  function requestPosition(highAccuracy) {
    try {
      navigator.geolocation.getCurrentPosition(showPosition, error => {
        if (settled) return;
        if (manual && !highAccuracy && (error.code === 2 || error.code === 3)) {
          requestPosition(true);
          return;
        }
        fail(error);
      }, {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 12000 : 7000,
        maximumAge: highAccuracy ? 0 : 60000
      });
    } catch (error) {
      fail(error);
    }
  }

  requestPosition(false);
}
// Điểm đặt nhãn tham chiếu, tọa độ theo thứ tự [kinh độ, vĩ độ].
const MAP_LABELS = [
  {name: 'Quần đảo Hoàng Sa', position: [112.0, 16.55]},
  {name: 'Quần đảo Trường Sa', position: [114.4, 9.25]},
  {name: 'Biển Đông', position: [111.0, 13.0], sea: true},
];

function addMapLabels() {
  for (const {name, position, sea} of MAP_LABELS) {
    const element = document.createElement('span');
    element.className = sea ? 'map-label map-label-sea' : 'map-label';
    element.textContent = name;
    new maplibregl.Marker({element, pitchAlignment: 'viewport', rotationAlignment: 'viewport'})
      .setLngLat(position)
      .addTo(map);
  }
}

async function init(){await GEO_READY;const names=GEO.provinces.features.map(f=>f.properties.name).sort((a,b)=>a.localeCompare(b,'vi'));names.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;$('province').append(o);});map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',center:[107,11.02],zoom:7.3,pitch:48,bearing:-12});if(window.ResizeObserver){const observer=new ResizeObserver(()=>requestAnimationFrame(()=>map&&map.resize()));observer.observe($('map').parentElement);}map.addControl(new maplibregl.NavigationControl(),'top-right');map.addControl(new maplibregl.ScaleControl(),'bottom-right');map.on('dragstart',()=>userMoved=true);map.on('load',()=>{addMapLabels();map.addSource('provinces',{type:'geojson',data:GEO.provinces});map.addLayer({id:'province-fill',type:'fill',source:'provinces',paint:{'fill-color':'#42a789','fill-opacity':.1}});map.addLayer({id:'province-line',type:'line',source:'provinces',paint:{'line-color':'#267763','line-width':1.3}});map.addSource('wards',{type:'geojson',data:GEO.wards});map.addLayer({id:'ward-line',type:'line',source:'wards',minzoom:9,paint:{'line-color':'#876cb1','line-width':1,'line-opacity':.65}});map.addLayer({id:'ward-label',type:'symbol',source:'wards',minzoom:11,layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':11},paint:{'text-color':'#4c3b60','text-halo-color':'#fff','text-halo-width':1.5}});if(map.getStyle().sources.openmaptiles&&!map.getStyle().layers.some(l=>l.type==='fill-extrusion'))map.addLayer({id:'buildings',source:'openmaptiles','source-layer':'building',type:'fill-extrusion',minzoom:14,paint:{'fill-extrusion-color':'#a1c3af','fill-extrusion-height':['coalesce',['get','render_height'],5],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.7}});map.addSource('points',{type:'geojson',data:{type:'FeatureCollection',features:[]}});map.addLayer({id:'heat-layer',source:'points',type:'heatmap',layout:{visibility:'none'},paint:{'heatmap-radius':28,'heatmap-opacity':.65}});ready=true;render();focusLocation();});map.on('error',()=>{if(!ready)$('coverage').textContent='Nền bản đồ chưa tải được. Danh sách điểm vẫn dùng được.';});loadFeed();render();}
const searchResults = $('resultCount').parentElement;
let resultsOpenBeforeSearch;

function renderSearch() {
  if (searchText($('q').value)) {
    resultsOpenBeforeSearch ??= searchResults.open;
    searchResults.open = true;
  } else if (resultsOpenBeforeSearch !== undefined) {
    searchResults.open = resultsOpenBeforeSearch;
    resultsOpenBeforeSearch = undefined;
  }
  render();
}

$('q').addEventListener('input', renderSearch);
['province','status','showClosed'].forEach(id=>$(id).addEventListener('change',render));
$('selectAll').onclick=()=>{selected=new Set(TYPES);render();};
$('reset').onclick=()=>{$('q').value='';$('province').value='';$('status').value='';$('showClosed').checked=false;selected=new Set(TYPES);renderSearch();};
$('refresh').onclick=loadFeed;$('locate').onclick=()=>focusLocation(true);
document.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>{if(!map)return;userMoved=true;if(b.dataset.region==='vn')map.fitBounds([[102,6],[118,24]],{padding:40,pitch:0,bearing:0});else map.flyTo({center:b.dataset.region==='hcm'?[106.72,10.86]:[107.15,11.15],zoom:b.dataset.region==='hcm'?10:9,pitch:45});});$('tilt').onclick=()=>{if(map)map.easeTo({pitch:map.getPitch()>10?0:55,bearing:map.getPitch()>10?0:-15});};$('wards').onclick=()=>{if(!ready)return;showWards=!showWards;['ward-line','ward-label'].forEach(k=>map.setLayoutProperty(k,'visibility',showWards?'visible':'none'));$('wards').textContent='Xã/phường: '+(showWards?'bật':'tắt');};$('heat').onclick=()=>{if(!ready)return;showHeat=!showHeat;map.setLayoutProperty('heat-layer','visibility',showHeat?'visible':'none');$('heat').textContent='Mật độ: '+(showHeat?'bật':'tắt');};
const box = $('map').parentElement;
const fullscreenButton = $('fullscreen');
const touchLayout = matchMedia('(max-width: 720px), (pointer: coarse)');
const fullscreenBackground = document.querySelectorAll('.filters, .address, .mapgrid > aside, footer');
let mapScrollTop = 0;

function fullscreenChanged() {
  (document.fullscreenElement === box ? box : document.body).append($('toast'));
  const active = document.fullscreenElement === box || box.classList.contains('map-fullscreen');
  fullscreenButton.textContent = active ? '⛶ Thoát toàn màn hình' : '⛶ Toàn màn hình';
  fullscreenButton.setAttribute('aria-pressed', String(active));
  if (map) requestAnimationFrame(() => map.resize());
}

function setMapOverlay(active) {
  const root = document.documentElement;
  if (active) {
    mapScrollTop = window.scrollY;
    root.style.setProperty('--map-scroll-top', -mapScrollTop + 'px');
  }
  box.classList.toggle('map-fullscreen', active);
  root.classList.toggle('map-scroll-locked', active);
  fullscreenBackground.forEach(element => { element.inert = active; });
  if (!active) {
    root.style.removeProperty('--map-scroll-top');
    window.scrollTo(0, mapScrollTop);
  }
  fullscreenChanged();
  fullscreenButton.focus({preventScroll: true});
}

fullscreenButton.onclick = async () => {
  if (box.classList.contains('map-fullscreen')) {
    setMapOverlay(false);
    return;
  }
  if (document.fullscreenElement === box) {
    await document.exitFullscreen();
    return;
  }
  if (!touchLayout.matches && document.fullscreenEnabled && box.requestFullscreen) {
    try {
      await box.requestFullscreen();
      return;
    } catch {
      // Use the page overlay when the browser denies fullscreen.
    }
  }
  setMapOverlay(true);
};
document.addEventListener('fullscreenchange', fullscreenChanged);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && box.classList.contains('map-fullscreen')) setMapOverlay(false);
});
let lastAddress=0;$('addressForm').onsubmit=async e=>{e.preventDefault();if(Date.now()-lastAddress<1500)return;lastAddress=Date.now();const q=$('address').value.trim();if(q.length<4)return;$('findAddress').disabled=true;$('addressResults').innerHTML='';try{const r=await fetch('https://photon.komoot.io/api/?limit=5&bbox=102,8,118,24&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Dịch vụ địa chỉ đang bận.');const data=await r.json();addressResults=(data.features||[]).filter(f=>f.geometry?.coordinates&&String(f.properties?.countrycode||'VN').toUpperCase()==='VN').map(f=>({lat:+f.geometry.coordinates[1],lng:+f.geometry.coordinates[0],label:[f.properties.name,[f.properties.housenumber,f.properties.street].filter(Boolean).join(' '),f.properties.city,f.properties.state].filter(Boolean).join(', ')})).filter(r=>Number.isFinite(r.lat)&&Number.isFinite(r.lng));addressResults.forEach(r=>{const b=document.createElement('button');b.type='button';b.textContent=r.label;b.onclick=()=>showAddress(r);$('addressResults').append(b);});if(addressResults.length===1)showAddress(addressResults[0]);if(!addressResults.length)toast('Chưa tìm thấy. Thử thêm số nhà, tên đường và tỉnh/thành.');}catch(err){toast(err.message||'Không tìm được địa chỉ.');}finally{$('findAddress').disabled=false;}};
function showAddress(r){if(!ready)return toast('Bản đồ đang tải, hãy chọn lại sau ít giây.');userMoved=true;if(addressMarker)addressMarker.remove();const el=document.createElement('div');el.className='search-pin';el.innerHTML='<svg width="38" height="48" viewBox="0 0 38 48" aria-label="Địa chỉ tìm kiếm"><path d="M19 46C16 41 2 27 2 19a17 17 0 1 1 34 0c0 8-14 22-17 27Z" fill="#d73e53" stroke="white" stroke-width="2"/><circle cx="19" cy="19" r="6" fill="white"/></svg>';const text=document.createElement('p');text.textContent=r.label;addressMarker=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([r.lng,r.lat]).setPopup(new maplibregl.Popup({offset:38}).setDOMContent(text)).addTo(map);addressMarker.togglePopup();map.flyTo({center:[r.lng,r.lat],zoom:15,pitch:35});}
$('clearAddress').onclick=()=>{if(addressMarker)addressMarker.remove();addressMarker=null;$('addressResults').innerHTML='';$('address').value='';};init().catch(e=>{$('dataStatus').textContent='Không tải được bản đồ: '+e.message;});
