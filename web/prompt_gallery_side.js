import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import { DEFAULT_HISTORY } from "./utils.js";

export function exportHistoryToFile(history) {
  // if list is empty return
  if (!history || history.length === 0) {
    // Show warning message
    app.extensionManager.toast.add({
      severity: "error",
      summary: "Error",
      detail: "No prompts to export!",
      life: 2000,
    });
    return;
  }

  // Create text content
  const content = history.join("\n\n");

  // Create temporary link element
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));

  // Get current date for filename
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];

  // Set suggested filename
  element.setAttribute("download", `prompts_history_${dateStr}.txt`);

  // Hide element
  element.style.display = "none";
  document.body.appendChild(element);

  // Show native save dialog
  element.click();

  // Cleanup
  document.body.removeChild(element);
}

export function importHistoryFromFile(callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt";

  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target.result;
      const items = content.split("\n\n").filter((item) => item.trim());
      callback(items);
    };

    reader.readAsText(file);
  };

  input.click();
}

export function createUserHistoryFile() {
  // Get existing history if any
  const existingHistory = localStorage.getItem("iTools_userHistorySide");

  if (!existingHistory) {
    // Create new history with defaults if none exists
    const defaults = {
      prompts: DEFAULT_HISTORY,
    };
    if (allow_debug) console.log("iTools_userHistorySide created");
    localStorage.setItem("iTools_userHistorySide", JSON.stringify(defaults));
  } else {
    if (allow_debug) console.log("iTools_userHistorySide loaded");
    // Check if existing history has items
    const history = JSON.parse(existingHistory);
    if (!history.prompts || history.prompts.length === 0) {
      // If empty, initialize with defaults
      const defaults = {
        prompts: DEFAULT_HISTORY,
      };
      if (allow_debug) console.log("iTools_userHistorySide reset with defaults");
      localStorage.setItem("iTools_userHistorySide", JSON.stringify(defaults));
    }
  }
}

export function removeUserHistoryFile() {
  localStorage.removeItem("iTools_userHistorySide");
  if (allow_debug) console.log("iTools_userHistorySide removed");
}

export function getUserHistoryFile() {
  createUserHistoryFile();
  const userHistory = JSON.parse(localStorage.getItem("iTools_userHistorySide"));
  return userHistory;
}

