let selectedRole = null;

// 버튼
function addButtonToActionBar() {
  const actionBar = document.querySelector('div[data-testid="composer-trailing-actions"]');
  if (!actionBar) return;

  const btn = document.createElement('button');
  btn.innerHTML = '💡';
  btn.id = 'my-prompt-button';
  btn.title = '역할/옵션 생성';

  btn.style.all = 'unset';
  btn.style.width = '36px';
  btn.style.height = '36px';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.borderRadius = '50%';
  btn.style.backgroundColor = '#ffffff';
  btn.style.border = '1px solid #d9d9e3';
  btn.style.cursor = 'pointer';
  btn.style.marginRight = '2px';
  btn.style.fontSize = '18px';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    getPrompt();

    btn.style.background = '#f0f0f0';

    setTimeout(() => {
    btn.style.backgroundColor = '#ffffff';
    }, 150);
  });

  const firstChild = actionBar.firstChild; // 버튼 영역 안 가장 앞쪽
  if (firstChild) {
    actionBar.insertBefore(btn, firstChild);
  } else {
    actionBar.appendChild(btn);
  }
}

// 버튼 클릭 시 
async function getPrompt() {
  const input = document.querySelector('#prompt-textarea');
  if (!input) {
    console.error("프롬프트 입력창을 찾을 수 없습니다.");
    return;
  }

  const text = input.innerText.trim(); // 앞뒤 공백 없앰
  if (!text) {
    alert("질문을 먼저 입력해주세요!");
    return;
  }

  try {
    if (!document.getElementById('role-toolbar-ui')) {
      addToolbarStyleUI();
    }

    showToolbarLoading(true);

    const res = await fetch("https://ep-51ey.onrender.com/generate", {  //generate 함수 사용
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text })
    });

    const data = await res.json();
    const parsed = parseGPTResponse(data.result);
    parsed.roles.unshift("선택 없음"); //역할 리스트 맨 앞에 "선택 없음" 추가

    // 처음이면
    if (!document.getElementById('role-toolbar-ui')) {
      addToolbarStyleUI();
    }

    updateToolbarUI(parsed.roles, parsed.options);
  } catch (err) {
    console.error("GPT 서버 요청 실패:", err);
    alert("GPT 서버에 연결할 수 없습니다.");
  } finally {
    showToolbarLoading(false);
  }
}

// GPT 응답 텍스트에서 역할/옵션 나누기
function parseGPTResponse(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean); // 공백 제거
  const roles = [];
  const options = [];
  let section = null; // 읽고 있는 줄 확인

  lines.forEach(line => {
    if (line.startsWith('[역할]')) section = 'roles';
    else if (line.startsWith('[세부 옵션 항목]')) section = 'options';
    else if (line.startsWith('- ')) {
      if (section === 'roles') roles.push(line.slice(2));  // '-'를 잘라서 배열에 넣음
      else if (section === 'options') options.push(line.slice(2));
    }
  });

  return { roles, options };
}

