import { app } from "../../../scripts/app.js";

const TEMPLATES = [
  // --- BACKGROUND & ENVIRONMENT ---
  {
    id: "bg_swap",
    title: "🖼️ Background Swap",
    text: "Replace the background with [DESCRIBE NEW BG], keep the subject's face, outfit, pose, and camera angle unchanged.",
  },
  {
    id: "env_mood",
    title: "🌙 Time & Mood",
    text: "Change the scene to [TIME/WEATHER] with [LIGHTING STYLE], keep the main subject and composition unchanged.",
  },
  // --- STYLE & MATERIAL ---
  {
    id: "style_trans",
    title: "🎨 Style Transform",
    text: "Convert the image into [STYLE: e.g., Watercolor, Cel-shaded, 3D Render], keep the same composition and [SUBJECT] design.",
  },
  {
    id: "mat_change",
    title: "🧶 Material/Texture",
    text: "Change the material of [SUBJECT] to [MATERIAL: e.g., Leather, Knitted fabric, Gold], keep the shapes and proportions identical.",
  },
  // --- CHARACTER & POSE ---
  {
    id: "pose_mod",
    title: "🏃 Pose Modification",
    text: "Change the subject's pose to [NEW POSE], keep the same character design, outfit, and lighting.",
  },
  {
    id: "expr_edit",
    title: "😊 Expression Edit",
    text: "Change the expression to [EXPRESSION], keep the face shape, eyes, and head angle unchanged.",
  },
  {
    id: "outfit_chg",
    title: "👕 Wardrobe Change",
    text: "Change the outfit to [NEW OUTFIT], keep the subject's identity, pose, and proportions the same.",
  },
  // --- BRANDING & MOCKUPS ---
  {
    id: "logo_mock",
    title: "☕ Branding Mockup",
    text: "Place the provided logo on [OBJECT: e.g., Mug, Bag, Wall], keep the logo shape perfectly unchanged and centered with realistic shadows.",
  },
  {
    id: "logo_3d",
    title: "💎 3D Logo Effect",
    text: "Convert the logo into a 3D extruded emblem with [MATERIAL: e.g., Polished gold, Frosted glass], keep the silhouette perfectly unchanged.",
  },
  // --- CAMERA & POST-PROCESSING ---
  {
    id: "cam_angle",
    title: "📸 Camera Angle",
    text: "Show a [ANGLE: e.g., 90-degree side view, Bird's eye view] of the subject, keep the exact same details and materials, only change the perspective.",
  },
  {
    id: "color_grade",
    title: "🌈 Color Grading",
    text: "Apply a [MOOD: e.g., Warm cinematic, Pastel] color palette, keep all objects and shapes unchanged.",
  },
  // --- ADD/REMOVE ELEMENTS ---
  {
    id: "add_prop",
    title: "➕ Add Element",
    text: "Add [ITEM] to the scene, integrate it naturally with the current lighting and keep all other elements unchanged.",
  },
  {
    id: "rem_obj",
    title: "➖ Remove Element",
    text: "Remove [ITEM] completely and fill the area naturally, keeping the rest of the image unchanged.",
  },
  // --- UTILITY ---
  {
    id: "high_retouch",
    title: "✨ Pro Retouch",
    text: "Apply natural beauty retouch: reduce shine, soften minor skin texture while keeping pores realistic and identity unchanged.",
  },
];

