export class IToolsUI {
  static async prompt({
    title,
    message,
    items = [],
    type = "simple",
    hint = "",
    default: defaultValue = "",
  }) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        backdrop-filter: blur(4px);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      `;

      const dialog = document.createElement("div");
      dialog.style.cssText = `
        background: #1c1c1c;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 24px;
        width: 400px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        color: #eee;
        animation: itools-fade-in 0.2s ease-out;
      `;

      const titleEl = document.createElement("h3");
      titleEl.textContent = title;
      titleEl.style.cssText = `margin: 0 0 12px 0; font-size: 18px; color: #fff; font-weight: 600;`;

      const messageEl = document.createElement("p");
      messageEl.textContent = message;
      messageEl.style.cssText = `margin: 0 0 20px 0; font-size: 14px; color: #aaa;`;

      const input = document.createElement(
        type === "simple" ? "input" : "textarea",
      );
      input.value = defaultValue;
      input.style.cssText = `
        width: 100%;
        background: #111;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 10px 12px;
        color: #fff;
        font-size: 14px;
        outline: none;
        margin-bottom: 24px;
        box-sizing: border-box;
        ${type === "simple" ? "" : "height: 120px; resize: vertical; font-family: inherit;"}
      `;
      input.onfocus = () => (input.style.borderColor = "#55aaff");
      input.onblur = () => (input.style.borderColor = "#444");

      if (type !== "simple") {
        dialog.style.width = "500px";
      }

      const buttons = document.createElement("div");
      buttons.style.cssText = `display: flex; justify-content: flex-end; gap: 12px;`;

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.cssText = `
        background: transparent;
        border: 1px solid #444;
        color: #ccc;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      `;
      cancelBtn.onmouseover = () => {
        cancelBtn.style.background = "#333";
        cancelBtn.style.color = "#fff";
      };
      cancelBtn.onmouseout = () => {
        cancelBtn.style.background = "transparent";
        cancelBtn.style.color = "#ccc";
      };

      const okBtn = document.createElement("button");
      okBtn.textContent = "OK";
      okBtn.style.cssText = `
        background: #55aaff;
        border: none;
        color: #fff;
        padding: 8px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: background 0.2s;
      `;
      okBtn.onmouseover = () => (okBtn.style.background = "#77ccff");
      okBtn.onmouseout = () => (okBtn.style.background = "#55aaff");

      const close = (value) => {
        document.body.removeChild(overlay);
        resolve(value);
      };

      cancelBtn.onclick = () => close(null);
      okBtn.onclick = () => close(input.value);

      input.onkeydown = (e) => {
        if (
          e.key === "Enter" &&
          (type === "simple" || e.ctrlKey || e.metaKey)
        ) {
          e.preventDefault();
          okBtn.click();
        }
        if (e.key === "Escape") cancelBtn.click();
      };

      buttons.appendChild(cancelBtn);
      buttons.appendChild(okBtn);
      dialog.appendChild(titleEl);
      dialog.appendChild(messageEl);
      dialog.appendChild(input);
      dialog.appendChild(buttons);
      overlay.appendChild(dialog);

      // Add animation style if not present
      if (!document.getElementById("itools-ui-styles")) {
        const style = document.createElement("style");
        style.id = "itools-ui-styles";
        style.textContent = `
          @keyframes itools-fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(overlay);
      input.focus();
      input.select();
    });
  }
}
