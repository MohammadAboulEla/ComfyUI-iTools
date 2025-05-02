import { app } from "../../../scripts/app.js";

export function addMenuTab() {
  if (!app.ui.settings.getSettingValue("iTools.Tabs.menuTab")) return;
  app.registerExtension({
    name: "makadi_iTools",
    commands: [
      {
        id: "iTools_get_prompt",
        label: "Get prompt from image",
        function: async () => {
          let file = null;
          const openFilePicker = () => {
            // Create a file input element
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/png";

            // Add an event listener to handle file selection
            input.onchange = (event) => {
              file = event.target.files[0];
              if (file) {
                console.log("Selected file:", file);
                processFile(file);
              }
            };

            // Programmatically click the input to open the file picker
            input.click();
          };

          const loadFileAsBlob = (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsArrayBuffer(file);
            });

          const readMetadata = (arrayBuffer) => {
            const metadata = {};
            const uint8 = new Uint8Array(arrayBuffer);
            const textDecoder = new TextDecoder("utf-8");

            // Loop through chunks to find metadata
            let pos = 8;
            while (pos < uint8.length) {
              const length = new DataView(arrayBuffer, pos, 4).getUint32(0);
              const chunkType = textDecoder.decode(uint8.slice(pos + 4, pos + 8));
              if (chunkType === "tEXt") {
                const textData = uint8.slice(pos + 8, pos + 8 + length);
                const keyValue = textDecoder.decode(textData).split("\x00");
                if (keyValue.length === 2) {
                  metadata[keyValue[0]] = keyValue[1];
                }
              }
              pos += 12 + length; // Move to next chunk
            }

            const jsonString = metadata["prompt"];
            return JSON.parse(jsonString);
          };

          const extractKeys = (data) => {
            const keys = ["text", "text_positive", "positive", "text_g", "text_l", "t5xxl"];
            const results = [];

            for (const key in data) {
              const inputs = data[key]?.inputs || {};

              keys.forEach((option) => {
                if (inputs[option] && typeof inputs[option] === "string") {
                  results.push(inputs[option]);
                }
              });
            }

            return results;
          };

          const findLongestString = (strings) =>
            strings.reduce((longest, current) => (current.length > longest.length ? current : longest));

          const copyToClipboard = (text) => {
            navigator.clipboard.writeText(text).catch((err) => {
              console.error("Error copying text: ", err);
            });
          };

          const processFile = async (file) => {
            try {
              const arrayBuffer = await loadFileAsBlob(file);
              const metadata = readMetadata(arrayBuffer);
              const descriptions = extractKeys(metadata);
              const longestDescription = findLongestString(descriptions);

              copyToClipboard(longestDescription);
              // console.log("Prompt copied to clipboard:", longestDescription);
              app.extensionManager.toast.add({
                severity: "success",
                summary: "Success",
                detail: "Prompt successfully copied to clipboard!",
                life: 3000,
              });
            } catch (error) {
              app.extensionManager.toast.add({
                severity: "warn",
                summary: "Alert!",
                detail: "Failed to fetch prompt from image.\n Select ComfyUI image with metadata",
                life: 4000,
              });
              console.error(`Error processing file ${file.name}: ${error.message}`);
            }
          };

          openFilePicker();
        },
      },
      // {
      //   id: "iTools_get_prompt2",
      //   label: "Get prompt from image2",
      //   function:()=>{}
      // }
    ],
    menuCommands: [
      {
        path: ["iTools"],
        commands: ["iTools_get_prompt"],
      },
    ],
  });
}

addMenuTab();
