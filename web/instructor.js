import { app } from "../../../scripts/app.js";

const DEFAULT_TEMPLATES = [
  { 
    id: "bg_swap", 
    title: "🖼️ Background Swap", 
    text: "Background replacement. Replace the environment with [NEW BG] while maintaining absolute consistency of the subject's facial features, outfit, pose, and original camera perspective. Seamless edge blending." 
  },
  { 
    id: "env_mood", 
    title: "🌙 Time & Mood", 
    text: "Environmental relighting. Change the scene atmosphere to [TIME/WEATHER] with [LIGHTING STYLE: e.g., Volumetric fog, Golden hour]. Preserve the original subject geometry and composition layout." 
  },
  { 
    id: "style_trans", 
    title: "🎨 Style Transform", 
    text: "Neural style transfer. Convert the image into [STYLE: e.g., Watercolor, Cel-shaded, 3D Octane Render]. Retain the global composition, spatial structure, and core [SUBJECT] design elements." 
  },
  { 
    id: "mat_change", 
    title: "🧶 Material/Texture", 
    text: "Physically-based rendering (PBR) texture modification. Change the surface material of [SUBJECT] to [MATERIAL]. Maintain identical mesh topology, shadows, and proportions." 
  },
  { 
    id: "pose_mod", 
    title: "🏃 Pose Modification", 
    text: "Rigging and pose adjustment. Modify the subject's pose to [NEW POSE]. Ensure strict character consistency, maintaining the exact outfit details, face ID, and environmental lighting." 
  },
  { 
    id: "expr_edit", 
    title: "😊 Expression Edit", 
    text: "Facial expression synthesis. Alter the expression to [EXPRESSION: e.g., Joyful, Determined]. Keep the bone structure, eye color, and head orientation (yaw, pitch, roll) unchanged." 
  },
  { 
    id: "outfit_chg", 
    title: "👕 Wardrobe Change", 
    text: "Garment replacement. Change the outfit to [NEW OUTFIT]. Maintain the subject's anatomical proportions, identity (Face ID), and current action/pose." 
  },
  { 
    id: "logo_mock", 
    title: "☕ Branding Mockup", 
    text: "Precision logo mapping. Overlay the provided logo onto [OBJECT]. Apply realistic surface displacement, texture mapping, and ambient occlusion for a natural integrated look." 
  },
  { 
    id: "logo_3d", 
    title: "💎 3D Logo Effect", 
    text: "3D extrusion and shading. Transform the 2D logo into a 3D emblem with [MATERIAL]. Maintain the exact vector silhouette with realistic specular highlights and depth of field." 
  },
  { 
    id: "cam_angle", 
    title: "📸 Camera Angle", 
    text: "Virtual cinematography. Re-render the scene from a [ANGLE] perspective. Maintain 'Temporal Consistency' of all textures and character details while shifting the focal point." 
  },
  { 
    id: "color_grade", 
    title: "🌈 Color Grading", 
    text: "Professional color science. Apply a [MOOD] LUT-based palette. Adjust highlights, midtones, and shadows without altering the underlying image data or shapes." 
  },
  { 
    id: "add_prop", 
    title: "➕ Add Element", 
    text: "In-painting and object insertion. Synthesize [ITEM] into the scene. Match the global illumination, shadows, and noise profile of the original image for perfect integration." 
  },
  { 
    id: "rem_obj", 
    title: "➖ Remove Element", 
    text: "Object removal and generative fill. Delete [ITEM] and reconstruct the underlying background using context-aware synthesis, ensuring no artifacts remain." 
  },
  { 
    id: "high_retouch", 
    title: "✨ Pro Retouch", 
    text: "High-end frequency separation. Apply subtle skin retouching: eliminate blemishes, balance skin tones, and reduce oily specular highlights while preserving micro-texture and pores." 
  },
  { 
    id: "upscale_fix", 
    title: "🔍 Detail Enhancer", 
    text: "Generative upscaling. Increase the resolution and inject high-frequency details into [SUBJECT/SCENE]. Improve sharpness and clarity without changing the original design." 
  },
];

