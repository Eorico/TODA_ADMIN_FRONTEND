document.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "../html/admin_login.html";
  }

});
console.log("LOGIN STATUS:", localStorage.getItem("isLoggedIn"));
/* ── DATA ── */
const members = [
  {name:"Elena V. Santos",   joined:"Oct 2021",body:"MAM-2024-042",status:"active",    contrib:"₱350.00",   time:"Today, 08:45 AM"},
  {name:"Ricardo P. Magno",  joined:"Jan 2019",body:"MAM-2024-118",status:"suspended", contrib:"₱1,200.00", time:"Mar 12, 2024"},
  {name:"Julian C. Dela Cruz",joined:"Aug 2023",body:"MAM-2024-850",status:"inactive", contrib:"₱0.00",     time:"No records"},
  {name:"Maria Fe A. Lopez", joined:"Feb 2022",body:"MAM-2024-099",status:"active",    contrib:"₱350.00",   time:"Yesterday, 04:12 PM"},
  {name:"Benito R. Tomas",   joined:"Mar 2020",body:"MAM-2024-201",status:"active",    contrib:"₱700.00",   time:"Today, 07:30 AM"},
  {name:"Carmen S. Villanueva",joined:"Jul 2018",body:"MAM-2024-310",status:"suspended",contrib:"₱900.00", time:"Feb 28, 2024"},
  {name:"Dennis M. Aquino",  joined:"Dec 2021",body:"MAM-2024-455",status:"inactive",  contrib:"₱0.00",     time:"No records"},
];

const logout = document.querySelector(".btn-logout")

logout.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = '../html/admin_login.html';
});

function initials(name){return name.split(' ').slice(0,2).map(n=>n[0]).join('')}

function renderRoster(filter=''){
  const tbody = document.getElementById('roster-body');
  const list  = filter ? members.filter(m=>m.name.toLowerCase().includes(filter.toLowerCase())||m.body.toLowerCase().includes(filter.toLowerCase())) : members;
  tbody.innerHTML = list.map((m,i)=>`
    <tr>
      <td>
        <div class="member-identity">
          <div class="member-avatar"><span class="initials">${initials(m.name)}</span></div>
          <div>
            <div class="member-name">${m.name}</div>
            <div class="member-joined">Joined ${m.joined}</div>
          </div>
        </div>
      </td>
      <td><span class="body-badge">${m.body}</span></td>
      <td><span class="status-badge ${m.status}">${m.status.toUpperCase()}</span></td>
      <td>
        <div class="contrib-cell">${m.contrib}</div>
        <div class="contrib-time">${m.time}</div>
      </td>
      <td>
        <button class="action-menu-btn" onclick="openModal(${i})" title="Edit member">⋮</button>
      </td>
    </tr>
  `).join('');
}

/* ── PAGE NAV ── */
function switchPage(page){
  document.querySelectorAll('.nav-item').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.page===page);
  });
  document.getElementById('page-dashboard').style.display = page==='dashboard'?'block':'none';
  document.getElementById('page-members').style.display   = page==='members'  ?'block':'none';
  if(page==='members') renderRoster();
}

document.querySelectorAll('.nav-item[data-page]').forEach(btn=>{
  btn.addEventListener('click',()=>switchPage(btn.dataset.page));
});

/* ── SEARCH ── */
document.getElementById('member-search').addEventListener('input',e=>renderRoster(e.target.value));

/* ── MODAL ── */
let currentMember = null;
function openModal(idx){
  currentMember = idx;
  const m = members[idx];
  const bodyNum = m.body.split('-').pop();
  document.getElementById('modal-name').textContent   = `${m.name} (#${bodyNum})`;
  document.getElementById('modal-body').value         = bodyNum;
  document.getElementById('modal-contrib').value      = m.contrib.replace('₱','');
  const sel = document.getElementById('modal-status');
  sel.value = m.status==='active'?'Active':m.status==='inactive'?'Inactive':'Suspended (Violation)';
  document.getElementById('edit-modal').classList.add('open');
}
function closeModal(){
  document.getElementById('edit-modal').classList.remove('open');
}

document.getElementById('modal-cancel').addEventListener('click',closeModal);
document.getElementById('edit-modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});

document.getElementById('modal-save').addEventListener('click',()=>{
  if(currentMember===null) return;
  const statusMap={'Active':'active','Inactive':'inactive','Suspended (Violation)':'suspended'};
  const selVal = document.getElementById('modal-status').value;
  members[currentMember].status  = statusMap[selVal]||'active';
  members[currentMember].contrib = '₱'+document.getElementById('modal-contrib').value;
  members[currentMember].time    = 'Just now';
  closeModal();
  renderRoster(document.getElementById('member-search').value);
});

/* ── INIT ── */
switchPage('dashboard');