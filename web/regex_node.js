import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";
import {
  BaseSmartWidgetManager,
  SmartButton,
  SmartWidget,
  SmartSlider,
  SmartLabel,
  SmartSwitch,
  SmartCheckBox,
  SmartPaintArea,
  SmartPreview,
  SmartColorPicker,
  SmartDropdownMenu,
  TextObject,
  AdvancedLabel,
  SmartInfo,
  SmartImage,
  CanvasButtonManager,
  SmartLoading,
  SmartText,
} from "./makadi.js";

const RegexPatterns = {
    patterns: {
        custom: String.raw``,
    
        // Character categories
        any_character: String.raw`.`,
        digit: String.raw`\d`,
        non_digit: String.raw`\D`,
        whitespace: String.raw`\s`,
        non_whitespace: String.raw`\S`,
        word_character: String.raw`\w`,
        non_word_character: String.raw`\W`,
    
        // Case-related
        all_caps: String.raw`\b[A-Z]+\b`,
        all_lower: String.raw`\b[a-z]+\b`,
    
        // Number patterns
        integer: String.raw`\b-?\d+\b`,
        floating_point: String.raw`-?\d+(\.\d+)?`,
        no_numbers: String.raw`\b[^0-9]+\b`,
    
        // Common patterns
        email: String.raw`\b[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b`,
        phone_number: String.raw`^\d{3}-?\d{3}-?\d{4}$`,
    
        // Quoted text
        double_quoted: String.raw`"([^"]*)"`,
        double_quoted_plus: String.raw`"[^"<>]*"`,
        single_quoted: String.raw`'([^']*)'`,
        single_quoted_plus: String.raw`'[^'<>]*'`,
    
        // Parentheses
        in_parentheses: String.raw`\((.*?)\)`,
        in_parentheses_plus: String.raw`\(.*?\)`,
    
        // Angle brackets
        angle_brackets: String.raw`<([^>]*)>`,
        angle_brackets_plus: String.raw`<[^>]*>`,
    
        // Word-based patterns
        starts_with_abc: String.raw`\babc\w*`,
        ends_with_xyz: String.raw`\b\w*xyz\b`,
        contains_hello: String.raw`hello`,
        cat_or_dog: String.raw`cat|dog`,
    },

    getPattern(name) {
        return this.patterns[name] || null;
    },

    getPatternNames() {
        return Object.keys(this.patterns);
    },

    getRegex(name) {
        if (name === "custom") return "";
        return this.getPattern(name);
    }
};


app.registerExtension({
  name: "iTools.regexNode",
  async nodeCreated(node) {
    if (node.comfyClass !== "iToolsRegexNode") {
      return;
    }
    
    function updateCustomPatternChoice(node) {
        const rp = node.widgets[1].value;
        node.widgets[2].value = "custom"
    }    

    function updatePatternChoice(node) {
        const rp = node.widgets[1].value;
        const picker = node.widgets[2].value;
        node.widgets[1].value = RegexPatterns.getRegex(picker)
    }    

    function updateLocalizedName(node) {
        const rm = node.widgets[3].value;
        const rnm = node.widgets[4].value;
    
        if (rm !== "" && rnm === "") node.outputs[0].localized_name = "replace_match";
        else if (rm !== "" && rnm !== "") node.outputs[0].localized_name = "replace";
        else if (rm === "" && rnm !== "") node.outputs[0].localized_name = "replace_non_match";
        else node.outputs[0].localized_name = "match";
    }

    // init update
    while (node.graph === null) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    updateLocalizedName(node);
    updatePatternChoice(node);
    node.setDirtyCanvas(true, true);
    if (allow_debug) console.log("nodeCreated", node);
    
    // Assign callbacks
    node.widgets[1].callback = () => updateCustomPatternChoice(node);
    node.widgets[2].callback = () => updatePatternChoice(node);
    node.widgets[3].callback = () => updateLocalizedName(node);
    node.widgets[4].callback = () => updateLocalizedName(node);

    // add button
    const help = new SmartButton(20, 147, node.width-40, 15, node,"Regex Cheat Sheet")
    help.font = this.font = "12px Arial normal";
    help.onClick = () => openMarkdownInNewTab()
    const man = new BaseSmartWidgetManager(node)
  },
});