app.registerExtension({
  name: "iTools.instructorNode",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsInstructorNode") return;

    node.size = [300, 420];
    let selectedItems = new Set();
    let dynamicData = {};

    const getUserTemplates = () => JSON.parse(localStorage.getItem("iTools_userTemplates") || "[]");
    const saveUserTemplates = (templates) => localStorage.setItem("iTools_userTemplates", JSON.stringify(templates));

    const getMergedTemplates = () => {
      const userTemplates = getUserTemplates();
      const merged = DEFAULT_TEMPLATES.map((dt) => {
        const userVersion = userTemplates.find((ut) => ut.id === dt.id);
        return userVersion || dt;
      });
      const newOnes = userTemplates.filter((ut) => !DEFAULT_TEMPLATES.find((dt) => dt.id === ut.id));
      return [...merged, ...newOnes];
    };

    const showToast = (severity, summary, detail) => {
      app.extensionManager.toast.add({ severity, summary, detail, life: 2000 });
    };

    const container = document.createElement("div");
    container.style.cssText = `display: flex; flex-direction: column; gap: 8px; padding: 5px; height: 100%; background: #1c1c1c; border-radius: 8px; color: white; font-family: sans-serif;`;

    const header = document.createElement("div");
    header.style.cssText = `display: flex; gap: 4px;`;

    const searchInput = document.createElement("input");
    searchInput.placeholder = "Search instructions...";
    searchInput.style.cssText = `flex: 1; padding: 5px; border-radius: 4px; border: 1px solid #444; background: #333; color: white; outline: none;`;

    const addBtn = document.createElement("button");
    addBtn.innerHTML = "＋";
    addBtn.style.cssText = `padding: 0 8px; background: #444; border: none; border-radius: 4px; color: white; cursor: pointer;`;

    header.appendChild(searchInput);
    header.appendChild(addBtn);

    const listContainer = document.createElement("div");
    listContainer.style.cssText = `flex: 1; overflow-y: auto; border: 1px solid #444; border-radius: 4px; background: #252525;`;

    const editTemplate = async (existing = null) => {
      const isDefault = existing && DEFAULT_TEMPLATES.some(dt => dt.id === existing.id);
      let title = existing ? existing.title : "";

      // Only prompt for title if it's NOT a default template
      if (!isDefault) {
        title = await app.extensionManager.dialog.prompt({
          title: "Template Settings",
          message: "Enter Template Title:",
          default: title,
        });
        if (title === null || title === "") {
          showToast("error", "Error", "Template title cannot be empty.");
          return;
        };
      }

      const text = await app.extensionManager.dialog.prompt({
        title: "Template Settings",
        message: isDefault ? `Edit Instruction:` : "Enter Instruction Text:",
        default: existing ? existing.text : "",
      });
      if (text === null || text === "") {
        showToast("error", "Error", "Template text cannot be empty.");
        return;
      };

      let userTemplates = getUserTemplates();
      const templateId = existing ? existing.id : "user_" + Date.now();
      const idx = userTemplates.findIndex((t) => t.id === templateId);

      if (idx > -1) {
        userTemplates[idx] = { ...userTemplates[idx], title, text };
      } else {
        userTemplates.push({ id: templateId, title, text, isUser: !isDefault });
      }

      saveUserTemplates(userTemplates);
      showToast("success", "Saved", `"${title}" updated.`);
      renderList(searchInput.value);
    };

    const deleteOrReset = async (template) => {
      const isDefault = DEFAULT_TEMPLATES.some(dt => dt.id === template.id);
      const actionText = isDefault ? "reset" : "delete";

      const wantAction = await app.extensionManager.dialog.confirm({
        title: `${isDefault ? "Reset" : "Delete"} Template`,
        message: `Are you sure you want to ${actionText} "${template.title}"?\nThis cannot be undone.`,
        type: "delete",
      });

      if (wantAction) {
        let userTemplates = getUserTemplates();
        const updated = userTemplates.filter((ut) => ut.id !== template.id);
        saveUserTemplates(updated);
        showToast("success", "Success", `Template ${actionText}ed.`);
        renderList(searchInput.value);
      }
    };

    const renderList = (filter = "") => {
      listContainer.innerHTML = "";
      const allTemplates = getMergedTemplates();
      const userTemplates = getUserTemplates();

      allTemplates
        .filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()))
        .forEach((template) => {
          const itemContainer = document.createElement("div");
          itemContainer.style.cssText = `border-bottom: 1px solid #333; padding: 8px; display: flex; flex-direction: column; gap: 5px; position: relative;`;

          const row = document.createElement("div");
          row.style.cssText = `display: flex; align-items: center; gap: 8px; cursor: pointer; padding-right: 55px;`;

          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = selectedItems.has(template.id);
          cb.style.pointerEvents = "none";

          const label = document.createElement("span");
          label.textContent = template.title;
          label.style.fontSize = "12px";
          label.style.fontWeight = "bold";

          // Action Buttons
          const actions = document.createElement("div");
          actions.style.cssText = `position: absolute; right: 8px; top: 8px; display: flex; gap: 10px; align-items: center;`;

          const editBtn = document.createElement("div");
          editBtn.innerHTML = "✎";
          editBtn.style.cssText = `cursor: pointer; color: #888; font-size: 14px;`;
          editBtn.onclick = async (e) => {
            e.stopPropagation();
            // --- Preview/Confirm Dialog ---
            const wantEdit = await app.extensionManager.dialog.confirm({
              title: "Template Actions",
              itemList: [
                `Current Title: ${template.title}`,
                `Current Template: ${template.text}`,
              ],
              hint: "Hint: Define custom variables between square brackets [].",
              message: `Do you want to edit this template?`,
            });
            if (wantEdit) editTemplate(template);
          };

          actions.appendChild(editBtn);

          // Delete/Reset logic
          const isUserCreated = userTemplates.find(ut => ut.id === template.id)?.isUser;
          const isEditedDefault = DEFAULT_TEMPLATES.some(dt => dt.id === template.id) && userTemplates.some(ut => ut.id === template.id);

          if (isUserCreated) {
            const delBtn = document.createElement("div");
            delBtn.innerHTML = "✕";
            delBtn.title = "Delete";
            delBtn.style.cssText = `cursor: pointer; color: #ff5555; font-size: 14px; font-weight: bold;`;
            delBtn.onclick = (e) => { e.stopPropagation(); deleteOrReset(template); };
            actions.appendChild(delBtn);
          } else if (isEditedDefault) {
            const resetBtn = document.createElement("div");
            resetBtn.innerHTML = "↺";
            resetBtn.title = "Reset to Default";
            resetBtn.style.cssText = `cursor: pointer; color: #55aaff; font-size: 16px;`;
            resetBtn.onclick = (e) => { e.stopPropagation(); deleteOrReset(template); };
            actions.appendChild(resetBtn);
          }

          row.appendChild(cb);
          row.appendChild(label);
          itemContainer.appendChild(row);
          itemContainer.appendChild(actions);

          const inputContainer = document.createElement("div");
          inputContainer.style.cssText = `display: ${cb.checked ? "flex" : "none"}; flex-direction: column; gap: 5px; margin-left: 22px;`;

          const placeholders = template.text.match(/\[#?([^\]]+)\]/g) || [];
          placeholders.forEach((placeholder) => {
            const cleanName = placeholder.replace(/[\[\]]/g, "");
            const input = document.createElement("input");
            input.placeholder = cleanName;
            input.value = dynamicData[template.id]?.[cleanName] || "";
            input.style.cssText = `background: #111; border: 1px solid #444; color: #eee; padding: 3px 6px; border-radius: 3px; font-size: 10px; outline: none;`;
            input.oninput = (ev) => {
              ev.stopPropagation();
              if (!dynamicData[template.id]) dynamicData[template.id] = {};
              dynamicData[template.id][cleanName] = input.value;
            };
            inputContainer.appendChild(input);
          });

          itemContainer.appendChild(inputContainer);

          row.onclick = () => {
            const isChecked = !selectedItems.has(template.id);
            if (isChecked) selectedItems.add(template.id);
            else selectedItems.delete(template.id);
            cb.checked = isChecked;
            inputContainer.style.display = isChecked ? "flex" : "none";
            node.setDirtyCanvas(true, true);
          };

          listContainer.appendChild(itemContainer);
        });
    };

    addBtn.onclick = () => editTemplate();
    searchInput.oninput = (e) => renderList(e.target.value);

    container.appendChild(header);
    container.appendChild(listContainer);

    const widget = node.addDOMWidget("InstructorWidget", "custom", container, {
      getValue: () => {
        const finalStrings = [];
        const allTemplates = getMergedTemplates();
        selectedItems.forEach((id) => {
          const template = allTemplates.find((t) => t.id === id);
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
  },
});