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
      life: 1000,
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
  const existingHistory = localStorage.getItem("iTools_userHistory");

  if (!existingHistory) {
    // Create new history with defaults if none exists
    const defaults = {
      prompts: DEFAULT_HISTORY,
    };
    if (allow_debug) console.log("iTools_userHistory created");
    localStorage.setItem("iTools_userHistory", JSON.stringify(defaults));
  } else {
    // Check if existing history has items
    const history = JSON.parse(existingHistory);
    if (!history.prompts || history.prompts.length === 0) {
      // If empty, initialize with defaults
      const defaults = {
        prompts: DEFAULT_HISTORY,
      };
      if (allow_debug) console.log("iTools_userHistory reset with defaults");
      localStorage.setItem("iTools_userHistory", JSON.stringify(defaults));
    }
  }
}

export function removeUserHistoryFile() {
  localStorage.removeItem("iTools_userHistory");
  if (allow_debug) console.log("iTools_userHistory removed");
}

export function getUserHistoryFile() {
  createUserHistoryFile();
  const userHistory = JSON.parse(localStorage.getItem("iTools_userHistory"));
  return userHistory;
}

// MAIN FUNCTION
export function inputsHistoryShow(inputs, inputWidget) {
  // Create modal container
  const modal = document.createElement("div");
  modal.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          width: 600px;
          max-height: 80vh;
          z-index: 1000;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #333;
      `;

  // Create title container for title and buttons
  const titleContainer = document.createElement("div");
  titleContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
      `;

  const title = document.createElement("h3");
  title.textContent = "Timeline";
  title.style.cssText = `
          margin: 0;
          padding-bottom: 2px;
          color: #fff;
          font-size: 16px;
      `;

  // Create button container
  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.cssText = `
          display: flex;
          gap: 8px;
      `;

  // Shared button styles
  const buttonStyle = `
          background: #333;
          border: none;
          border-radius: 4px;
          color: #fff;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          min-width: 35px;
          transition: background 0.2s;
      `;

  // Create export button
  const exportButton = document.createElement("button");
  exportButton.textContent = "Export";
  exportButton.style.cssText = buttonStyle;
  exportButton.onmouseover = () => (exportButton.style.background = "#444");
  exportButton.onmouseout = () => (exportButton.style.background = "#333");
  exportButton.onclick = () => exportHistoryToFile(inputs);

  // Create import button
  const importButton = document.createElement("button");
  importButton.textContent = "Import";
  importButton.style.cssText = buttonStyle;
  importButton.onmouseover = () => (importButton.style.background = "#444");
  importButton.onmouseout = () => (importButton.style.background = "#333");
  importButton.onclick = () => {
    importHistoryFromFile((newItems) => {
      // Clear old items first
      inputs.length = 0;

      // Add new items to the history
      newItems.forEach((item) => {
        if (!inputs.includes(item)) {
          inputs.push(item);
        }
      });
      // Re-render the list
      renderList(searchInput.value);
      // Show success message
      // app.extensionManager.toast.add({
      //   severity: "success",
      //   summary: "Success",
      //   detail: "History imported successfully!",
      //   life: 1000,
      // });
    });
  };

  // Create load button
  const loadButton = document.createElement("button");
  loadButton.textContent = "🪶" || "Favorites ⭐" || "Load";
  loadButton.style.cssText = buttonStyle;
  loadButton.onmouseover = () => (loadButton.style.background = "#444");
  loadButton.onmouseout = () => (loadButton.style.background = "#333");
  loadButton.onclick = async () => loadSeasonedHistory();

  async function loadSeasonedHistory() {
    // Only show confirmation if current season has items
    const needsConfirmation = inputs.length > 0;
    let shouldProceed = true;

    if (needsConfirmation) {
      shouldProceed = await app.extensionManager.dialog.confirm({
        title: "Load Favorites 🪶",
        message: "This will load your saved favorites, current prompts here will be lost.\nDo you want to continue?",
      });
    }

    if (shouldProceed) {
      try {
        const savedHistory = getUserHistoryFile();
        if (savedHistory && savedHistory.prompts) {
          inputs.length = 0;
          savedHistory.prompts.forEach((item) => inputs.push(item));
          renderList(searchInput.value);
          // app.extensionManager.toast.add({
          //   severity: "success",
          //   summary: "Success",
          //   detail: "History loaded from storage",
          //   life: 1000,
          // });
        } else {
          app.extensionManager.toast.add({
            severity: "info",
            summary: "Info",
            detail: "No saved favorites found",
            life: 1000,
          });
        }
      } catch (error) {
        app.extensionManager.toast.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to load history",
          life: 3000,
        });
      }
    }
  }

  // Create save button
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save" || "Save";
  // saveButton.style.cssText = buttonStyle;
  // saveButton.onmouseover = () => (saveButton.style.background = "#444");
  // saveButton.onmouseout = () => (saveButton.style.background = "#333");
  // saveButton.style.cssText = buttonStyle + "background: #e67e22;"; // Darker orange background
  // saveButton.onmouseover = () => (saveButton.style.background = "#f39c12"); // Slightly lighter on hover
  // saveButton.onmouseout = () => (saveButton.style.background = "#e67e22"); // Back to original
  saveButton.style.cssText = buttonStyle + "background: #A85B28"; // Muted burnt orange
  saveButton.onmouseover = () => (saveButton.style.background = "#C96D30"); // Warmer hover
  saveButton.onmouseout = () => (saveButton.style.background = "#A85B28"); // Revert
  saveButton.onclick = async () => {
    const historyData = {
      prompts: inputs,
    };
    if (historyData.prompts.length === 0) {
      app.extensionManager.toast.add({
        severity: "error",
        summary: "Error",
        detail: "Saving empty data, is not allowed",
        life: 3000,
      });
      return;
    }
    try {
      const confirmed = await app.extensionManager.dialog.confirm({
        title: "Save As New Favorites 🪶",
        message: "This will overwrite your saved favorites with current season prompts.\nDo you want to continue?",
        type: "overwrite",
      });

      if (confirmed) {
        localStorage.setItem("iTools_userHistory", JSON.stringify(historyData));
        app.extensionManager.toast.add({
          severity: "success",
          summary: "Success",
          detail: "History saved to storage",
          life: 1000,
        });
      }
    } catch (error) {
      app.extensionManager.toast.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to save history",
        life: 3000,
      });
    }
  };

  // Create add button
  const addButton = document.createElement("button");
  addButton.textContent = "↩" || "Add";
  addButton.style.cssText = buttonStyle;
  addButton.onmouseover = () => (addButton.style.background = "#444");
  addButton.onmouseout = () => (addButton.style.background = "#333");
  addButton.onclick = async () => {
    if (inputs.length === 0) {
      app.extensionManager.toast.add({
        severity: "error",
        summary: "Error",
        detail: "Current season is empty",
        life: 3000,
      });
      return;
    }
    try {
      const confirmed = await app.extensionManager.dialog.confirm({
        title: "Add New Prompts To Favorites 🪶",
        message: "This will append only new prompts here to your saved favorites.\nDo you want to continue?",
      });

      if (confirmed) {
        const savedHistory = getUserHistoryFile();
        const mergedPrompts =
          savedHistory && savedHistory.prompts
            ? [...new Set([...savedHistory.prompts, ...inputs])] // Merge and remove duplicates
            : inputs;

        localStorage.setItem("iTools_userHistory", JSON.stringify({ prompts: mergedPrompts }));
        app.extensionManager.toast.add({
          severity: "success",
          summary: "Success",
          detail: "New prompts from current season added to saved favorites",
          life: 1000,
        });
      }
    } catch (error) {
      app.extensionManager.toast.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to add to history",
        life: 3000,
      });
    }
  };

  // Create clear button
  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear";
  clearButton.style.cssText = buttonStyle + "background: #662222;"; // Slightly reddish background
  clearButton.onmouseover = () => (clearButton.style.background = "#882222");
  clearButton.onmouseout = () => (clearButton.style.background = "#662222");
  clearButton.onclick = async () => {
    // if list is empty return
    if (!inputs || inputs.length === 0) return;

    const confirmed = await app.extensionManager.dialog.confirm({
      title: "Clear Current Season",
      message: "This will remove all current season prompts.\nSaved favorites will not be affected.",
      type: "delete",
    });

    if (confirmed) {
      inputs.length = 0;
      renderList(searchInput.value);
      // app.extensionManager.toast.add({
      //   severity: "success",
      //   summary: "Success",
      //   detail: "History cleared successfully!",
      //   life: 1000,
      // });
    }
  };

  // Add buttons to header
  buttonsContainer.appendChild(exportButton);
  buttonsContainer.appendChild(importButton);
  buttonsContainer.appendChild(loadButton);
  buttonsContainer.appendChild(addButton);
  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(clearButton);

  titleContainer.appendChild(title);
  titleContainer.appendChild(buttonsContainer);

  const closeButton = document.createElement("button");
  closeButton.textContent = "✖" || "✖" || "×";
  closeButton.style.cssText = `
          background: none;
          border: none;
          color: #666;
          font-size: 20px;
          cursor: pointer;
          padding: 0 5px;
      `;
  closeButton.onclick = () => {
    modal.remove();
    overlay.remove();
  };

  header.appendChild(titleContainer);
  header.appendChild(closeButton);

  // Create search input
  const searchContainer = document.createElement("div");
  searchContainer.style.cssText = `
          margin-bottom: 10px;
          position: relative;
      `;

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search current season...";
  searchInput.style.cssText = `
          width: 100%;
          padding: 8px 30px 8px 10px;
          background: #252525;
          border: 1px solid #333;
          border-radius: 4px;
          color: #fff;
          font-size: 14px;
          box-sizing: border-box;
      `;

  const searchIcon = document.createElement("div");
  searchIcon.innerHTML = "🔍︎";
  searchIcon.style.cssText = `
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          pointer-events: none;
      `;

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchIcon);

  // Create content container
  const content = document.createElement("div");
  content.style.cssText = `
          overflow-y: auto;
          padding-right: ${content.scrollHeight > content.clientHeight ? "10px" : "0"};
          max-height: calc(80vh - 140px);
      `;

  // Add resize observer to update padding when content changes
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const hasScrollbar = entry.target.scrollHeight > entry.target.clientHeight;
      entry.target.style.paddingRight = hasScrollbar ? "10px" : "0";
    }
  });

  resizeObserver.observe(content);

  // Create list of inputs
  const list = document.createElement("div");
  list.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 10px;
      `;

  function renderList(filterText = "") {
    // Clear existing items
    list.innerHTML = "";

    // Filter and render items
    inputs
      .slice()
      .reverse()
      .filter((text) => text.toLowerCase().includes(filterText.toLowerCase()))
      .forEach((text, index) => {
        const item = document.createElement("div");
        item.style.cssText = `
                background: #252525;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 10px;
                position: relative;
                min-height: 99px;
            `;

        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy";
        copyButton.style.cssText = `
                position: absolute;
                top: 36px;
                right: 8px;
                background: #333;
                border: none;
                border-radius: 4px;
                color: #fff;
                min-width: 50px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
            `;
        copyButton.onmouseover = () => (copyButton.style.background = "#444");
        copyButton.onmouseout = () => (copyButton.style.background = "#333");
        copyButton.onclick = async () => {
          try {
            await navigator.clipboard.writeText(text);
            // modal.remove();
            // overlay.remove();
            app.extensionManager.toast.add({
              severity: "success",
              summary: "Success",
              detail: "Text copied to clipboard!",
              life: 1000,
            });
          } catch (error) {
            app.extensionManager.toast.add({
              severity: "error",
              summary: "Error",
              detail: "Failed to copy text to clipboard",
              life: 3000,
            });
          }
        };

        const insertButton = document.createElement("button");
        insertButton.textContent = "Use";
        insertButton.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: #333;
                border: none;
                border-radius: 4px;
                color: #fff;
                padding: 4px 8px;
                min-width: 50px;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
            `;
        insertButton.onmouseover = () => (insertButton.style.background = "#444");
        insertButton.onmouseout = () => (insertButton.style.background = "#333");
        insertButton.onclick = async () => {
          try {
            await navigator.clipboard.writeText(text);
            modal.remove();
            overlay.remove();
            inputWidget[0].options.setValue(text);
            app.extensionManager.toast.add({
              severity: "success",
              summary: "Success",
              detail: "Text inserted from history",
              life: 1000,
            });
          } catch (error) {
            app.extensionManager.toast.add({
              severity: "error",
              summary: "Error",
              detail: "Failed to insert text from history",
              life: 3000,
            });
          }
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "🗑️";
        deleteButton.style.cssText = `
                position: absolute;
                top: 64px;
                right: 8px;
                background: #662222;
                border: none;
                border-radius: 4px;
                color: #fff;
                min-width: 50px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
            `;
        deleteButton.onmouseover = () => (deleteButton.style.background = "#882222");
        deleteButton.onmouseout = () => (deleteButton.style.background = "#662222");
        deleteButton.onclick = () => {
          const index = inputs.indexOf(text);
          if (index > -1) {
            inputs.splice(index, 1);
            renderList(searchInput.value);
            // app.extensionManager.toast.add({
            //   severity: "success",
            //   summary: "Success",
            //   detail: "Entry deleted from history",
            //   life: 1000,
            // });
          }
        };

        const textContent = document.createElement("div");
        textContent.style.cssText = `
                color: #fff;
                font-size: 14px;
                margin-right: 65px;
                word-break: break-word;
            `;
        textContent.textContent = text || "(empty)";

        item.appendChild(textContent);
        item.appendChild(insertButton);
        item.appendChild(copyButton);
        item.appendChild(deleteButton);
        list.appendChild(item);
      });

    // Show "no results" message if needed
    if (list.children.length === 0) {
      const noResults = document.createElement("div");
      noResults.style.cssText = `
                color: #666;
                text-align: center;
                padding: 20px;
                font-style: italic;
            `;
      // Different message based on whether we're filtering or just have no history
      noResults.textContent = filterText ? "No matching prompts found" : "No prompts in current season";
      list.appendChild(noResults);
    }
  }

  // Initial render
  renderList();

  // Add search handler
  searchInput.addEventListener("input", (e) => {
    renderList(e.target.value);
  });

  content.appendChild(list);

  // Add overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        `;
  overlay.onclick = () => {
    modal.remove();
    overlay.remove();
  };

  // Assemble and show modal
  modal.appendChild(header);
  modal.appendChild(searchContainer);
  modal.appendChild(content);
  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Focus search input
  searchInput.focus();
}
