/**
 * Amanai Chat Widget — Embed Script for BloomSense
 * 
 * Usage: Add this to your website:
 * <script src="https://cpmishra.lovable.app/embed.js"></script>
 * 
 * Or with options:
 * <script src="https://cpmishra.lovable.app/embed.js" 
 *   data-position="right" 
 *   data-color="#ec4899">
 * </script>
 */
(function () {
  const script = document.currentScript;
  const position = script?.getAttribute("data-position") || "right";
  const color = script?.getAttribute("data-color") || "#ec4899";
  const baseUrl = script?.src ? new URL(script.src).origin : "https://cpmishra.lovable.app";

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    #amanai-widget-btn {
      position: fixed;
      bottom: 24px;
      ${position === "left" ? "left: 24px;" : "right: 24px;"}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${color};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      animation: amanai-pulse 2s infinite;
    }
    #amanai-widget-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(0,0,0,0.35);
    }
    @keyframes amanai-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(236,72,153,0.3); }
      50% { box-shadow: 0 4px 30px rgba(236,72,153,0.6); }
    }
    #amanai-widget-frame {
      position: fixed;
      bottom: 96px;
      ${position === "left" ? "left: 24px;" : "right: 24px;"}
      width: 380px;
      height: 560px;
      max-height: calc(100dvh - 120px);
      max-width: calc(100vw - 32px);
      border: none;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.3);
      z-index: 99999;
      display: none;
      overflow: hidden;
      background: #1a1a2e;
    }
    #amanai-widget-frame.open {
      display: block;
      animation: amanai-slide-up 0.3s ease-out;
    }
    @keyframes amanai-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      #amanai-widget-frame {
        width: calc(100vw - 16px);
        height: calc(100dvh - 80px);
        bottom: 8px;
        ${position === "left" ? "left: 8px;" : "right: 8px;"}
        border-radius: 12px;
      }
      #amanai-widget-btn {
        bottom: 16px;
        ${position === "left" ? "left: 16px;" : "right: 16px;"}
      }
    }
  `;
  document.head.appendChild(style);

  // Button
  const btn = document.createElement("button");
  btn.id = "amanai-widget-btn";
  btn.setAttribute("aria-label", "Chat with Amanai");
  btn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  document.body.appendChild(btn);

  // Frame
  const frame = document.createElement("iframe");
  frame.id = "amanai-widget-frame";
  frame.src = baseUrl + "/embed";
  frame.setAttribute("loading", "lazy");
  frame.setAttribute("title", "Amanai Chat");
  document.body.appendChild(frame);

  let isOpen = false;
  btn.addEventListener("click", function () {
    isOpen = !isOpen;
    if (isOpen) {
      frame.classList.add("open");
      btn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      frame.classList.remove("open");
      btn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    }
  });
})();
