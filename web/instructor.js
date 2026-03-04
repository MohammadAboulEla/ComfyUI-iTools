import { app } from "../../../scripts/app.js";
import { IToolsUI } from "./itools_ui.js";

const DEFAULT_TEMPLATES = [
  {
    id: "bg_swap",
    title: "🖼️ Background Swap",
    text: `Background replacement. Replace the environment with [NEW BG] while maintaining absolute consistency 
    of the subject's facial features, outfit, pose, and original camera perspective. Seamless edge blending.`,
  },
  {
    id: "env_mood",
    title: "🌙 Time & Mood",
    text: `Environmental relighting. Change the scene atmosphere to [TIME | WEATHER] with 
    [LIGHTING STYLE]. Preserve the original subject geometry and composition layout.`,
  },
  {
    id: "style_trans",
    title: "🎨 Style Transform",
    text: `Neural style transfer. Convert the image into [STYLE]. 
    Retain the global composition, spatial structure, and core [SUBJECT] design elements.`,
  },
  {
    id: "mat_change",
    title: "🧶 Material/Texture",
    text: `Physically-based rendering (PBR) texture modification. Change the surface material of [SUBJECT] to [MATERIAL]. 
    Maintain identical mesh topology, shadows, and proportions.`,
  },
  {
    id: "pose_mod",
    title: "🏃 Pose Modification",
    text: `Rigging and pose adjustment. Modify the subject's pose to [NEW POSE]. 
    Ensure strict character consistency, maintaining the exact outfit details, face ID, and environmental lighting.`,
  },
  {
    id: "expr_edit",
    title: "😊 Expression Edit",
    text: `Facial expression synthesis. Alter the expression to [EXPRESSION]. 
    Keep the bone structure, eye color, and head orientation (yaw, pitch, roll) unchanged.`,
  },
  {
    id: "outfit_chg",
    title: "👕 Wardrobe Change",
    text: `Garment replacement. Change the outfit to [NEW OUTFIT]. 
    Maintain the subject's anatomical proportions, identity (Face ID), and current action/pose.`,
  },
  {
    id: "logo_mock",
    title: "☕ Branding Mockup",
    text: `Precision logo mapping. Overlay the provided logo onto [OBJECT]. 
    Apply realistic surface displacement, texture mapping, and ambient occlusion for a natural integrated look.`,
  },
  {
    id: "logo_3d",
    title: "💎 3D Logo Effect",
    text: `3D extrusion and shading. Transform the 2D logo into a 3D emblem with [MATERIAL]. 
    Maintain the exact vector silhouette with realistic specular highlights and depth of field.`,
  },
  {
    id: "color_grade",
    title: "🌈 Color Grading",
    text: `Professional color science. Apply a [MOOD] LUT-based palette. 
    Adjust highlights, midtones, and shadows without altering the underlying image data or shapes.`,
  },
  {
    id: "add_prop",
    title: "➕ Add Element",
    text: `In-painting and object insertion. Synthesize [ITEM] into the scene. 
    Match the global illumination, shadows, and noise profile of the original image for perfect integration.`,
  },
  {
    id: "rem_obj",
    title: "➖ Remove Element",
    text: `Object removal and generative fill. Delete [ITEM] and reconstruct the underlying background 
    using context-aware synthesis, ensuring no artifacts remain.`,
  },
  {
    id: "high_retouch",
    title: "✨ Pro Retouch",
    text: `High-end frequency separation. Apply subtle skin retouching: eliminate blemishes, balance skin tones, 
    and reduce oily specular highlights while preserving micro-texture and pores.`,
  },
  {
    id: "upscale_fix",
    title: "🔍 Detail Enhancer",
    text: `Generative upscaling. Increase the resolution and inject high-frequency details into [SUBJECT / SCENE]. 
    Improve sharpness and clarity without changing the original design.`,
  },
  {
    id: "lighting_fix",
    title: "💡 Lighting Correction",
    text: `Advanced relighting. Adjust the scene's [BRIGHTNESS | CONTRAST | COLOR TEMP] using global illumination principles. 
    Preserve shadow density, specular reflections, and the original subject's structural integrity.`,
  },
  {
    id: "background_blur",
    title: "💧 Depth Blur",
    text: `Optical depth-of-field simulation. Apply a [BACKGROUND | FOREGROUND] Gaussian or lens blur. 
    Maintain sub-pixel subject sharpness and render a realistic bokeh diaphragm effect.`,
  },
  {
    id: "reflections_add",
    title: "🪞 Add Reflection",
    text: `Ray-traced reflection synthesis. Generate realistic reflections of [SUBJECT] on [SURFACE]. 
    Account for surface roughness, Fresnel effects, and accurate perspective vanishing points.`,
  },
  {
    id: "weather_effect",
    title: "☔ Weather Effects",
    text: `Atmospheric particle simulation. Superimpose [RAIN | SNOW | FOG] onto the scene. 
    Synchronize volumetric lighting, occlusion, and surface wetness/accumulation with the environment.`,
  },
  {
    id: "shadow_overlay",
    title: "🌒 Shadow Overlay",
    text: `Light masking and GOBOS. Overlay a [PATTERN | SHADOW TYPE] shadow onto [FACE | OBJECT]. 
    Adjust the penumbra softness and opacity to match the environment's ambient occlusion and light source direction.`,
  },
  {
    id: "lens_effects",
    title: "🎥 Lens Effects",
    text: `Cinematic optical artifacts. Apply [FLARE | BOKEH | DISTORTION] mimicking high-end prime lenses. 
    Maintain chromatic accuracy and natural geometric perspective.`,
  },
  {
    id: "cam_angle",
    title: "📸 Camera Angle",
    text: `Virtual cinematography. Re-render the scene from a [ANGLE] perspective. 
    Maintain 'Temporal Consistency' of all textures and character details while shifting the focal point.`,
  },
  {
    id: "environment_map",
    title: "🏞️ Environment Map",
    text: `HDRI environment remapping. Generate a cohesive lighting wrap for [SCENE | SUBJECT]. 
    Synchronize all specular highlights, ambient light bounce, and environmental reflections.`,
  },
  {
    id: "motion_blur",
    title: "🍃 Motion Blur",
    text: `Kinetic blur synthesis. Add directional motion blur to [SUBJECT | OBJECT] based on a virtual movement vector. 
    Ensure temporal edge blending while keeping static background elements perfectly sharp.`,
  },
];

