/* ================= POP-UP ROLETA BELA LACES ================= */
(function(){

  // ----- CONFIGURAÇÃO -----
  const TELEGRAM_USER = "SEU_USUARIO_TELEGRAM"; // troque pelo seu usuário do Telegram
  const CUPOM_CODIGO = "BELA20";
  const SHOW_DELAY_MS = 2200; // tempo de espera antes de abrir o pop-up

  // Segmentos da roleta (a roleta é decorativa: SEMPRE cai no "20% OFF")
  // Texto padronizado: sem emoji, mesma cor/peso em todos os gomos (definido no CSS)
  const segments = [
    { label: "PRESENTE",     bg: "#ff4d6d" },
    { label: "10% OFF",      bg: "#06b6a4" },
    { label: "FRETE GRÁTIS", bg: "#8b5cf6" },
    { label: "20% OFF",      bg: "#ffb703" },
    { label: "15% OFF",      bg: "#3b82f6" },
    { label: "BÔNUS",        bg: "#22c55e" }
  ];
  const WINNING_LABEL = "20% OFF";

  // ----- ACESSO SEGURO AO STORAGE (evita travar o script se o navegador bloquear) -----
  function safeGet(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) { /* ignora */ }
  }
  function safeSetLocal(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignora */ }
  }

  // ----- NÃO MOSTRAR DE NOVO NA MESMA SESSÃO -----
  if (safeGet("belaLacesRoletaSeen")) return;

  // ----- MONTA O HTML DO POP-UP -----
  const overlay = document.createElement("div");
  overlay.className = "roleta-overlay";
  overlay.innerHTML = `
    <div class="roleta-modal">
      <button class="roleta-close" aria-label="Fechar">&times;</button>

      <div class="roleta-step-spin">
        <div class="roleta-eyebrow">🎁 Oferta exclusiva para você</div>
        <div class="roleta-title">Você foi <span class="rl-hl">escolhido</span> para receber um <span class="rl-hl">presente especial</span>!</div>
        <div class="roleta-subtitle">Gire a roleta para receber seu <span class="rl-hl-sm">bônus</span> agora mesmo 🎉</div>

        <div class="roleta-wheel-wrap">
          <div class="roleta-lights" id="roletaLights"></div>
          <div class="roleta-pointer"></div>
          <div class="roleta-wheel" id="roletaWheel">
            <div class="roleta-wheel-center">
              <svg viewBox="0 0 24 24"><path d="M12 2 4 6v6c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V6l-8-4Z"/></svg>
            </div>
          </div>
        </div>

        <button class="roleta-spin-btn" id="roletaSpinBtn">Girar agora</button>
        <button class="roleta-skip" id="roletaSkipBtn">Não quero meu desconto</button>
      </div>

      <div class="roleta-result" id="roletaResult">
        <div class="roleta-eyebrow">🎉 Parabéns!</div>
        <div class="roleta-prize-badge">🎁 20% OFF</div>
        <div class="roleta-subtitle">Seu <span class="rl-hl-sm">presente</span> e <span class="rl-hl-sm">bônus</span> estão garantidos! Use o cupom abaixo:</div>
        <div class="roleta-coupon-box">
          <span id="roletaCouponCode">${CUPOM_CODIGO}</span>
          <button class="roleta-copy-btn" id="roletaCopyBtn">Copiar</button>
        </div>
        <a class="roleta-claim-btn" id="roletaClaimBtn" target="_blank">
          <svg viewBox="0 0 24 24"><path d="M21.05 3.4 2.7 10.53c-1.24.5-1.23 1.2-.23 1.5l4.7 1.47 1.83 5.6c.22.6.37.83.75.83.3 0 .43-.14.6-.3l2.55-2.45 4.66 3.44c.86.5 1.48.24 1.7-.8l3.08-14.5c.32-1.28-.48-1.85-1.3-1.5Z"/></svg>
          Resgatar no Telegram
        </a>
        <div class="roleta-fineprint">Cupom válido por 24 horas. Uso único por cliente.</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ----- MONTA VISUALMENTE OS GOMOS DA ROLETA -----
  const wheelEl = document.getElementById("roletaWheel");
  const n = segments.length;
  const segAngle = 360 / n;

  // fundo da roleta (conic-gradient)
  let gradientParts = [];
  segments.forEach((seg, i) => {
    const start = i * segAngle;
    const end = start + segAngle;
    gradientParts.push(`${seg.bg} ${start}deg ${end}deg`);
  });
  wheelEl.style.background = `conic-gradient(${gradientParts.join(",")})`;

  // labels de texto em cada gomo
  // OBS: o translate(-50%,-50%) inicial é o que garante que o texto fique
  // perfeitamente alinhado na mesma distância do centro, mesmo em rótulos
  // com 1 ou 2 linhas (ex: "FRETE GRÁTIS" vs "BÔNUS").
  segments.forEach((seg, i) => {
    const centerAngle = i * segAngle + segAngle / 2;
    const label = document.createElement("div");
    label.className = "roleta-segment-label";
    label.textContent = seg.label;
    label.style.transform =
      `translate(-50%,-50%) rotate(${centerAngle}deg) translateY(-74px) rotate(${-centerAngle}deg)`;
    wheelEl.appendChild(label);
  });

  // ----- LUZINHAS DECORATIVAS AO REDOR DA ROLETA -----
  const lightsEl = document.getElementById("roletaLights");
  const wrapSize = 264;
  const lightCount = 20;
  const lightRadius = wrapSize / 2 - 5;
  for (let i = 0; i < lightCount; i++) {
    const angle = (360 / lightCount) * i;
    const rad = (angle - 90) * (Math.PI / 180);
    const x = wrapSize / 2 + lightRadius * Math.cos(rad);
    const y = wrapSize / 2 + lightRadius * Math.sin(rad);
    const dot = document.createElement("span");
    dot.className = "roleta-light";
    dot.style.left = x + "px";
    dot.style.top = y + "px";
    dot.style.animationDelay = (i * 0.07) + "s";
    lightsEl.appendChild(dot);
  }

  // ----- ABRIR O POP-UP -----
  setTimeout(() => {
    overlay.classList.add("show");
    safeSet("belaLacesRoletaSeen", "1");
  }, SHOW_DELAY_MS);

  // ----- FECHAR -----
  function closePopup() {
    overlay.classList.remove("show");
  }
  overlay.querySelector(".roleta-close").addEventListener("click", closePopup);
  document.getElementById("roletaSkipBtn").addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  // ----- GIRAR A RODA (sempre cai em "20% OFF") -----
  let spinning = false;
  document.getElementById("roletaSpinBtn").addEventListener("click", function () {
    if (spinning) return;
    spinning = true;
    this.disabled = true;

    const winningIndex = segments.findIndex(s => s.label === WINNING_LABEL);
    const targetCenter = winningIndex * segAngle + segAngle / 2;
    const extraSpins = 6 * 360;
    const jitter = (Math.random() * 16) - 8; // pequena variação dentro do próprio gomo
    const rotation = extraSpins + (360 - targetCenter) + jitter;

    wheelEl.style.transform = `rotate(${rotation}deg)`;

    setTimeout(() => {
      document.querySelector(".roleta-step-spin").style.display = "none";
      const resultBox = document.getElementById("roletaResult");
      resultBox.classList.add("show");

      const claimBtn = document.getElementById("roletaClaimBtn");
      const msg = `Olá! Fui escolhido(a) para receber o presente especial: cupom ${CUPOM_CODIGO} (20% OFF de bônus) na roleta do site e gostaria de usá-lo em uma compra.`;
      claimBtn.href = `https://t.me/${TELEGRAM_USER}?text=${encodeURIComponent(msg)}`;

      safeSetLocal("belaLacesCoupon", JSON.stringify({
        codigo: CUPOM_CODIGO,
        data: new Date().toISOString()
      }));
    }, 4300);
  });

  // ----- COPIAR CUPOM -----
  document.getElementById("roletaCopyBtn").addEventListener("click", function () {
    const code = document.getElementById("roletaCouponCode").textContent;
    const btn = this;
    function marcarCopiado() {
      btn.textContent = "Copiado!";
      setTimeout(() => { btn.textContent = "Copiar"; }, 1800);
    }
    try {
      navigator.clipboard.writeText(code).then(marcarCopiado).catch(marcarCopiado);
    } catch (e) {
      marcarCopiado();
    }
  });

})();