// MAIN FUNCTION Register a new sidebar tab
export function addSideTab() {
  if (!app.ui.settings.getSettingValue("iTools.Tabs.Side Tab")) return;
  app.extensionManager.registerSidebarTab({
    id: "iToolsFavorite",
    icon: "pi pi-star-fill",
    title: "favorite",
    tooltip: "Prompt Library",
    type: "custom",
    render: (el) => {
      el.innerHTML = `
<div style="height: 100%; display: flex; flex-direction: column; padding: 8px; box-sizing: border-box; font-family: sans-serif; color: #fff;">
  <h2 style="margin: 0 0 10px 0; font-size: 16px;">iTools Prompt Library</h2>
  
  <!-- Button Container -->
  <div id="buttonContainer" style="
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  ">
    <button id="exportBtn" style="
      background: #333;
      border: none;
      border-radius: 4px;
      color: #fff;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      min-width: 60px;
      transition: background 0.2s;
    ">Export</button>
    
    <button id="importBtn" style="
      background: #333;
      border: none;
      border-radius: 4px;
      color: #fff;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      min-width: 60px;
      transition: background 0.2s;
    ">Import</button>
    
    <button id="appendBtn" style="
      background: #333;
      border: none;
      border-radius: 4px;
      color: #fff;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      min-width: 60px;
      transition: background 0.2s;
    ">Merge</button>
    
    <button id="saveBtn" style="
      display: none;
      background: #A85B28;
      border: none;
      border-radius: 4px;
      color: #fff;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      min-width: 60px;
      transition: background 0.2s;
    ">Save</button>
  </div>
  
  <input id="promptSearch" type="text" placeholder="Search Prompts..." style="
    width: 100%;
    padding: 6px 10px;
    margin-bottom: 10px;
    border-radius: 4px;
    border: none;
    background: #1e1e1e;
    color: #fff;
    font-size: 14px;
  "/>
  <div id="promptList" style="flex: 1; overflow-y: auto;"></div>
</div>
    `;

      const listEl = el.querySelector("#promptList");
      const searchEl = el.querySelector("#promptSearch");
      const exportBtn = el.querySelector("#exportBtn");
      const importBtn = el.querySelector("#importBtn");
      const appendBtn = el.querySelector("#appendBtn");
      const saveBtn = el.querySelector("#saveBtn");

      const selected = app.canvas.selectedItems;
      const firstNode = Array.from(selected).find((node) => node.constructor.name === "ComfyNode");
      let hasSelectedNode = null;

      if (firstNode && firstNode.widgets) {
        const hasCustomText = firstNode.widgets.filter((widget) => widget.type === "customtext");
        if (hasCustomText.length > 0) {
          if (allow_debug) console.log("hasCustomText", hasCustomText);
          hasSelectedNode = hasCustomText;
        }
      }

      // Add hover effects to buttons
      const buttons = [exportBtn, importBtn, appendBtn, saveBtn];
      buttons.forEach((btn) => {
        btn.addEventListener("mouseover", () => {
          if (btn.id !== "saveBtn") {
            btn.style.background = "#444";
          } else {
            btn.style.background = "#C96D30";
          }
        });
        btn.addEventListener("mouseout", () => {
          if (btn.id !== "saveBtn") {
            btn.style.background = "#333";
          } else {
            btn.style.background = "#A85B28";
          }
        });
      });

      function copyPrompt(text) {
        if (hasSelectedNode) {
          hasSelectedNode[0].value = text;
          hasSelectedNode = null;
        } else {
          navigator.clipboard.writeText(text);
          app.extensionManager.toast.add({
            severity: "success",
            summary: "Success",
            detail: "Text copied to clipboard!",
            life: 2000,
          });
        }

        // toggle side bar
        app.extensionManager.sidebarTab.toggleSidebarTab("iToolsFavorite");
      }

      function renderList(filter = "") {
        const prompts = getUserHistoryFile();
        const filtered = prompts.prompts.filter((p) => p.toLowerCase().includes(filter.toLowerCase()));

        listEl.innerHTML = filtered
          .map(
            (prompt, index) => `
        <div style="
          background: #2b2b2b;
          padding: 8px;
          margin-bottom: 8px;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 100px;
          position: relative;
        ">
          <div style="
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: wrap;
            margin-right: 60px;
          " title="${prompt}">
            ${prompt}
          </div>
          <button style="
            position: absolute;
            right: 8px;
            top: 8px;
            background: #444;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            min-width: 50px;
          " onclick="copyPromptFromList(${index})">
          ${hasSelectedNode ? "Use" : "Copy"}
          </button>
          <button style="
            position: absolute;
            right: 8px;
            top: 40px;
            background: #662222;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            min-width: 50px;
          " onclick="deletePromptFromList(${index})">
            🗑️
          </button>
        </div>
      `
          )
          .join("");

        if (filtered.length === 0) {
          listEl.innerHTML = `
          <div style="
            color: #666;
            text-align: center;
            padding: 20px;
            font-style: italic;
          ">
            ${filter ? "No matching prompts found" : "No prompts in favorites"}
          </div>
        `;
        }

        // Bind global handlers
        window.copyPromptFromList = (i) => copyPrompt(filtered[i]);
        window.deletePromptFromList = async (i) => {
          const confirmed = await app.extensionManager.dialog.confirm({
            title: "Delete Prompt",
            message: "Are you sure you want to delete this prompt from favorites?",
            type: "delete",
          });

          if (confirmed) {
            const history = getUserHistoryFile();
            const filtered = history.prompts.filter((p) => p.toLowerCase().includes(searchEl.value.toLowerCase()));

            const deletedPrompt = filtered[i];
            const index = history.prompts.indexOf(deletedPrompt);

            if (index > -1) {
              history.prompts.splice(index, 1);
              localStorage.setItem("iTools_userHistorySide", JSON.stringify(history));
              renderList(searchEl.value);

              app.extensionManager.toast.add({
                severity: "success",
                summary: "Success",
                detail: "Prompt deleted",
                life: 2000,
              });
            }
          }
        };
      }

      // Button event handlers
      exportBtn.addEventListener("click", () => {
        const prompts = getUserHistoryFile();
        exportHistoryToFile(prompts);
      });

      importBtn.addEventListener("click", async () => {
        const confirmed = await app.extensionManager.dialog.confirm({
          title: "Import Favorites",
          message: "This will replace your current favorites with imported ones.\nDo you want to continue?",
          type: "overwrite",
        });

        if (confirmed) {
          importHistoryFromFile((newItems) => {
            localStorage.setItem("iTools_userHistorySideSide", JSON.stringify({ prompts: newItems }));
            renderList(searchEl.value);
            app.extensionManager.toast.add({
              severity: "success",
              summary: "Success",
              detail: "Prompts imported (replaced) successfully!",
              life: 2000,
            });
          });
        }
      });

      appendBtn.addEventListener("click", () => {
        importHistoryFromFile((newItems) => {
          if (!newItems || newItems.length === 0) return;

          // Get current prompts
          const currentHistory = getUserHistoryFile();
          const currentPrompts = currentHistory?.prompts || [];

          // Filter out duplicates and empty items
          const uniqueNewItems = newItems.filter((item) => item.trim() && !currentPrompts.includes(item));

          if (uniqueNewItems.length === 0) {
            app.extensionManager.toast.add({
              severity: "info",
              summary: "Info",
              detail: "No new prompts to merge (all duplicates)",
              life: 2000,
            });
            return;
          }

          // Merge and save
          const mergedPrompts = [...currentPrompts, ...uniqueNewItems];
          localStorage.setItem("iTools_userHistorySide", JSON.stringify({ prompts: mergedPrompts }));

          // Update UI
          renderList(searchEl.value);

          // Show success message
          app.extensionManager.toast.add({
            severity: "success",
            summary: "Success",
            detail: `Merged ${uniqueNewItems.length} new prompts`,
            life: 2000,
          });
        });
      });

      saveBtn.addEventListener("click", async () => {
        const prompts = getUserHistoryFile();
        if (prompts.length === 0) {
          app.extensionManager.toast.add({
            severity: "error",
            summary: "Error",
            detail: "Saving empty favorites is not allowed",
            life: 3000,
          });
          return;
        }

        try {
          const confirmed = await app.extensionManager.dialog.confirm({
            title: "Save Favorites 🪶",
            message: "This will save your current favorites.\nDo you want to continue?",
            type: "overwrite",
          });

          if (confirmed) {
            localStorage.setItem("iTools_userHistorySideSide", JSON.stringify({ prompts }));
            app.extensionManager.toast.add({
              severity: "success",
              summary: "Success",
              detail: "Favorites saved successfully!",
              life: 2000,
            });
          }
        } catch (error) {
          app.extensionManager.toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to save favorites",
            life: 3000,
          });
        }
      });

      searchEl.addEventListener("input", () => renderList(searchEl.value));
      renderList();
    },
  });
}
addSideTab();