// 역할/옵션 UI 생성
function addToolbarStyleUI() {
  const promptArea = document.querySelector('#prompt-textarea');
  if (!promptArea) return;

  const toolbar = document.createElement('div');
  toolbar.id = 'role-toolbar-ui';
  toolbar.style.position = 'sticky'; // 고정
  toolbar.style.bottom = '100%'; // 입력창 바로 위에 배치
  toolbar.style.zIndex = '10000';
  toolbar.style.backgroundColor = '#ffffff';
  toolbar.style.padding = '4px 12px 12px 12px';
  toolbar.style.border = 'none';
  toolbar.style.borderBottom = '1px solid #ddd';
  toolbar.style.marginBottom = '12px';
  toolbar.style.maxWidth = '100%'; 

  const overlay = document.createElement('div');
  overlay.id = 'toolbar-loading-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = '#ffffff';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10001';
  overlay.style.fontSize = '16px';
  overlay.innerHTML = '<span>⏳ 생성 중...</span>';
  overlay.style.display = 'none';

  toolbar.appendChild(overlay);

  const toggleContainer = document.createElement('div');
  toggleContainer.style.width = '100%';
  toggleContainer.style.display = 'flex';
  toggleContainer.style.justifyContent = 'center';
  toggleContainer.style.alignItems = 'center'; 
  toggleContainer.style.height = '20px';   
  toggleContainer.style.padding = '0';
  toggleContainer.style.margin = '0';

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toolbar-toggle-btn';
  toggleBtn.innerText = '⌄';
  toggleBtn.style.background = 'transparent';
  toggleBtn.style.border = 'none';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.fontSize = '18px';
  toggleBtn.style.color = '#555';
  toggleBtn.style.userSelect = 'none';
  toggleBtn.style.margin = '0';
  toggleBtn.style.padding = '0';
  toggleBtn.style.lineHeight = '1'; 
  toggleBtn.style.display = 'inline-block';

  toggleContainer.appendChild(toggleBtn);
  toolbar.appendChild(toggleContainer);

  let isToolbarVisible = true;

  toggleBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    isToolbarVisible = !isToolbarVisible;

    const contentElements = Array.from(toolbar.children).filter(el => el !== toggleContainer);

    contentElements.forEach(el => {
      if (el.getAttribute('role') === 'options') {
        el.style.display = isToolbarVisible ? 'flex' : 'none';
      } else {
        el.style.display = isToolbarVisible ? 'block' : 'none';
      }
    });

    toggleBtn.innerText = isToolbarVisible ? '⌄' : '⌃';
  });

  // 역할 라벨 
  const roleLabel = document.createElement('label');
  roleLabel.innerText = 'GPT의 역할 선택:';
  roleLabel.style.display = 'block';
  roleLabel.style.marginBottom = '6px';
  toolbar.appendChild(roleLabel);

  // 역할 드롭 다운
  const roleDropdownPlaceholder = document.createElement('div');
  roleDropdownPlaceholder.setAttribute("role", "dropdown");
  roleDropdownPlaceholder.style.marginBottom = '16px';
  toolbar.appendChild(roleDropdownPlaceholder);

  // 세부 옵션 라벨
  const optLabel = document.createElement('div');
  optLabel.innerText = '세부 옵션 선택:';
  optLabel.style.marginBottom = '8px';
  optLabel.style.marginTop = '8px';
  toolbar.appendChild(optLabel);

  // 세부 옵션 버튼
  const optionPlaceholder = document.createElement('div');
  optionPlaceholder.setAttribute("role", "options");

  toolbar.appendChild(optionPlaceholder);
  optionPlaceholder.style.marginBottom = '4px';
  const wrapper = promptArea?.parentElement?.parentElement; // 2개 요소 위에 wrapper 삽입
  if (wrapper) {
    wrapper.insertBefore(toolbar, wrapper.firstChild); // wrapper 가장 위에 툴바 삽입
  }
}

