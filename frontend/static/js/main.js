(function () {
  // ===== 问题库 =====
  const questionBank = [
    "列出本学期的督导评价任务及其状态",
    "有哪些督导评价任务即将在7天内截止？",
    "展示本学期所有任务的每日评价提交量趋势",
    "对比本学期本科生和研究生课程的评教平均分",
    "院系排名：本学期督导评教平均分/督导评价次数/课程覆盖率/教师覆盖率",
    "教师排名：本学期督导评教平均分Top10",
    "教师排名：本学期督导评价次数Top10",
    "教师预警：本学期督导评教平均分Bottom10",
    "课程推荐：本学期督导评教平均分Top10",
    "课程预警：本学期督导评教平均分Bottom10",
    "统计本学期各位督导的评价次数和平均分",
    "统计本学期督导的参评率",
    "统计本学期督导评价对院系、课程、教师的覆盖率",
    "分析不同职称（教授、副教授、讲师）教师群体的教学质量差异",
    "筛选未来两周内所有新进教师（<=2年）的课程",
    "统计分析被评课程中，期初、期中、期末课程的占比",
    "统计本学期未被评的教师数量有多少？",
    "统计本学期未被评的课程数量有多少？", 
    "统计本学期督导评价分数超过90分的有多少节课？并生成被评课程明细",
    "统计本学期督导评价分数低于80分的有多少节课？并生成被评课程明细",
    "统计本学期督导评价各分值分布数量"
  ];

  // ===== 简工具 =====
  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // ===== 已问过的问题跟踪 =====
  let askedQuestions = [];
  function loadAskedQuestions() {
    const saved = localStorage.getItem("asked_questions");
    return saved ? JSON.parse(saved) : [];
  }
  function saveAskedQuestions() {
    localStorage.setItem("asked_questions", JSON.stringify(askedQuestions));
  }
  
  // 初始化已问过的问题
  askedQuestions = loadAskedQuestions();
  
  // ===== 问题推荐功能 =====
  function getRandomUnaskedQuestions(count = 3) {
    // 过滤出未问过的问题
    const unaskedQuestions = questionBank.filter(q => !askedQuestions.includes(q));
    
    // 如果未问过的问题少于需要的数量，重置已问过的问题列表
    if (unaskedQuestions.length < count) {
      askedQuestions = [];
      saveAskedQuestions();
      return getRandomUnaskedQuestions(count);
    }
    
    // 随机排序并选择前count个问题
    const shuffled = [...unaskedQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  // 显示推荐问题
  function displayRecommendedQuestions() {
    const recommendationsContainer = document.getElementById("recommendations-container");
    if (!recommendationsContainer) return;
    
    // 清空现有推荐
    recommendationsContainer.innerHTML = "";
    
    // 获取推荐问题
    const recommendedQuestions = getRandomUnaskedQuestions(3);
    
    // 创建并添加推荐问题元素
    recommendedQuestions.forEach((question, index) => {
      const delay = index * 100; // 错开动画时间
      
      const questionElement = document.createElement("div");
      questionElement.className = "recommendation-item opacity-0 transform translate-y-2 transition-all duration-300";
      questionElement.style.transitionDelay = `${delay}ms`;
      
      questionElement.innerHTML = `
        <button class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-blue-50 transition-colors border border-gray-100"
                data-question="${esc(question)}">
          <div class="flex items-start">
            <div class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.25">
              <i class="fa fa-lightbulb-o text-xs"></i>
            </div>
            <p class="text-gray-700">${esc(question)}</p>
          </div>
        </button>
      `;
      
      recommendationsContainer.appendChild(questionElement);
      
      // 添加点击事件
      questionElement.querySelector("button").addEventListener("click", function() {
        if (isWaitingForResponse) return; // 如果正在等待响应，不处理点击
        
        const q = this.getAttribute("data-question") || "";
        inputEl.value = q;
        sendMessage();
      });
      
      // 触发动画
      setTimeout(() => {
        questionElement.classList.remove("opacity-0", "translate-y-2");
      }, 10);
    });
  }
  
  // ===== DOM =====
  var chatContainer = document.getElementById("chat-container");
  var inputEl = document.getElementById("user-input");
  var sendBtn = document.getElementById("send-btn");
  var abortBtn = document.getElementById("abort-btn");
  
  // 状态管理
  var isWaitingForResponse = false;
  var abortController = null;

  // 预设按钮
  document.querySelectorAll(".preset-question-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (isWaitingForResponse) return; // 如果正在等待响应，不处理点击
      
      var q = this.getAttribute("data-question") || "";
      inputEl.value = q;
      sendMessage();
    });
  });

  // 回车发送
  inputEl.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !isWaitingForResponse) {
      sendMessage();
    }
  });
  sendBtn.addEventListener("click", function() {
    if (!isWaitingForResponse) {
      sendMessage();
    }
  });

  // 中止按钮点击事件
  abortBtn.addEventListener("click", function() {
    if (abortController) {
      abortController.abort();
      abortController = null;
      
      // 立即停止时钟和进度条
      stopClock();
      
      // 删除正在生成的机器人对话框（如果存在）
      var aiContent = document.getElementById("ai-content");
      if (aiContent && aiContent.closest(".msg-appear")) {
        var dialogContainer = aiContent.closest(".msg-appear");
        if (dialogContainer.parentNode) {
          dialogContainer.parentNode.removeChild(dialogContainer);
        }
      }
      
      // 恢复UI状态
      restoreUIState();
      
      // 更新推荐问题
      displayRecommendedQuestions();
    }
  });


  // ===== 会话ID =====
  var sessionId = localStorage.getItem("rag_session_id");
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("rag_session_id", sessionId);
  }

  // ===== UI 辅助 =====
  function appendUserBubble(text) {
      var html =
        '<div class="flex items-start justify-end msg-appear">' + // 注意：原代码多了一个"justify"，去掉重复的
          // 核心改造：补充内边距、最大宽度、边角样式、文字颜色
          '<div class="bg-[var(--secondary-color)] text-black rounded-lg rounded-tr-none px-4 py-3 max-w-[85%]">' +
            "<p>" + esc(text) + "</p>" +
          "</div>" +
          '<div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 ml-3">' + // 修正："items items-center"重复，去掉一个
            '<i class="fa fa-user"></i>' +
          "</div>" +
        "</div>";
      chatContainer.insertAdjacentHTML("beforeend", html);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }


  function appendBotContainer() {
      var html =
        '<div class="flex items-start msg-appear">' +
          // 头像尺寸从固定w-8 h-8改为clamp自适应（和HTML中保持一致）
          '<div class="flex-shrink-0 w-[clamp(2rem,5vw,2.5rem)] h-[clamp(2rem,5vw,2.5rem)] rounded-full overflow-hidden mr-3">' +
            '<img src="/static/images/robot.png">' +
          "</div>" +
          // 气泡样式保持不变（已正确使用背景色和弹性限制）
          '<div class="bg-[var(--neutral-color)] rounded-lg rounded-tl-none px-4 py-3 max-w-[85%]" id="ai-content"></div>' +
        "</div>";
      var wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      var node = wrapper.firstChild;
      chatContainer.appendChild(node);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      return node.querySelector("#ai-content");
    }

  // ==== 时钟进度（SVG） ====
  var _clockTimer = null;
  var _clockPos = 0;
  var _progressCounter = 0;
  var _progressTimer = null;

  function _clockSvg() {
    return (
      '<svg viewBox="0 0 24 24" width="20" height="20" class="mr-2">' +
        '<circle cx="12" cy="12" r="9" stroke="#3B82F6" stroke-width="1.5" fill="none"></circle>' +
        '<line id="clk-hour" x1="12" y1="12" x2="12" y2="7" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round" transform="rotate(0,12,12)"></line>' +
        '<line id="clk-min"  x1="12" y1="12" x2="12" y2="5" stroke="#3B82F6" stroke-width="1.2" stroke-linecap="round" transform="rotate(0,12,12)"></line>' +
      '</svg>'
    );
  }

  function startClock() {
    stopClock();
    _progressCounter = 0;
    
    var html =
      '<div class="flex items-start msg-appear" id="ai-typing">' +
        '<div class="bot-bubble flex items-center pl-0 ml-0" id="ai-typing-body">' +
          _clockSvg() + 
          '<div class="flex items-center">' +
            '<span>正在分析，请稍候</span>' +
            '<span class="progress-counter progress-counter-blue" id="progress-counter-element">0%</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    chatContainer.insertAdjacentHTML("beforeend", html);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    _clockTimer = setInterval(function(){ tickClock(); }, 2000);
    
    // 启动进度计数器
    _progressTimer = setInterval(function() {
      updateProgressCounter();
    }, 1000);
  }

  function tickClock() {
    _clockPos = (_clockPos + 1) % 12;
    var body = document.getElementById("ai-typing-body");
    if (!body) return;
    var hour = body.querySelector("#clk-hour");
    var minute = body.querySelector("#clk-min");
    if (!hour || !minute) return;
    var hourAngle = _clockPos * 30;
    var minuteAngle = _clockPos * 60;
    hour.setAttribute("transform", "rotate(" + hourAngle + ",12,12)");
    minute.setAttribute("transform", "rotate(" + minuteAngle + ",12,12)");
  }

  function updateProgressCounter() {
    var counterElement = document.getElementById("progress-counter-element");
    if (!counterElement) return;
    
    // 随机增加1-3%，但不超过95%
    _progressCounter = Math.min(99, _progressCounter + Math.floor(Math.random() * 3) + 1);
    counterElement.textContent = _progressCounter + "%";
    
    // 根据进度改变颜色
    if (_progressCounter < 30) {
      counterElement.className = "progress-counter progress-counter-blue";
    } else if (_progressCounter < 60) {
      counterElement.className = "progress-counter progress-counter-yellow";
    } else {
      counterElement.className = "progress-counter progress-counter-green";
    }
  }

  function stopClock() {
    if (_clockTimer) { clearInterval(_clockTimer); _clockTimer = null; }
    if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    _clockPos = 0;
    _progressCounter = 0;
    var el = document.getElementById("ai-typing");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

function renderAnswer(el, answer, refsHtml) {
    // 更强的 ltrim：处理普通空白 + NBSP + 窄 NBSP + 零宽 + BOM + 段分隔
    function ltrimU(s) {
        var out = String(s);
        // 统一 NBSP/窄 NBSP 为普通空格
        out = out.replace(/\u00A0|\u202F/g, ' ');
        // 去掉零宽字符/BOM
        out = out.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
        // 段分隔替换成换行
        out = out.replace(/[\u2028\u2029]/g, '\n');
        // 去掉前导空白（含 \n、\r、\t、空格）
        var i = 0;
        while (i < out.length) {
        var ch = out.charAt(i);
        if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') i++;
        else break;
        }
        return out.slice(i);
    }

    // 先做文本级清理（含去 思考块）
    var a = ltrimU(answer)
        .replace(/<\s*think\b[^>]*>[\s\S]*?<\s*\/\s*think\s*>/gi, '')
        .replace(/&lt;\s*think\b[^&]*&gt;[\s\S]*?&lt;\s*\/\s*think\s*&gt;/gi, '');

    // 处理加粗文本 **内容** -> <strong>内容</strong>
    var html = a.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 换行 -> <br>
    html = html.split('\n').join('<br>');

    // 去掉**开头**连续的 <br> / &nbsp; / 全角空格 / NBSP / 窄 NBSP（有时模型会直接吐字符，不是实体）
    html = html.replace(/^(?:[\s\u00A0\u202F\u200B\u200C\u200D\uFEFF]*(?:<br\s*\/?>|&nbsp;|\u3000))+/, '');

    // 把 3 个及以上连在一起的 <br> 收敛为 2 个
    html = html.replace(/(?:\s*<br\s*\/?>\s*){3,}/gi, '<br><br>');

    el.innerHTML = html + (refsHtml || '');
    chatContainer.scrollTop = chatContainer.scrollHeight;
    }

  // ===== 禁用UI状态 =====
  function disableUIState() {
    isWaitingForResponse = true;
    
    // 禁用输入框和发送按钮
    inputEl.disabled = true;
    sendBtn.disabled = true;
    sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    
    // 隐藏发送按钮，显示中止按钮
    sendBtn.classList.add('hidden');
    abortBtn.classList.remove('hidden');
    
    // 禁用预设问题按钮
    document.querySelectorAll(".preset-question-btn").forEach(function (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    });
    
    // 禁用推荐问题按钮
    document.querySelectorAll(".recommendation-item button").forEach(function (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    });
  }

  // ===== 恢复UI状态 =====
  function restoreUIState() {
    isWaitingForResponse = false;
    
    // 恢复输入框和发送按钮
    inputEl.disabled = false;
    sendBtn.disabled = false;
    sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    
    // 显示发送按钮，隐藏中止按钮
    sendBtn.classList.remove('hidden');
    abortBtn.classList.add('hidden');
    
    // 恢复预设问题按钮
    document.querySelectorAll(".preset-question-btn").forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    });
    
    // 恢复推荐问题按钮
    document.querySelectorAll(".recommendation-item button").forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    });
  }

  // ===== SSE 解析：严格按 data: {json}\n\n =====
  async function readSSE(response, onEvent) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    while (true) {
      var result = await reader.read();
      if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true });
      var parts = buffer.split("\n\n");
      buffer = parts.pop();
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var lines = part.split("\n");
        for (var j = 0; j < lines.length; j++) {
          var line = lines[j].trim();
          if (line.indexOf("data:") === 0) {
            var payload = line.slice(5).trim();
            try {
              var evt = JSON.parse(payload);
              onEvent(evt);
            } catch (_) { /* 忽略非 JSON 帧 */ }
          }
        }
      }
    }
  }

  // ===== 发送消息 =====
  async function sendMessage() {
    try {
      var q = inputEl.value.trim();
      if (!q) return;
      
      // 将问题添加到已问过的列表
      if (!askedQuestions.includes(q)) {
        askedQuestions.push(q);
        saveAskedQuestions();
      }
      
      inputEl.value = "";
      appendUserBubble(q);

      // 禁用UI状态
      disableUIState();
      
      // 创建中止控制器
      abortController = new AbortController();
      
      // 开始显示时钟
      startClock();

      var res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, session_id: sessionId }),
        signal: abortController.signal // 关联中止信号
      });

      if (!res.ok || !res.body) {
        var text = ""; try { text = await res.text(); } catch(e){}
        var c = appendBotContainer();
        renderAnswer(c, "服务响应错误: " + String(res.status || "") + (text?(" | " + text):""), "");
        stopClock();
        // 恢复UI状态
        restoreUIState();
        // 更新推荐问题
        displayRecommendedQuestions();
        return;
      }

      var ctn = appendBotContainer();
      var answer = "";
      var refs = "";

      await readSSE(res, function (evt) {
        if (!evt || typeof evt !== "object") return;
        if (evt.type === "delta") {
          answer += String(evt.text || "");
          renderAnswer(ctn, answer, refs);
          tickClock(); // 每条增量推进时钟一步
        } else if (evt.type === "refs") {
          refs = String(evt.html || "");
          renderAnswer(ctn, answer, refs);
        } else if (evt.type === "error") {
          answer += "\n[后端错误] " + String(evt.message || "未知错误");
          renderAnswer(ctn, answer, refs);
          stopClock();
          // 恢复UI状态
          restoreUIState();
          // 更新推荐问题
          displayRecommendedQuestions();
        } else if (evt.type === "done") {
          stopClock(); // 完成后移除时钟
          // 恢复UI状态
          restoreUIState();
          // 更新推荐问题
          displayRecommendedQuestions();
        }
      });
    } catch (e) {
      // 检查是否是中止错误
      if (e.name === 'AbortError') {
        console.log('请求已中止');
      } else {
        var c = appendBotContainer();
        renderAnswer(c, "请求失败: " + esc(String(e)), "");
        stopClock();
        // 恢复UI状态
        restoreUIState();
        // 更新推荐问题
        displayRecommendedQuestions();
      }
    }
  }
  
  // 页面加载完成后显示推荐问题
  document.addEventListener("DOMContentLoaded", function() {
    displayRecommendedQuestions();
  });
})();