app.registerExtension({
  name: "iTools.instructorNode",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsInstructorNode") return;
    
    node.size = [300, 400];
    
    let selectedItems = new Set();
    let dynamicData = {};

    const container = document.createElement("div");
    container.style.cssText = `
            display: flex; flex-direction: column; gap: 8px; padding: 5px;
            height: 100%;
            background: #1c1c1c; border-radius: 8px; color: white; font-family: sans-serif;
        `;

    // 1. Search Input
    const searchInput = document.createElement("input");
    searchInput.placeholder = "Search instructions...";
    searchInput.style.cssText = `
            padding: 5px; border-radius: 4px; border: 1px solid #444;
            background: #333; color: white; outline: none;
        `;

    // 2. List Container
    const listContainer = document.createElement("div");
    listContainer.style.cssText = `
            height: 100%; overflow-y: auto; border: 1px solid #444;
            border-radius: 4px; background: #252525;
        `;

    const renderList = (filter = "") => {
      listContainer.innerHTML = "";
      TEMPLATES.filter((t) =>
        t.title.toLowerCase().includes(filter.toLowerCase())
      ).forEach((template) => {
        const itemContainer = document.createElement("div");
        itemContainer.style.cssText = `
                border-bottom: 1px solid #333;
                padding: 8px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            `;

        const row = document.createElement("div");
        row.style.cssText = `display: flex; align-items: center; gap: 8px; cursor: pointer;`;

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = selectedItems.has(template.id);
        cb.style.pointerEvents = "none";

        const label = document.createElement("span");
        label.textContent = template.title;
        label.style.fontSize = "13px";
        label.style.fontWeight = "bold";

        row.appendChild(cb);
        row.appendChild(label);
        itemContainer.appendChild(row);

        // --- Dynamic Inputs Logic ---
        const inputContainer = document.createElement("div");
        inputContainer.style.cssText = `display: ${cb.checked ? "flex" : "none"}; flex-direction: column; gap: 5px; margin-left: 25px;`;

        const placeholders = template.text.match(/\[#?([^\]]+)\]/g) || [];

        placeholders.forEach((placeholder) => {
          const cleanName = placeholder.replace(/[\[\]]/g, "");
          const input = document.createElement("input");
          input.placeholder = cleanName;
          input.value = dynamicData[template.id]?.[cleanName] || "";
          input.style.cssText = `
                background: #111; border: 1px solid #444; color: #eee; 
                padding: 4px 8px; border-radius: 3px; font-size: 11px;
                outline: none;
            `;

          // Handle input without triggering full node refresh
          input.oninput = (e) => {
            e.stopPropagation(); // Prevent ComfyUI from stealing focus
            if (!dynamicData[template.id]) dynamicData[template.id] = {};
            dynamicData[template.id][cleanName] = input.value;
            // No node.setDirtyCanvas here to keep focus
          };

          inputContainer.appendChild(input);
        });

        itemContainer.appendChild(inputContainer);

        // Row click (Toggle)
        row.onclick = () => {
          const isChecked = !selectedItems.has(template.id);
          if (isChecked) selectedItems.add(template.id);
          else selectedItems.delete(template.id);

          cb.checked = isChecked;
          inputContainer.style.display = isChecked ? "flex" : "none";
          // We don't redraw the whole list to maintain other inputs
          node.setDirtyCanvas(true, true);
        };

        listContainer.appendChild(itemContainer);
      });
    };

    searchInput.oninput = (e) => renderList(e.target.value);

    container.appendChild(searchInput);
    container.appendChild(listContainer);

    // 3. Create the widget with dynamic getValue
    const widget = node.addDOMWidget("InstructorWidget", "custom", container, {
      getValue: () => {
        // Collect everything ONLY when requested by the system
        const finalStrings = [];
        selectedItems.forEach((id) => {
          const template = TEMPLATES.find((t) => t.id === id);
          if (template) {
            let processedText = template.text;
            const placeholders = template.text.match(/\[#?([^\]]+)\]/g) || [];
            placeholders.forEach((placeholder) => {
              const cleanName = placeholder.replace(/[\[\]]/g, "");
              const val = dynamicData[id]?.[cleanName] || placeholder;
              processedText = processedText.replace(placeholder, val);
            });
            finalStrings.push(processedText);
          }
        });

        return {
          selected: Array.from(selectedItems),
          dynamicData: dynamicData,
          finalText: finalStrings.join("\n\n"),
        };
      },
      setValue: (v) => {
        if (v) {
          selectedItems = new Set(v.selected || []);
          dynamicData = v.dynamicData || {};
          renderList(searchInput.value);
        }
      },
      getMinHeight: () => 150,

    });

    renderList();
    node.setDirtyCanvas(true, true);
  },
});