// 역할/옵션 UI 업데이트
function updateToolbarUI(roles, options) {
  const toolbar = document.getElementById('role-toolbar-ui');
  if (!toolbar) return;

  const dropdownWrapper = toolbar.querySelector('[role="dropdown"]'); // 역할 위치
  const optionWrapper = toolbar.querySelector('[role="options"]');    // 세부 옵션 위치
  if (!dropdownWrapper || !optionWrapper) return;

  dropdownWrapper.innerHTML = '';
  optionWrapper.innerHTML = '';

  optionWrapper.style.display = 'flex';
  optionWrapper.style.flexWrap = 'wrap';
  optionWrapper.style.gap = '12px';    
  optionWrapper.style.rowGap = '12px';  

  const dropdown = createCustomDropdown(roles, (value) => {
    selectedRole = value;
    console.log('선택된 역할:', selectedRole);
    applyRoleToPrompt(value);
  });

  dropdownWrapper.appendChild(dropdown);

  // 옵션 버튼 만들기
  options.forEach(option => {
    const btn = document.createElement('button');
    btn.innerText = option;
    btn.className = 'option-btn';
    btn.style.padding = '4px 8px';
    btn.style.border = '1px solid #bbb';
    btn.style.borderRadius = '6px';
    btn.style.background = 'white';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', (event) => { //이벤트 전파 막음
      event.preventDefault();
      event.stopPropagation();

      const promptInput = document.querySelector('#prompt-textarea');
      if (!promptInput) {
        console.error('prompt-textarea 를 찾을 수 없습니다.');
        return;
      }

      // 입력값을 줄 단위로 나눔
      let lines = (promptInput.innerText || '').split('\n');
      console.log('현재 입력창 줄 목록:', lines);

      if (btn.classList.contains('selected')) {
        // 선택 해제
        btn.classList.remove('selected');
        btn.style.background = 'white';
        console.log(`옵션 해제됨: ${option}`);

        lines = lines.filter(line => line.trim() !== option);
        console.log(`옵션 줄 제거됨: ${option}`);

      } else {
        // 👉 선택
        btn.classList.add('selected');
        btn.style.background = '#d0e7ff';
        console.log(`옵션 선택됨: ${option}`);

        lines.push(option);
        console.log('옵션 줄 추가됨:', option);
      }

      promptInput.innerHTML = '';
      for (const line of lines) {
        const div = document.createElement('div');
        div.textContent = line;
        promptInput.appendChild(div);
      }

      console.log('최종 textarea 내용 업데이트 완료:', lines);
    });
    optionWrapper.appendChild(btn);
  });

  const regenBtn = document.createElement('button');
  regenBtn.innerText = '🔄';
  regenBtn.title = '옵션 재생성';
  regenBtn.className = 'regen-option-btn';
  regenBtn.style.padding = '4px 8px';
  regenBtn.style.border = '1px solid #bbb';
  regenBtn.style.width = '36px';    
  regenBtn.style.height = '36px';
  regenBtn.style.borderRadius = '50%'; 
  regenBtn.style.background = 'white';
  regenBtn.style.cursor = 'pointer';
  regenBtn.title = '옵션 새로 생성';

  regenBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    regenBtn.style.backgroundColor = '#f0f0f0';

    showToolbarLoading(true);

    try {
      await regenerateOptions();
    } catch (err) {
      console.error("옵션 재생성 실패:", err);
      alert("옵션을 다시 불러오는 중 문제가 발생했습니다.");
    } finally {
      showToolbarLoading(false); 
      regenBtn.style.backgroundColor = '#ffffff';
    }
  });

  optionWrapper.appendChild(regenBtn);
}

// 드롭다운 생성 함수
function createCustomDropdown(options, onSelect) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';  // 상대 위치로 설정
  wrapper.style.width = '360px';

  const display = document.createElement('div'); // 드롭 다운 상단
  display.textContent = options[0]; 
  selectedRole = options[0];
  display.style.padding = '6px 10px';
  display.style.border = '1px solid #ccc';
  display.style.borderRadius = '6px';
  display.style.backgroundColor = 'white';
  display.style.cursor = 'pointer';
  display.style.display = 'flex';
  display.style.alignItems = 'center';
  display.style.justifyContent = 'space-between';
  display.style.fontSize = '14px';

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg"); // 드롭다운 화살표
  arrow.setAttribute("width", "14");
  arrow.setAttribute("height", "14");
  arrow.setAttribute("viewBox", "0 0 24 24");
  arrow.setAttribute("fill", "none");
  arrow.setAttribute("stroke", "#666");
  arrow.setAttribute("stroke-width", "2");
  arrow.setAttribute("stroke-linecap", "round");
  arrow.setAttribute("stroke-linejoin", "round");
  arrow.innerHTML = `<polyline points="6 9 12 15 18 9" />`;

  display.appendChild(arrow);

  const list = document.createElement('ul');  // 클릭할 때 아래로 펼쳐질 항목
  list.style.position = 'absolute';  // 위치 고정
  list.style.top = '100%';
  list.style.left = '0';
  list.style.right = '0';
  list.style.zIndex = '1000';
  list.style.background = 'white';
  list.style.border = '1px solid #ccc';
  list.style.borderRadius = '6px';
  list.style.margin = '4px 0 0';
  list.style.padding = '0';
  list.style.listStyle = 'none';
  list.style.display = 'none'; 
  list.style.maxHeight = '180px';
  list.style.overflowY = 'auto';

  options.forEach(option => {  // 생성된 역할을 list에 추가
    const item = document.createElement('li');
    item.textContent = option;
    item.style.padding = '6px 10px';
    item.style.cursor = 'pointer';
    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      display.childNodes[0].textContent = option; 
      list.style.display = 'none';
      selectedRole = option;
      onSelect(option);
    });
    item.addEventListener('mouseover', () => item.style.background = '#eee');
    item.addEventListener('mouseout', () => item.style.background = 'white');
    list.appendChild(item);
  });

  display.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    list.style.display = list.style.display === 'none' ? 'block' : 'none';  // 목록 접고 피기
  });

  wrapper.appendChild(display);
  wrapper.appendChild(list);
  return wrapper;
}