app.registerExtension({
  name: "iTools.instructorNode",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsInstructorNode") return;

    let selectedItems = new Set();
    let dynamicData = {};
    let showSelectedOnly = false;

    const getUserTemplates = () =>
      JSON.parse(localStorage.getItem("iTools_userTemplates") || "[]");
    const saveUserTemplates = (templates) =>
      localStorage.setItem("iTools_userTemplates", JSON.stringify(templates));

    const getTemplateOrder = () =>
      JSON.parse(localStorage.getItem("iTools_templateOrder") || "[]");
    const saveTemplateOrder = (order) =>
      localStorage.setItem("iTools_templateOrder", JSON.stringify(order));

    const getMergedTemplates = () => {
      const userTemplates = getUserTemplates();
      const merged = DEFAULT_TEMPLATES.map((dt) => {
        const userVersion = userTemplates.find((ut) => ut.id === dt.id);
        return userVersion || dt;
      });
      const newOnes = userTemplates.filter(
        (ut) => !DEFAULT_TEMPLATES.find((dt) => dt.id === ut.id),
      );
      const all = [...merged, ...newOnes];

      const order = getTemplateOrder();
      if (order.length > 0) {
        all.sort((a, b) => {
          const idxA = order.indexOf(a.id);
          const idxB = order.indexOf(b.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }
      return all;
    };

    const showToast = (severity, summary, detail) => {
      app.extensionManager.toast.add({ severity, summary, detail, life: 2000 });
    };

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

    const header = document.createElement("div");
    header.style.cssText = `display: flex; gap: 4px;`;

    const searchInput = document.createElement("input");
    searchInput.placeholder = "Search instructions...";
    searchInput.style.cssText = `flex: 1; padding: 5px; border-radius: 4px; border: 1px solid #444; background: #333; color: white; outline: none;`;

    const addBtn = document.createElement("button");
    addBtn.innerHTML = "＋";
    addBtn.title = "Add Instruction";
    addBtn.style.cssText = `min-width: 30px; padding: 0 8px; background: #444; border: none; border-radius: 4px; color: white; cursor: pointer;`;

    const toggleFilterBtn = document.createElement("button");
    const inactiveEmoji = "⛶";
    const activeEmoji = "☐";
    const updateFilterBtnUI = () => {
      toggleFilterBtn.innerHTML = showSelectedOnly
        ? activeEmoji
        : inactiveEmoji;
      toggleFilterBtn.style.background = showSelectedOnly ? "#888" : "#444";
    };

    updateFilterBtnUI();
    toggleFilterBtn.title = "Show Selected Only";
    toggleFilterBtn.style.cssText = `min-width: 30px; padding: 0 8px; background: #444; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 14px;`;
    // Logic for Toggle Filter Button
    toggleFilterBtn.onclick = () => {
      // If user tries to filter but nothing is selected
      if (!showSelectedOnly && selectedItems.size === 0) {
        showToast(
          "warn",
          "Selection Required",
          "Please select at least one instruction from the list.",
        );
        return; // Just exit, don't change state
      }

      showSelectedOnly = !showSelectedOnly;
      updateFilterBtnUI();
      renderList(searchInput.value);
    };

    header.appendChild(searchInput);
    header.appendChild(toggleFilterBtn);
    header.appendChild(addBtn);

    const listContainer = document.createElement("div");
    listContainer.style.cssText = `flex: 1; overflow-y: auto; border: 1px solid #444; border-radius: 4px; background: #252525;`;

    const editTemplate = async (existing = null) => {
      const isDefault =
        existing && DEFAULT_TEMPLATES.some((dt) => dt.id === existing.id);
      let title = existing ? existing.title : "";

      // Only prompt for title if it's NOT a default template
      if (!isDefault) {
        title = await IToolsUI.prompt({
          title: "Template Settings",
          message: "Enter Instruction Title:",
          default: title,
        });
        if (title === null) return;
        if (title === "") {
          showToast("error", "Error", "Instruction title cannot be empty.");
          return;
        }
      }

      const text = await IToolsUI.prompt({
        title: "Template Settings",
        message: isDefault ? `Edit Instruction:` : "Enter Instruction Text:",
        type: "textarea",
        hint: "ⓘ Hint: Use your own variables inside brackets [].",
        default: existing ? existing.text : "",
      });
      if (text === null) return;
      if (text === "") {
        showToast("error", "Error", "Instruction text cannot be empty.");
        return;
      }

      let userTemplates = getUserTemplates();
      const templateId = existing ? existing.id : "user_" + Date.now();
      const idx = userTemplates.findIndex((t) => t.id === templateId);

      if (idx > -1) {
        userTemplates[idx] = { ...userTemplates[idx], title, text };
      } else {
        userTemplates.push({ id: templateId, title, text, isUser: !isDefault });
      }

      saveUserTemplates(userTemplates);
      showToast(
        "success",
        "Saved",
        `${title} ${isDefault ? "updated" : "added"}.`,
      );
      renderList(searchInput.value);
    };

    const deleteOrReset = async (template) => {
      const isDefault = DEFAULT_TEMPLATES.some((dt) => dt.id === template.id);
      const actionText = isDefault ? "reset" : "delete";

      const wantAction = await IToolsUI.confirm({
        title: `${isDefault ? "Reset" : "Delete"} Template`,
        message: `Are you sure you want to ${actionText} ${template.title} ?`,
        type: isDefault ? "reset" : "delete",
      });

      if (wantAction) {
        let userTemplates = getUserTemplates();
        const updated = userTemplates.filter((ut) => ut.id !== template.id);
        saveUserTemplates(updated);
        showToast("success", "Success", `${template.title} ${actionText}ed.`);
        renderList(searchInput.value);
      }
    };

    const renderList = (filter = "") => {
      listContainer.innerHTML = "";
      const allTemplates = getMergedTemplates();
      const userTemplates = getUserTemplates();

      allTemplates
        .filter((t) => {
          const matchesSearch = t.title
            .toLowerCase()
            .includes(filter.toLowerCase());
          const matchesSelection = !showSelectedOnly || selectedItems.has(t.id);
          return matchesSearch && matchesSelection;
        })
        .forEach((template) => {
          const itemContainer = document.createElement("div");
          itemContainer.style.cssText = `border-bottom: 1px solid #333; padding: 8px; display: flex; flex-direction: column; gap: 5px; position: relative; transition: background 0.2s;`;
          itemContainer.draggable = true;

          // Drag & Drop events
          itemContainer.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", template.id);
            itemContainer.style.opacity = "0.4";
            itemContainer.style.background = "#333";
          });

          itemContainer.addEventListener("dragend", () => {
            itemContainer.style.opacity = "1";
            itemContainer.style.background = "transparent";
          });

          itemContainer.addEventListener("dragover", (e) => {
            e.preventDefault();
            itemContainer.style.background = "#2a2a2a";
          });

          itemContainer.addEventListener("dragleave", () => {
            itemContainer.style.background = "transparent";
          });

          itemContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            itemContainer.style.background = "transparent";
            const draggedId = e.dataTransfer.getData("text/plain");
            const targetId = template.id;
            if (draggedId === targetId) return;

            const all = getMergedTemplates();
            const order = all.map((t) => t.id);
            const fromIdx = order.indexOf(draggedId);
            const toIdx = order.indexOf(targetId);

            order.splice(fromIdx, 1);
            order.splice(toIdx, 0, draggedId);

            saveTemplateOrder(order);
            renderList(searchInput.value);
          });

          const row = document.createElement("div");
          row.style.cssText = `display: flex; align-items: center; gap: 8px; cursor: pointer; padding-right: 55px;`;

          const dragHandle = document.createElement("div");
          dragHandle.innerHTML = "⋮⋮";
          dragHandle.title = "Drag to reorder";
          dragHandle.style.cssText = `cursor: grab; color: #555; font-size: 14px; margin-right: 2px; user-select: none;`;

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
            editTemplate(template);
          };

          actions.appendChild(editBtn);

          // Delete/Reset logic
          const isUserCreated = userTemplates.find(
            (ut) => ut.id === template.id,
          )?.isUser;
          const isEditedDefault =
            DEFAULT_TEMPLATES.some((dt) => dt.id === template.id) &&
            userTemplates.some((ut) => ut.id === template.id);

          if (isUserCreated) {
            const delBtn = document.createElement("div");
            delBtn.innerHTML = "✕";
            delBtn.title = "Delete";
            delBtn.style.cssText = `cursor: pointer; color: #ff5555; font-size: 14px; font-weight: bold;`;
            delBtn.onclick = (e) => {
              e.stopPropagation();
              deleteOrReset(template);
            };
            actions.appendChild(delBtn);
          } else if (isEditedDefault) {
            const resetBtn = document.createElement("div");
            resetBtn.innerHTML = "↺";
            resetBtn.title = "Reset to Default";
            resetBtn.style.cssText = `cursor: pointer; color: #55aaff; font-size: 16px;`;
            resetBtn.onclick = (e) => {
              e.stopPropagation();
              deleteOrReset(template);
            };
            actions.appendChild(resetBtn);
          }

          row.appendChild(dragHandle);
          row.appendChild(cb);
          row.appendChild(label);
          itemContainer.appendChild(row);
          itemContainer.appendChild(actions);

          const inputContainer = document.createElement("div");
          inputContainer.style.cssText = `display: ${cb.checked ? "flex" : "none"}; flex-direction: column; gap: 5px; margin-left: 22px;`;

          const placeholders = template.text.match(/\[#?([^\]]+)\]/g) || [];

          const shouldShow = cb.checked && placeholders.length > 0;
          inputContainer.style.cssText = `display: ${shouldShow ? "flex" : "none"}; flex-direction: column; gap: 5px; margin-left: 22px;`;

          placeholders.forEach((placeholder) => {
            const cleanName = placeholder.replace(/[\[\]]/g, "");

            // Container for input + clear button
            const inputWrapper = document.createElement("div");
            inputWrapper.style.cssText = `position: relative; display: flex; align-items: center;`;

            const input = document.createElement("input");
            input.placeholder = cleanName;
            input.value = dynamicData[template.id]?.[cleanName] || "";
            input.style.cssText = `background: #111; border: 1px solid #444; color: #eee; padding: 3px 20px 3px 6px; border-radius: 3px; font-size: 10px; outline: none; width: 100%;`;

            // The X button inside the input
            const clearX = document.createElement("div");
            clearX.innerHTML = "×";
            clearX.style.cssText = `position: absolute; right: 5px; cursor: pointer; color: #666; font-size: 14px; line-height: 1; display: ${input.value ? "block" : "none"};`;

            // Logic to clear input
            clearX.onclick = (ev) => {
              ev.stopPropagation();
              input.value = "";
              if (dynamicData[template.id]) {
                delete dynamicData[template.id][cleanName];
              }
              clearX.style.display = "none";
            };

            input.oninput = (ev) => {
              ev.stopPropagation();
              if (!dynamicData[template.id]) dynamicData[template.id] = {};
              dynamicData[template.id][cleanName] = input.value;
              // Show/hide X based on content
              clearX.style.display = input.value ? "block" : "none";
            };

            inputWrapper.appendChild(input);
            inputWrapper.appendChild(clearX);
            inputContainer.appendChild(inputWrapper);
          });

          itemContainer.appendChild(inputContainer);

          row.onclick = () => {
            const isChecked = !selectedItems.has(template.id);
            if (isChecked) {
              selectedItems.add(template.id);
            } else {
              selectedItems.delete(template.id);
              // Auto-disable filter if no items are left selected
              if (showSelectedOnly && selectedItems.size === 0) {
                showSelectedOnly = false;
                updateFilterBtnUI();
                // Add this line to show everything again
                renderList(searchInput.value);
                return; // Exit here since renderList already handled the update
              }
            }

            cb.checked = isChecked;
            inputContainer.style.display =
              isChecked && placeholders.length > 0 ? "flex" : "none";

            // Re-render if filtering is active to remove the unchecked item from view
            if (showSelectedOnly) {
              renderList(searchInput.value);
            }
          };

          listContainer.appendChild(itemContainer);
        });
    };

    addBtn.onclick = () => editTemplate();
    searchInput.oninput = (e) => renderList(e.target.value);

    container.appendChild(header);
    container.appendChild(listContainer);

    // init node size
    node.size = [310, 380];

    let widget = node.addDOMWidget("InstructorWidget", "custom", container, {
      getValue: () => {
        const finalStrings = [];
        const allTemplates = getMergedTemplates();
        // Follow the list order instead of selection order
        allTemplates.forEach((template) => {
          if (selectedItems.has(template.id)) {
            let processedText = template.text.replace(/\s+/g, " ");
            const placeholders = template.text.match(/\[#?([^\]]+)\]/g) || [];
            placeholders.forEach((placeholder) => {
              const cleanName = placeholder.replace(/[\[\]]/g, "");
              const val = dynamicData[template.id]?.[cleanName] || placeholder;
              processedText = processedText.replace(placeholder, val);
            });
            finalStrings.push(processedText);
          }
        });
        return {
          selected: Array.from(selectedItems),
          dynamicData: dynamicData,
          showSelectedOnly: showSelectedOnly,
          finalText: finalStrings.join("\n\n"),
        };
      },
      setValue: (v) => {
        if (v) {
          selectedItems = new Set(v.selected || []);
          dynamicData = v.dynamicData || {};
          showSelectedOnly = !!v.showSelectedOnly;
          updateFilterBtnUI();
          renderList(searchInput.value);
        }
      },
    });

    renderList();
    node.setDirtyCanvas(true, true);

    node.onResize = () => {
      if (node.size[0] < 310) {
        node.size[0] = 310;
      }
    };

    node.onRemoved = () => {
      widget = null;
    };
  },
});