function openMarkdownInNewTab() {
  const markdownContent = `
# Regular Expressions (Regex) Reference

## Anchors
| Pattern | Description |
|---------|-------------|
| \\\`^\\\` | Start of string or line |
| \\\`\\\\A\\\` | Start of string |
| \\\`$\\\` | End of string or line |
| \\\`\\\\Z\\\` | End of string |
| \\\`\\\\b\\\` | Word boundary |
| \\\`\\\\B\\\` | Not word boundary |
| \\\`\\\\<\\\` | Start of word |
| \\\`\\\\>\\\` | End of word |

## Character Classes
| Pattern | Description |
|---------|-------------|
| \\\`\\\\c\\\` | Control character |
| \\\`\\\\s\\\` | Whitespace [ \\\\t\\\\r\\\\n\\\\v\\\\f] |
| \\\`\\\\S\\\` | Not Whitespace [^ \\\\t\\\\r\\\\n\\\\v\\\\f] |
| \\\`\\\\d\\\` | Digit [0-9] |
| \\\`\\\\D\\\` | Not digit [^0-9] |
| \\\`\\\\w\\\` | Word [A-Za-z0-9_] |
| \\\`\\\\W\\\` | Not Word [^A-Za-z0-9_] |
| \\\`\\\\x\\\` | Hexadecimal digit [A-Fa-f0-9] |
| \\\`\\\\O\\\` | Octal Digit [0-7] |

## Pattern Modifiers
| Pattern | Description |
|---------|-------------|
| \\\`//g\\\` | Global Match (all occurrences) |
| \\\`//i\\\` | Case-insensitive |
| \\\`//m\\\` | Multiple line |
| \\\`//s\\\` | Treat string as single line |
| \\\`//x\\\` | Allow comments and whitespace |

## Special Characters
| Pattern | Description |
|---------|-------------|
| \\\`\\\\n\\\` | New line |
| \\\`\\\\r\\\` | Carriage return |
| \\\`\\\\t\\\` | Tab |
| \\\`\\\\v\\\` | Vertical tab |
| \\\`\\\\f\\\` | Form feed |
`;

  const blob = new Blob([`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Regex Cheat Sheet</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/4.0.16/marked.min.js"></script>
  <style>
    :root {
      --bg-color: #1e1e1e;
      --text-color: #e0e0e0;
      --accent-color: #4fc3f7;
      --table-border: #3a3a3a;
      --table-header-bg: #2a2a2a;
      --table-row-bg: #252525;
      --table-row-alt-bg: #2d2d2d;
      --code-bg: #252525;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    
    #container {
      max-width: 900px;
      width: 100%;
      padding: 20px;
    }
    
    h1, h2 {
      color: var(--accent-color);
      text-align: center;
    }
    
    h1 {
      border-bottom: 2px solid var(--accent-color);
      padding-bottom: 10px;
    }
    
    h2 {
      margin-top: 30px;
      border-bottom: 1px solid var(--table-border);
      padding-bottom: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: var(--table-row-bg);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    th, td {
      border: 1px solid var(--table-border);
      padding: 12px 15px;
      text-align: left;
    }
    
    th {
      background-color: var(--table-header-bg);
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: var(--table-row-alt-bg);
    }
    
    code, pre {
      font-family: 'Consolas', 'Monaco', monospace;
      background-color: var(--code-bg);
      padding: 2px 5px;
      border-radius: 3px;
      font-weight: bold;
      color: #f8f8f8;
    }
    
    pre {
      padding: 10px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="content"></div>
  </div>
  <script>
    document.getElementById("content").innerHTML = marked.parse(\`${markdownContent}\`);
  </script>
</body>
</html>
`], { type: "text/html" });

  const url = URL.createObjectURL(blob);
  window.open(url);
}

