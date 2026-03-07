import { app } from "../../../scripts/app.js";

const defaultHtml = `
<div class="card">
  <div class="card-image" style="background-image: url('https://via.placeholder.com/300x200');"></div>
  <div class="card-content">
    <p class="date">1 week ago</p>
    <h2 class="title">Post Two</h2>
    <p class="desc">Adipisicing elit. Ducimus, repudiandae corrupti amet temporibus omnis provident illum maxime quod. Lorem ipsum dolor</p>
  </div>
  <div class="card-footer">
    <div class="stat">
      <span class="value">7<small>m</small></span>
      <span class="label">READ</span>
    </div>
    <div class="stat">
      <span class="value">7152</span>
      <span class="label">VIEWS</span>
    </div>
    <div class="stat">
      <span class="value">21</span>
      <span class="label">COMMENTS</span>
    </div>
  </div>
</div>
`;

const defaultCss = `
.card {
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  overflow: hidden;
  font-family: sans-serif;
  margin: auto;
}
.card-image {
  height: 200px;
  background-size: cover;
  background-position: center;
}
.card-content {
  padding: 20px;
  text-align: center;
}
.date {
  color: #ff5e00;
  font-size: 12px;
  margin-bottom: 5px;
}
.title {
  margin: 0;
  font-size: 24px;
  color: #222;
}
.desc {
  color: #666;
  font-size: 14px;
  margin-top: 15px;
  line-height: 1.4;
}
.card-footer {
  display: flex;
  background: #f05a22;
  color: white;
}
.stat {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  border-right: 1px solid rgba(0,0,0,0.1);
}
.stat:last-child {
  border-right: none;
}
.stat .value {
  display: block;
  font-size: 20px;
  font-weight: bold;
}
.stat .label {
  font-size: 10px;
  text-transform: uppercase;
}
`;

app.registerExtension({
  name: "iTools.cssCardDesigner",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsCssCardDesigner") return;

    // dynamic inputs handling
    const ensureInputs = () => {
      let hasEmpty = false;
      for (let i = 1; i < node.inputs.length; i++) {
        if (!node.inputs[i].link) {
          hasEmpty = true;
          break;
        }
      }
      if (!hasEmpty) {
        node.addInput(`param_${node.inputs.length}`, "*");
      }
    };

    node.onConnectionsChange = function (type, index, connected, link_info) {
      if (type === LiteGraph.INPUT) {
        if (connected) {
          ensureInputs();
        } else {
          // clean up empty unconnected inputs, except the image one (index 0) and the very last one
          requestAnimationFrame(() => {
            const emptyInputs = [];
            for (let i = 1; i < node.inputs.length; i++) {
              if (!node.inputs[i].link) {
                emptyInputs.push(i);
              }
            }
            // If there's more than one empty input, remove all except the last one
            if (emptyInputs.length > 1) {
              for (let i = emptyInputs.length - 2; i >= 0; i--) {
                node.removeInput(emptyInputs[i]);
              }
            }
            // Ensure there is still at least one empty input at the end
            ensureInputs();
          });
        }
      }
    };

    setTimeout(() => ensureInputs(), 100);

    // DOM Widget
    const container = document.createElement("div");
    container.style.cssText = `
        display: flex;
        flex-direction: column; 
        gap: 8px; 
        padding: 5px; 
        height: 100%; 
        background: #1c1c1c; 
        border-radius: 8px; 
        color: white; 
        font-family: sans-serif;
    `;

    // Tabs
    const tabHeader = document.createElement("div");
    tabHeader.style.cssText = `display: flex; gap: 4px;`;

    const previewTab = document.createElement("button");
    previewTab.textContent = "Preview";
    previewTab.style.cssText = `flex: 1; padding: 5px; background: #444; border: none; border-radius: 4px; color: white; cursor: pointer; transition: 0.2s;`;

    const cssTab = document.createElement("button");
    cssTab.textContent = "CSS/HTML";
    cssTab.style.cssText = `flex: 1; padding: 5px; background: #333; border: none; border-radius: 4px; color: white; cursor: pointer; transition: 0.2s;`;

    tabHeader.appendChild(previewTab);
    tabHeader.appendChild(cssTab);

    // Context areas
    const previewContainer = document.createElement("div");
    previewContainer.style.cssText = `flex: 1; border: 1px solid #444; border-radius: 4px; background: #fff; color: #000; overflow: auto; padding: 10px; display: block;`;

    const cssContainer = document.createElement("div");
    cssContainer.style.cssText = `flex: 1; display: none; flex-direction: column; gap: 5px;`;

    const htmlArea = document.createElement("textarea");
    htmlArea.placeholder = "HTML Code";
    htmlArea.style.cssText = `flex: 1; background: #111; color: #0f0; border: 1px solid #444; font-family: monospace; padding: 5px; outline: none; border-radius: 4px; resize: none; font-size: 11px;`;
    htmlArea.value = defaultHtml;

    const cssArea = document.createElement("textarea");
    cssArea.placeholder = "CSS Code";
    cssArea.style.cssText = `flex: 1; background: #111; color: #0ff; border: 1px solid #444; font-family: monospace; padding: 5px; outline: none; border-radius: 4px; resize: none; font-size: 11px;`;
    cssArea.value = defaultCss;

    cssContainer.appendChild(htmlArea);
    cssContainer.appendChild(cssArea);

    const updatePreview = () => {
      if (!previewContainer.shadowRoot) {
        previewContainer.attachShadow({ mode: "open" });
      }
      previewContainer.shadowRoot.innerHTML = `<style>${cssArea.value}</style>${htmlArea.value}`;
    };

    htmlArea.oninput = () => {
      updatePreview();
      node.setDirtyCanvas(true);
    };
    cssArea.oninput = () => {
      updatePreview();
      node.setDirtyCanvas(true);
    };

    updatePreview();

    previewTab.onclick = () => {
      previewTab.style.background = "#444";
      cssTab.style.background = "#333";
      previewContainer.style.display = "block";
      cssContainer.style.display = "none";
    };

    cssTab.onclick = () => {
      cssTab.style.background = "#444";
      previewTab.style.background = "#333";
      previewContainer.style.display = "none";
      cssContainer.style.display = "flex";
    };

    container.appendChild(tabHeader);
    container.appendChild(previewContainer);
    container.appendChild(cssContainer);

    node.size = [360, 500];

    const widget = node.addDOMWidget(
      "CssCardDesignerWidget",
      "custom",
      container,
      {
        getValue: () => {
          return {
            html: htmlArea.value,
            css: cssArea.value,
          };
        },
        setValue: (v) => {
          if (v) {
            htmlArea.value = v.html || defaultHtml;
            cssArea.value = v.css || defaultCss;
            updatePreview();
          }
        },
      },
    );

    node.onResize = () => {
      if (node.size[0] < 200) node.size[0] = 200;
      if (node.size[1] < 200) node.size[1] = 200;
    };
  },
});