function applyRoleToPrompt(selectedRole) {
  const promptInput = document.querySelector('#prompt-textarea');
  if (!promptInput) {
    console.error('prompt-textarea를 찾을 수 없습니다.');
    return;
  }

  let lines = (promptInput.innerText || '').split('\n');
  console.log('현재 입력창 줄 목록 (역할 적용 전):', lines);

  // 기존 역할 줄이 있으면 제거 (너는 ... 이야 로 시작하는 줄)
  lines = lines.filter(line => !/^너는 .+ 이야$/.test(line.trim()));

  if (selectedRole !== '선택 없음') {
    const roleLine = `너는 ${selectedRole} 이야`;
    lines.unshift(roleLine);
    console.log('새로운 역할 추가됨:', roleLine);
  } else {
    console.log('역할 없음 → 역할 줄 제거만');
  }

  // 입력창 갱신
  promptInput.innerHTML = '';
  for (const line of lines) {
    const div = document.createElement('div');
    div.textContent = line.trim();
    promptInput.appendChild(div);
  }

  console.log('최종 textarea 내용 (역할 적용 후):', lines);
}

async function regenerateOptions() {
  const promptInput = document.querySelector('#prompt-textarea');
  if (!promptInput) return;

  const promptText = promptInput.innerText.trim();
  const allOptionBtns = Array.from(document.querySelectorAll('.option-btn'));

  const selectedOptions = allOptionBtns
    .filter(btn => btn.classList.contains('selected'))
    .map(btn => btn.innerText.trim());

  const unselectedOptions = allOptionBtns
    .filter(btn => !btn.classList.contains('selected'))

  const optionsToGenerate = Math.max(0, 5 - selectedOptions.length);
  
  unselectedOptions.forEach(btn => btn.remove());

  // 서버에 요청
  const res = await fetch("https://ep-51ey.onrender.com/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: promptText,
      previous_options: [...selectedOptions, ...unselectedOptions.map(b => b.innerText.trim())] // 모두 전달해야 제외 처리됨
    })
  });

  const data = await res.json();
  const parsed = parseGPTResponse(data.result);

  const newOptions = parsed.options
    .filter(opt => !selectedOptions.includes(opt))
    .slice(0, optionsToGenerate); // 여기서 개수 제한

  const optionWrapper = document.querySelector('[role="options"]');
  const regenBtn = document.querySelector('.regen-option-btn');

  // 새 옵션만 추가
  for (const option of newOptions) {
    const btn = document.createElement('button');
    btn.innerText = option;
    btn.className = 'option-btn';
    btn.style.padding = '4px 8px';
    btn.style.border = '1px solid #bbb';
    btn.style.borderRadius = '6px';
    btn.style.background = 'white';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      let lines = (promptInput.innerText || '').split('\n');

      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        btn.style.background = 'white';
        lines = lines.filter(line => line.trim() !== option);
      } else {
        btn.classList.add('selected');
        btn.style.background = '#d0e7ff';
        lines.push(option);
      }

      promptInput.innerHTML = '';
      for (const line of lines) {
        const div = document.createElement('div');
        div.textContent = line;
        promptInput.appendChild(div);
      }
    });

    optionWrapper.insertBefore(btn, regenBtn);
  }
}

function showToolbarLoading(show = true) {
    const overlay = document.querySelector('#toolbar-loading-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }


const observer = new MutationObserver(() => {
  const actionBar = document.querySelector('div[data-testid="composer-trailing-actions"]'); // 기존 gpt 버튼 감지
  if (actionBar && !document.getElementById('my-prompt-button')) {
    addButtonToActionBar();
  }
});

window.addEventListener('load', () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});



