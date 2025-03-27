import { app } from "../../../scripts/app.js";
import { allow_debug } from "./js_shared.js";

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
  },
});
